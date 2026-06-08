import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { analyzeStoryWithMinimaxDirect } from "../src/services/minimaxDirectService.js";
import { analyzeMockTargetWithMinimaxDirect } from "../src/services/mockTargetPromptService.js";
import { buildLocalPromptExtraction } from "../src/services/promptExtractionService.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const root = path.resolve(currentDir, "..");
const distIndexPath = path.join(root, "dist", "index.html");
const runtimeConfigPath = path.join(root, "src", "config", "runtimeConfig.js");
const imageModuleConfigPath = path.join(
  root,
  "modules",
  "template-fusion",
  "src",
  "config",
  "imageModelConfig.js"
);
const port = Number(process.env.PORT || 8787);
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
const maxBodyBytes = Number(process.env.MAX_BODY_BYTES || 200000);

const apiKey = process.env.MINIMAX_API_KEY || (isProduction ? "" : await readRuntimeConfigKey());
const model = process.env.MINIMAX_MODEL || "MiniMax-M2.7";
const imageApiConfig = await readImageModuleConfig({ allowLocalConfig: !isProduction });
const indexHtml = await readFile(distIndexPath, "utf8");

const server = createServer(async (request, response) => {
  try {
    if (request.method === "OPTIONS") {
      writeCors(response);
      response.writeHead(204);
      response.end();
      return;
    }

    if (request.method === "GET" && (request.url === "/" || request.url === "/index.html")) {
      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      });
      response.end(indexHtml);
      return;
    }

    if (request.method === "POST" && request.url === "/api/story/analyze") {
      const body = await readJsonBody(request);
      const storyText = String(body.storyText || "").trim();

      if (!storyText) {
        writeJson(response, 400, {
          code: 400,
          message: "storyText 不能为空",
          data: null
        });
        return;
      }

      const generateMode = body.generateMode === "self" ? "self" : "vent";
      const analysis =
        generateMode === "vent"
          ? await analyzeMockTargetWithMinimaxDirect(storyText, { apiKey, model })
          : (await analyzeStoryWithMinimaxDirect(storyText, { apiKey, model })) ||
            buildLocalPromptExtraction(storyText);
      const data =
        generateMode === "vent"
          ? toMockTargetBackendResponse(analysis)
          : toBackendResponse(analysis, generateMode);

      writeJson(response, 200, {
        code: 200,
        message: analysis.available ? "minimax direct success" : "local fallback success",
        data
      });
      return;
    }

    if (request.method === "POST" && request.url === "/api/image/generate") {
      const body = await readJsonBody(request);
      const prompt = String(body.prompt || "").trim();

      if (!prompt) {
        writeJson(response, 400, {
          code: 400,
          message: "prompt 不能为空",
          data: null
        });
        return;
      }

      if (!imageApiConfig.apiUrl || !imageApiConfig.apiKey) {
        writeJson(response, 503, {
          code: 503,
          message: "图像模型配置缺失",
          data: null
        });
        return;
      }

      const payload = {
        ...body,
        model: body.model || imageApiConfig.model
      };
      const upstream = await fetch(imageApiConfig.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${imageApiConfig.apiKey}`
        },
        body: JSON.stringify(payload)
      });
      const raw = await upstream.json().catch(() => ({}));

      if (!upstream.ok) {
        const detail = raw?.error?.message || upstream.statusText || "Unknown error";
        writeJson(response, upstream.status, {
          code: upstream.status,
          message: `图像接口调用失败: ${detail}`,
          data: null
        });
        return;
      }

      writeJson(response, 200, {
        code: 200,
        message: "image generation success",
        data: {
          imageUrl: resolveImageUrlFromImageResponse(raw),
          raw
        }
      });
      return;
    }

    writeJson(response, 404, {
      code: 404,
      message: "not found",
      data: null
    });
  } catch (error) {
    console.error(error);
    if (error.message === "REQUEST_BODY_TOO_LARGE") {
      writeJson(response, 413, {
        code: 413,
        message: "请求内容太长",
        data: null
      });
      return;
    }

    writeJson(response, 500, {
      code: 500,
      message: "server error",
      data: null
    });
  }
});

server.listen(port, () => {
  const publicUrl = process.env.PUBLIC_URL || `http://localhost:${port}/index.html`;
  console.log(`${isProduction ? "Cloud server" : "Local demo server"}: ${publicUrl}`);
  console.log(apiKey ? "MiniMax key loaded from env/config." : "MiniMax key missing; local fallback will be used.");
  console.log(
    imageApiConfig.apiKey
      ? "Image model key loaded from env/config."
      : "Image model key missing; local template images will be used."
  );
});

async function readRuntimeConfigKey() {
  try {
    const source = await readFile(runtimeConfigPath, "utf8");
    const match = source.match(/MINIMAX_API_KEY:\s*"([^"]*)"/);
    return match?.[1]?.trim() || "";
  } catch {
    return "";
  }
}

async function readImageModuleConfig({ allowLocalConfig = true } = {}) {
  const source = allowLocalConfig
    ? await readFile(imageModuleConfigPath, "utf8").catch(() => "")
    : "";

  return {
    apiUrl:
      process.env.ARK_IMAGE_API_URL ||
      readConstString(source, "API_URL") ||
      "https://ark.cn-beijing.volces.com/api/v3/images/generations",
    apiKey:
      process.env.ARK_IMAGE_API_KEY ||
      readConstString(source, "API_KEY") ||
      "",
    model:
      process.env.ARK_IMAGE_MODEL ||
      readConstString(source, "MODEL_NAME") ||
      "doubao-seedream-5-0-260128"
  };
}

function readConstString(source, name) {
  const pattern = new RegExp(`const\\s+${name}\\s*=\\s*"([^"]*)"`);
  return source.match(pattern)?.[1]?.trim() || "";
}

function toBackendResponse(analysis, analysisMode = "self") {
  return {
    analysisId: analysis.analysisId || randomUUID().replaceAll("-", ""),
    analysisMode,
    summary: analysis.summary,
    targetRole: analysis.targetRole,
    scene: analysis.scene,
    emotion: analysis.emotion,
    emotionLevel: analysis.emotionLevel,
    complaintTags: analysis.complaintTags,
    coreConflict: analysis.coreConflict,
    visualCharacter: analysis.visualCharacter,
    ventTool: analysis.ventTool,
    memeText: analysis.memeText,
    positivePraise: analysis.positivePraise,
    imagePrompt: analysis.imagePrompt,
    animationPrompt: analysis.animationPrompt,
    safetyLevel: analysis.safetyLevel || "safe",
    confidence: analysis.confidence || 0.3,
    needUserConfirm: Boolean(analysis.needUserConfirm)
  };
}

function toMockTargetBackendResponse(analysis) {
  const mockTags = Array.isArray(analysis.mockTags) ? analysis.mockTags : [];
  const mockProps = Array.isArray(analysis.mockProps) ? analysis.mockProps : [];
  const memeTexts = Array.isArray(analysis.memeTexts) ? analysis.memeTexts : [];
  const promptLabel =
    analysis.mockTitle ||
    analysis.villainType ||
    mockTags[0] ||
    analysis.targetRole ||
    "迷惑操作";

  return {
    analysisId: randomUUID().replaceAll("-", ""),
    analysisMode: "vent",
    summary: analysis.mockSummary,
    targetRole: analysis.targetRole,
    scene: analysis.scene,
    emotion: pickMockTargetEmotion(analysis.annoyingLevel),
    emotionLevel: analysis.annoyingLevel,
    complaintTags: uniqueServerTags([
      promptLabel,
      ...mockTags,
      analysis.villainType,
      ...mockProps
    ]),
    coreConflict: analysis.coreBehavior,
    visualCharacter: analysis.visualCharacter,
    ventTool: mockProps[0] || "",
    memeText: memeTexts[0] || analysis.mockTitle || promptLabel,
    positivePraise: analysis.roastCopy || analysis.publicExecutionCopy || "",
    imagePrompt: analysis.imagePrompt,
    animationPrompt: analysis.animationPrompt,
    safetyLevel: analysis.safetyLevel || "safe",
    confidence: analysis.confidence || 0.3,
    needUserConfirm: false,
    promptLabel,
    mockTitle: analysis.mockTitle,
    mockSummary: analysis.mockSummary,
    mockTags,
    villainType: analysis.villainType,
    facialExpression: analysis.facialExpression,
    signaturePose: analysis.signaturePose,
    mockProps,
    memeTexts,
    roastCopy: analysis.roastCopy,
    publicExecutionCopy: analysis.publicExecutionCopy,
    stickerPrompt: analysis.stickerPrompt
  };
}

function pickMockTargetEmotion(level) {
  const value = Number(level || 3);
  if (value >= 5) return "爆炸";
  if (value >= 4) return "愤怒";
  if (value >= 3) return "无语";
  if (value >= 2) return "烦躁";
  return "轻微无语";
}

function uniqueServerTags(tags) {
  const result = [];

  for (const tag of tags) {
    const value = String(tag || "").trim();
    if (value && !result.includes(value)) {
      result.push(value);
    }
  }

  return result.slice(0, 6);
}

function resolveImageUrlFromImageResponse(responseJson) {
  if (typeof responseJson?.image_url === "string") {
    return responseJson.image_url;
  }

  if (typeof responseJson?.url === "string") {
    return responseJson.url;
  }

  if (typeof responseJson?.output === "string") {
    return responseJson.output;
  }

  if (Array.isArray(responseJson?.output) && typeof responseJson.output[0] === "string") {
    return responseJson.output[0];
  }

  const firstDataItem = responseJson?.data?.[0];

  if (typeof firstDataItem?.url === "string") {
    return firstDataItem.url;
  }

  if (typeof firstDataItem?.b64_json === "string") {
    return `data:image/png;base64,${firstDataItem.b64_json}`;
  }

  throw new Error("Image API response did not include a usable image url.");
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    let rejected = false;
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      if (rejected) {
        return;
      }
      raw += chunk;
      if (Buffer.byteLength(raw, "utf8") > maxBodyBytes) {
        rejected = true;
        reject(new Error("REQUEST_BODY_TOO_LARGE"));
        request.destroy();
      }
    });
    request.on("end", () => {
      if (rejected) {
        return;
      }
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function writeJson(response, statusCode, payload) {
  writeCors(response);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function writeCors(response) {
  response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (allowedOrigin !== "*") {
    response.setHeader("Vary", "Origin");
  }
}

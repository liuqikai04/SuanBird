import { buildLocalPromptExtraction } from "./promptExtractionService.js";

import { RUNTIME_CONFIG } from "../config/runtimeConfig.js";

const STORAGE_KEY = "tu-cao-minimax-api-key";
const MINIMAX_ENDPOINT = "https://api.minimaxi.com/anthropic/v1/messages";
const DEFAULT_MODEL = "MiniMax-M2.7";
const MINIMAX_DIRECT_TIMEOUT_MS = 45000;

export function getStoredMinimaxApiKey() {
  if (RUNTIME_CONFIG.MINIMAX_API_KEY) {
    return RUNTIME_CONFIG.MINIMAX_API_KEY;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function saveMinimaxApiKey(apiKey) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(apiKey || "").trim());
  } catch {
    // localStorage may be unavailable in strict browser contexts.
  }
}

export function hasStoredMinimaxApiKey() {
  return Boolean(getStoredMinimaxApiKey());
}

export async function analyzeStoryWithMinimaxDirect(storyText, options = {}) {
  const apiKey = options.apiKey || getStoredMinimaxApiKey();

  if (!apiKey || typeof fetch === "undefined") {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MINIMAX_DIRECT_TIMEOUT_MS);

  try {
    const response = await fetch(MINIMAX_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        Authorization: `Bearer ${apiKey}`,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: options.model || RUNTIME_CONFIG.MINIMAX_MODEL || DEFAULT_MODEL,
        max_tokens: 2048,
        temperature: 0.45,
        stream: false,
        messages: [
          {
            role: "user",
            content: buildDirectPrompt(storyText)
          }
        ]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      console.info("MiniMax direct call failed, using backend/local fallback.");
      return null;
    }

    const raw = await response.json();
    const content = extractContent(raw);
    const parsed = parseJsonContent(content);

    if (!parsed) {
      return null;
    }

    return normalizeDirectAnalysis(parsed, storyText);
  } catch {
    console.info("MiniMax direct call unavailable, using backend/local fallback.");
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function buildDirectPrompt(storyText) {
  return `你是一个“自嘲表情包故事理解与形象提炼助手”。

你的任务是从用户讲述的一大段糟心故事中，提取适合生成自嘲表情包、情绪释放动画和反向夸夸文案的结构化信息。

重要要求：
1. 用户不会直接给你标签，你必须从完整故事里理解事件、人物关系、情绪和槽点。
2. 不要照抄用户原文，要进行概括、归纳和创意转化。
3. 内容要适合年轻化、社交化、抖音风格表达。
4. 可以夸张、搞笑、丑萌、荒诞，但必须保持娱乐化，不能鼓励现实伤害。
5. 不要输出真实姓名、手机号、地址、公司精确名称等隐私信息。
6. 这是“自嘲模式”：不要把被吐槽对象做成主角，不要生成“甩锅侠”“画饼领导”“插队怪”这类加害者反派形象。
7. 视觉主角必须是用户自己的自嘲化处境形象，例如“被甩锅压住的打工人”“被会议抽干电量的小人”“被快递等待困住的蒜鸟”。
8. 被吐槽对象只能作为背景符号、道具或远处小元素出现，不能成为画面主体。
9. 只能输出 JSON，不要输出 Markdown，不要输出代码块，不要输出解释。

请严格按照以下 JSON 格式输出：
{
  "summary": "用一句话总结这件糟心事，控制在30字以内",
  "targetRole": "用户自己的自嘲状态称呼，例如被甩锅的打工人、被会议抽干的小人、被快递困住的人",
  "scene": "职场、生活、通勤、校园、聚会、网购、家庭、恋爱、游戏、其他 中的一个",
  "emotion": "用户主要情绪",
  "emotionLevel": 1,
  "complaintTags": ["提炼3到6个槽点标签"],
  "coreConflict": "核心不爽点，控制在40字以内",
  "visualCharacter": "用户自己的丑萌自嘲形象描述，强调被槽点击中、被迫承受、努力保持体面，不要写成加害者反派",
  "ventTool": "推荐一个非暴力情绪释放或自我保护道具",
  "memeText": "一句适合放在表情包上的第一人称或自嘲短文案，不超过18字",
  "positivePraise": "反向夸夸用户，控制在40字以内",
  "imagePrompt": "用于生成表情包画面的中文提示词，主角必须是用户自己的自嘲形象",
  "animationPrompt": "用于生成情绪释放图片的中文提示词，表现用户把槽点轻松化解",
  "safetyLevel": "safe",
  "confidence": 0.9
}

用户故事如下：
${storyText}`;
}

function extractContent(raw) {
  const content = raw?.content;
  if (Array.isArray(content)) {
    return content
      .map((item) => item?.text || "")
      .filter(Boolean)
      .join("");
  }

  return raw?.reply || raw?.choices?.[0]?.message?.content || "";
}

function parseJsonContent(content) {
  const trimmed = String(content || "")
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start < 0 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalizeDirectAnalysis(data, storyText) {
  const fallback = buildLocalPromptExtraction(storyText);
  const tags = Array.isArray(data.complaintTags)
    ? data.complaintTags.filter(Boolean).slice(0, 6)
    : [];
  const promptLabel =
    tags[0] || data.targetRole || data.memeText || fallback.promptLabel;

  return {
    source: "direct",
    available: true,
    analysisId: "",
    summary: data.summary || fallback.summary,
    targetRole: data.targetRole || fallback.targetRole,
    scene: data.scene || fallback.scene,
    emotion: data.emotion || fallback.emotion,
    emotionLevel: Number(data.emotionLevel || fallback.emotionLevel),
    complaintTags: uniqueDirectTags([promptLabel, ...tags, ...fallback.complaintTags]),
    coreConflict: data.coreConflict || fallback.coreConflict,
    visualCharacter: data.visualCharacter || fallback.visualCharacter,
    ventTool: data.ventTool || fallback.ventTool,
    memeText: data.memeText || promptLabel,
    positivePraise: data.positivePraise || fallback.positivePraise,
    imagePrompt: data.imagePrompt || fallback.imagePrompt,
    animationPrompt: data.animationPrompt || fallback.animationPrompt,
    safetyLevel: data.safetyLevel || "safe",
    confidence: Number(data.confidence ?? fallback.confidence),
    needUserConfirm: Boolean(data.needUserConfirm),
    promptLabel
  };
}

function uniqueDirectTags(tags) {
  const normalized = [];

  for (const tag of tags) {
    const value = String(tag || "").trim();
    if (value && !normalized.includes(value)) {
      normalized.push(value);
    }
  }

  return normalized.slice(0, 6);
}

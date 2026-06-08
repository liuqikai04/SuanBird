import { pickSceneByText } from "../templates/sceneRules.js";
import { buildFallbackCompliment } from "../templates/complimentTemplates.js";
import { analyzeStoryWithMinimaxDirect } from "./minimaxDirectService.js";
import { analyzeMockTargetWithMinimaxDirect } from "./mockTargetPromptService.js";
import { buildAnalyzeStoryRequest } from "./storyAnalyzeRequest.js";

const DEFAULT_ENDPOINT = "http://localhost:8080/api/story/analyze";
const MIN_REMOTE_TEXT_LENGTH = 20;
const REQUEST_TIMEOUT_MS = 45000;
const MODE_SELF = "self";
const MODE_VENT = "vent";

const sceneAlias = {
  校园: "生活",
  聚会: "社交",
  网购: "消费",
  家庭: "生活",
  恋爱: "社交",
  游戏: "生活"
};

export async function extractPromptFromStory(text, options = {}) {
  const storyText = String(text || "").trim();
  const generateMode = normalizeGenerateMode(options.generateMode);

  if (generateMode === MODE_VENT) {
    const mockTargetResult = await analyzeMockTargetWithMinimaxDirect(storyText, options);

    if (mockTargetResult.available) {
      return buildPromptExtractionFromMockTarget(mockTargetResult, storyText);
    }

    const remoteResult = await tryRemotePromptExtraction(storyText, {
      ...options,
      generateMode
    });

    if (remoteResult) {
      return remoteResult;
    }

    return buildPromptExtractionFromMockTarget(mockTargetResult, storyText);
  }

  if (storyText.length >= MIN_REMOTE_TEXT_LENGTH) {
    const directResult = await analyzeStoryWithMinimaxDirect(storyText, options);

    if (directResult) {
      return directResult;
    }

    const remoteResult = await tryRemotePromptExtraction(storyText, options);

    if (remoteResult) {
      return remoteResult;
    }
  }

  return {
    ...buildLocalPromptExtraction(storyText),
    analysisMode: MODE_SELF
  };
}

export function buildLocalPromptExtraction(text) {
  const sceneInfo = pickSceneByText(text);
  const promptLabel = pickCoreLabel(text, sceneInfo);
  const selfTargetRole = buildSelfTargetRole(promptLabel, sceneInfo);

  return {
    source: "local",
    analysisMode: MODE_SELF,
    available: false,
    analysisId: "",
    summary: summarizeText(text),
    targetRole: selfTargetRole,
    scene: sceneInfo.scene,
    emotion: sceneInfo.emotion,
    emotionLevel: 3,
    complaintTags: uniqueTags([promptLabel, ...sceneInfo.tags]),
    coreConflict: summarizeText(text),
    visualCharacter: `一个${selfTargetRole}，被“${promptLabel}”槽点击中但努力保持体面，表情委屈又好笑，适合做自嘲表情包主角`,
    ventTool: "",
    memeText: promptLabel,
    positivePraise: buildFallbackCompliment(sceneInfo, text),
    imagePrompt: `${sceneInfo.scene}场景，${selfTargetRole}作为主角，被“${promptLabel}”槽点击中，丑萌卡通自嘲表情包，夸张但不攻击真实个人`,
    animationPrompt: `${sceneInfo.scene}场景里，${selfTargetRole}用夸张弹性动画把“${promptLabel}”槽点轻松化解，搞笑自嘲，不伤害真实人物`,
    safetyLevel: "safe",
    confidence: 0.45,
    needUserConfirm: false,
    promptLabel
  };
}

async function tryRemotePromptExtraction(storyText, options) {
  if (typeof fetch === "undefined") {
    return null;
  }

  const endpoint =
    options.endpoint ||
    globalThis.__PROMPT_EXTRACTION_ENDPOINT__ ||
    getDefaultEndpoint();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(buildAnalyzeStoryRequest(storyText, options)),
      signal: controller.signal
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    if (!payload || payload.code !== 200 || !payload.data) {
      console.info("Prompt extraction service returned no usable data, using local fallback.");
      return null;
    }

    return normalizeRemoteAnalysis(payload.data, storyText, options);
  } catch {
    console.info("Prompt extraction service unavailable, using local fallback.");
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function getDefaultEndpoint() {
  if (
    typeof window !== "undefined" &&
    window.location?.protocol?.startsWith("http") &&
    window.location?.origin
  ) {
    return `${window.location.origin}/api/story/analyze`;
  }

  return DEFAULT_ENDPOINT;
}

function normalizeRemoteAnalysis(data, text, options = {}) {
  const fallback = buildLocalPromptExtraction(text);
  const complaintTags = Array.isArray(data.complaintTags)
    ? data.complaintTags.filter(Boolean).slice(0, 6)
    : [];
  const scene = normalizeScene(data.scene || fallback.scene);
  const promptLabel = pickPromptLabel(data, complaintTags, fallback.promptLabel);

  return {
    source: "remote",
    analysisMode: normalizeGenerateMode(data.analysisMode || options.generateMode || MODE_SELF),
    available: true,
    analysisId: data.analysisId || "",
    summary: data.summary || fallback.summary,
    targetRole: data.targetRole || fallback.targetRole,
    scene,
    emotion: data.emotion || fallback.emotion,
    emotionLevel: data.emotionLevel || fallback.emotionLevel,
    complaintTags: uniqueTags([promptLabel, ...complaintTags, ...fallback.complaintTags]),
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
    promptLabel,
    mockTitle: data.mockTitle,
    mockSummary: data.mockSummary,
    mockTags: data.mockTags,
    villainType: data.villainType,
    facialExpression: data.facialExpression,
    signaturePose: data.signaturePose,
    mockProps: data.mockProps,
    memeTexts: data.memeTexts,
    roastCopy: data.roastCopy,
    publicExecutionCopy: data.publicExecutionCopy,
    stickerPrompt: data.stickerPrompt
  };
}

function buildPromptExtractionFromMockTarget(mockTarget, text) {
  const fallback = buildLocalPromptExtraction(text);
  const mockTags = Array.isArray(mockTarget.mockTags)
    ? mockTarget.mockTags.filter(Boolean)
    : [];
  const mockProps = Array.isArray(mockTarget.mockProps)
    ? mockTarget.mockProps.filter(Boolean)
    : [];
  const memeTexts = Array.isArray(mockTarget.memeTexts)
    ? mockTarget.memeTexts.filter(Boolean)
    : [];
  const promptLabel =
    mockTarget.mockTitle ||
    mockTarget.villainType ||
    mockTags[0] ||
    fallback.promptLabel;
  const memeText = memeTexts[0] || mockTarget.mockTitle || promptLabel;

  return {
    source: mockTarget.source,
    analysisMode: MODE_VENT,
    available: Boolean(mockTarget.available),
    analysisId: "",
    summary: mockTarget.mockSummary || fallback.summary,
    targetRole: mockTarget.targetRole || fallback.targetRole,
    scene: normalizeScene(mockTarget.scene || fallback.scene),
    emotion: pickVentEmotion(mockTarget.annoyingLevel),
    emotionLevel: mockTarget.annoyingLevel || fallback.emotionLevel,
    complaintTags: uniqueTags([
      promptLabel,
      ...mockTags,
      mockTarget.villainType,
      ...mockProps
    ]),
    coreConflict: mockTarget.coreBehavior || fallback.coreConflict,
    visualCharacter: mockTarget.visualCharacter || fallback.visualCharacter,
    ventTool: mockProps[0] || fallback.ventTool,
    memeText,
    positivePraise:
      mockTarget.roastCopy ||
      mockTarget.publicExecutionCopy ||
      fallback.positivePraise,
    imagePrompt: mockTarget.imagePrompt || fallback.imagePrompt,
    animationPrompt: mockTarget.animationPrompt || fallback.animationPrompt,
    safetyLevel: mockTarget.safetyLevel || "safe",
    confidence: Number(mockTarget.confidence ?? fallback.confidence),
    needUserConfirm: false,
    promptLabel,
    mockTitle: mockTarget.mockTitle,
    mockSummary: mockTarget.mockSummary,
    mockTags,
    villainType: mockTarget.villainType,
    facialExpression: mockTarget.facialExpression,
    signaturePose: mockTarget.signaturePose,
    mockProps,
    memeTexts,
    roastCopy: mockTarget.roastCopy,
    publicExecutionCopy: mockTarget.publicExecutionCopy,
    stickerPrompt: mockTarget.stickerPrompt
  };
}

function normalizeGenerateMode(mode) {
  return mode === MODE_SELF ? MODE_SELF : MODE_VENT;
}

function pickVentEmotion(level) {
  const value = Number(level || 3);
  if (value >= 5) return "爆炸";
  if (value >= 4) return "愤怒";
  if (value >= 3) return "无语";
  if (value >= 2) return "烦躁";
  return "轻微无语";
}

function normalizeScene(scene) {
  return sceneAlias[scene] || scene;
}

function pickPromptLabel(data, complaintTags, fallbackLabel) {
  return (
    complaintTags[0] ||
    data.targetRole ||
    data.memeText ||
    data.summary ||
    fallbackLabel ||
    "离谱操作"
  );
}

function pickCoreLabel(text, sceneInfo) {
  const rules = [
    { label: "甩锅", keywords: ["甩锅", "背锅", "抢功", "把锅甩", "锅甩", "甩到"] },
    { label: "画饼", keywords: ["画饼", "开会", "汇报"] },
    { label: "插队", keywords: ["插队", "排队"] },
    { label: "货不对板", keywords: ["货不对板", "外卖", "售后", "退款"] },
    { label: "已读不回", keywords: ["已读不回", "爽约", "冷场"] },
    { label: "通勤崩溃", keywords: ["堵车", "地铁", "迟到"] }
  ];

  for (const rule of rules) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.label;
    }
  }

  return sceneInfo.tags[0] || sceneInfo.object || "离谱操作";
}

function buildSelfTargetRole(promptLabel, sceneInfo) {
  const roleByLabel = {
    甩锅: "被甩锅的打工人",
    画饼: "被画饼喂饱的清醒打工人",
    插队: "被插队创到的排队人",
    货不对板: "被货不对板整沉默的消费者",
    已读不回: "被已读不回卡住的聊天人",
    通勤崩溃: "被通勤挤扁的赶路人"
  };

  return (
    roleByLabel[promptLabel] ||
    `${sceneInfo.scene || "生活"}里被${promptLabel}击中的自嘲小人`
  );
}

function summarizeText(text) {
  const trimmed = String(text || "").trim();
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}...` : trimmed;
}

function uniqueTags(tags) {
  const result = [];

  for (const tag of tags) {
    const value = String(tag || "").trim();
    if (value && !result.includes(value)) {
      result.push(value);
    }
  }

  return result.slice(0, 6);
}

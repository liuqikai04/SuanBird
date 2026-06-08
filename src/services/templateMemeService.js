import {
  buildImageRequestPayload,
  resolveImageUrlFromResponse
} from "../config/imageModelConfig.js";
import { getTemplateProfile } from "../config/templateProfiles.js";
import { selectImageTemplateKey } from "../templates/imageTemplateLibrary.js";
import { buildTemplateAwarePrompt, inferTitleHint } from "./promptComposer.js";
import { createFusionImage } from "./templateFusionService.js";

const profileByTemplateKey = {
  workplace: "monster-atlas",
  commute: "creature-flashcard",
  social: "furry-mascot-sheet",
  life: "pastel-plush-bestiary",
  default: "monster-atlas"
};
const directProfileIds = [
  "monster-atlas",
  "creature-flashcard",
  "furry-mascot-sheet",
  "pastel-plush-bestiary",
  "sticker-emoji-creature",
  "scratchboard-night-creature",
  "garlic-bird-grid-localization"
];
const garlicBirdProfileKeywords = [
  "会议隐身",
  "低电量",
  "社交低电量",
  "稍后再回",
  "尬聊",
  "快递",
  "包裹",
  "咖啡翻车",
  "密码失忆",
  "日程爆满",
  "计划泡汤",
  "淋雨上班",
  "深夜加餐",
  "手滑发出",
  "预算乐观",
  "贪睡冠军",
  "加购不买",
  "天气乱炖",
  "守护独处",
  "自嘲",
  "低能量",
  "轻吐槽"
];
const stickerProfileKeywords = [
  "已读不回",
  "不回",
  "双标",
  "临时鸽",
  "鸽",
  "嘴硬",
  "社交装死",
  "消息",
  "朋友圈",
  "装无辜"
];
const scratchboardProfileKeywords = [
  "甩锅",
  "背刺",
  "压榨",
  "冷暴力",
  "会议折磨",
  "会议",
  "推责",
  "责任",
  "加班",
  "甩锅锅盖"
];

export async function createTemplateMemeImage(aiResult, styleSeed = "") {
  if (typeof fetch === "undefined") {
    return null;
  }

  const templateKey = selectImageTemplateKey(aiResult);
  const templateProfileId = selectTemplateProfileId(templateKey, styleSeed, aiResult);
  const templateProfile = getTemplateProfile(templateProfileId);
  const userPrompt = buildComplaintTemplatePrompt(aiResult);
  const fileName = `${templateKey}-${templateProfileId}.png`;
  const finalPrompt = buildTemplateAwarePrompt({
    userPrompt,
    fileName,
    templateProfile
  });
  const payload = buildImageRequestPayload({
    prompt: finalPrompt,
    templateImage: "",
    fileName,
    useTemplateImage: false
  });

  try {
    const response = await createFusionImage({
      payload,
      resolveImageUrlFromResponse
    });

    return {
      imageUrl: response.imageUrl,
      raw: response.raw,
      finalPrompt,
      templateKey,
      templateProfileId: templateProfile.id,
      templateProfileLabel: templateProfile.label,
      titleHint: inferTitleHint(userPrompt, fileName, templateProfile)
    };
  } catch (error) {
    console.info("Template fusion image generation unavailable, using local template image.", error);
    return null;
  }
}

export function buildComplaintTemplatePrompt(aiResult) {
  const tags = [...(aiResult.tags || []), ...(aiResult.complaintTags || [])]
    .filter(Boolean)
    .join("、");
  const mockProps = Array.isArray(aiResult.mockProps)
    ? aiResult.mockProps.filter(Boolean).join("、")
    : "";
  const lines = [
    `表情包标题写“${aiResult.memeText || aiResult.promptLabel || "离谱操作"}”`,
    aiResult.summary ? `事件摘要：${aiResult.summary}` : "",
    aiResult.coreConflict ? `核心冲突：${aiResult.coreConflict}` : "",
    aiResult.mockTitle ? `恶搞称号：${aiResult.mockTitle}` : "",
    aiResult.villainType ? `反派类型：${aiResult.villainType}` : "",
    aiResult.visualCharacter ? `角色设定：${aiResult.visualCharacter}` : "",
    aiResult.facialExpression ? `表情：${aiResult.facialExpression}` : "",
    aiResult.signaturePose ? `动作：${aiResult.signaturePose}` : "",
    mockProps ? `槽点道具：${mockProps}` : "",
    aiResult.imagePrompt ? `画面提示词：${aiResult.imagePrompt}` : "",
    aiResult.animationPrompt ? `动势提示词：${aiResult.animationPrompt}` : "",
    aiResult.stickerPrompt ? `贴纸提示词：${aiResult.stickerPrompt}` : "",
    tags ? `槽点标签：${tags}` : "",
    `场景：${aiResult.scene || "其他"}`,
    `情绪：${aiResult.emotion || "无语"}`
  ];

  return lines.filter(Boolean).join("；");
}

export function selectTemplateProfileId(templateKey, styleSeed, aiResult = {}) {
  if (styleSeed && directProfileIds.includes(styleSeed)) {
    return styleSeed;
  }

  if (styleSeed && profileByTemplateKey[styleSeed]) {
    return profileByTemplateKey[styleSeed];
  }

  const haystack = buildTemplateSelectionHaystack(aiResult);

  if (
    aiResult.generateMode === "self" ||
    aiResult.analysisMode === "self" ||
    garlicBirdProfileKeywords.some((keyword) => haystack.includes(keyword))
  ) {
    return "garlic-bird-grid-localization";
  }

  if (scratchboardProfileKeywords.some((keyword) => haystack.includes(keyword))) {
    return "scratchboard-night-creature";
  }

  if (stickerProfileKeywords.some((keyword) => haystack.includes(keyword))) {
    return "sticker-emoji-creature";
  }

  return profileByTemplateKey[templateKey] || profileByTemplateKey.default;
}

function buildTemplateSelectionHaystack(aiResult) {
  return [
    aiResult.scene,
    aiResult.emotion,
    aiResult.object,
    aiResult.promptLabel,
    aiResult.summary,
    aiResult.coreConflict,
    aiResult.visualCharacter,
    aiResult.memeText,
    aiResult.imagePrompt,
    aiResult.animationPrompt,
    aiResult.mockTitle,
    aiResult.villainType,
    aiResult.facialExpression,
    aiResult.signaturePose,
    aiResult.roastCopy,
    aiResult.publicExecutionCopy,
    aiResult.stickerPrompt,
    ...(aiResult.tags || []),
    ...(aiResult.complaintTags || []),
    ...(aiResult.mockTags || []),
    ...(aiResult.mockProps || []),
    ...(aiResult.memeTexts || [])
  ]
    .filter(Boolean)
    .join(" ");
}

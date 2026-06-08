import { pickSceneByText } from "../../templates/sceneRules.js";
import { buildFallbackCompliment } from "../../templates/complimentTemplates.js";
import { getPlaceholderImage } from "../../services/imageService.js";
import { createResultId } from "./generateTypes.js";

export function generateFallbackResult(text) {
  const sceneInfo = pickSceneByText(text);

  return {
    id: createResultId(),
    text,
    scene: sceneInfo.scene,
    emotion: sceneInfo.emotion,
    object: sceneInfo.object,
    tags: sceneInfo.tags,
    compliment: buildFallbackCompliment(sceneInfo, text),
    imageUrl: getPlaceholderImage(sceneInfo.scene),
    summary: text.length > 42 ? `${text.slice(0, 42)}...` : text,
    promptLabel: sceneInfo.tags[0] || sceneInfo.scene,
    imagePrompt: `${sceneInfo.scene}场景，${sceneInfo.tags.join("，")}，丑萌表情包`,
    visualCharacter: `${sceneInfo.object}变成一个丑萌夸张的表情包角色`,
    memeText: sceneInfo.tags[0] || sceneInfo.scene,
    animationPrompt: `${sceneInfo.scene}场景里用夸张弹性动画把槽点拍扁，轻松搞笑，不伤害真实人物`,
    generateMode: "vent",
    mockTitle: "",
    mockSummary: "",
    mockTags: [],
    villainType: "",
    facialExpression: "",
    signaturePose: "",
    mockProps: [],
    memeTexts: [],
    roastCopy: "",
    publicExecutionCopy: "",
    stickerPrompt: "",
    templatePrompt: "",
    templateKey: "",
    requestedTemplateProfileId: "auto",
    templateProfileId: "",
    templateProfileLabel: "",
    templateTitle: "",
    promptSource: "fallback",
    sourceType: "text",
    needUserConfirm: false,
    createdAt: new Date().toISOString()
  };
}

import { pickSceneByText } from "../templates/sceneRules.js";
import { buildFallbackCompliment } from "../templates/complimentTemplates.js";

export async function analyzeTextAndCompliment(text) {
  const apiResult = await tryRemoteAnalyze(text);

  if (apiResult) {
    return normalizeAiResult(apiResult, text);
  }

  const sceneInfo = pickSceneByText(text);

  return {
    ...sceneInfo,
    compliment: buildFallbackCompliment(sceneInfo, text)
  };
}

export function buildAiResultFromPromptExtraction(promptAnalysis, text) {
  const sceneInfo = pickSceneByText(text);

  return {
    scene: promptAnalysis.scene || sceneInfo.scene,
    object: promptAnalysis.targetRole || sceneInfo.object,
    emotion: promptAnalysis.emotion || sceneInfo.emotion,
    tags:
      Array.isArray(promptAnalysis.complaintTags) &&
      promptAnalysis.complaintTags.length
        ? promptAnalysis.complaintTags
        : sceneInfo.tags,
    compliment:
      promptAnalysis.positivePraise ||
      buildFallbackCompliment(sceneInfo, text),
    summary: promptAnalysis.summary,
    coreConflict: promptAnalysis.coreConflict,
    promptLabel: promptAnalysis.promptLabel,
    imagePrompt: promptAnalysis.imagePrompt,
    visualCharacter: promptAnalysis.visualCharacter,
    memeText: promptAnalysis.memeText,
    animationPrompt: promptAnalysis.animationPrompt,
    analysisMode: promptAnalysis.analysisMode,
    mockTitle: promptAnalysis.mockTitle,
    mockSummary: promptAnalysis.mockSummary,
    mockTags: promptAnalysis.mockTags,
    villainType: promptAnalysis.villainType,
    facialExpression: promptAnalysis.facialExpression,
    signaturePose: promptAnalysis.signaturePose,
    mockProps: promptAnalysis.mockProps,
    memeTexts: promptAnalysis.memeTexts,
    roastCopy: promptAnalysis.roastCopy,
    publicExecutionCopy: promptAnalysis.publicExecutionCopy,
    stickerPrompt: promptAnalysis.stickerPrompt,
    confidence: promptAnalysis.confidence,
    promptSource: promptAnalysis.source,
    needUserConfirm: promptAnalysis.needUserConfirm
  };
}

function normalizeAiResult(apiResult, text) {
  const sceneInfo = pickSceneByText(text);

  return {
    scene: apiResult.scene || sceneInfo.scene,
    object: apiResult.object || sceneInfo.object,
    emotion: apiResult.emotion || sceneInfo.emotion,
    tags:
      Array.isArray(apiResult.tags) && apiResult.tags.length
        ? apiResult.tags
        : sceneInfo.tags,
    compliment: apiResult.compliment || buildFallbackCompliment(sceneInfo, text)
  };
}

async function tryRemoteAnalyze() {
  return null;
}

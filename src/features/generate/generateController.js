import {
  analyzeTextAndCompliment,
  buildAiResultFromPromptExtraction
} from "../../services/aiService.js";
import { getTemplateProfile } from "../../config/templateProfiles.js";
import { createImageForResult, getTemplateImage } from "../../services/imageService.js";
import { checkContentSafety } from "../../services/moderationService.js";
import { extractPromptFromStory } from "../../services/promptExtractionService.js";
import { generateFallbackResult } from "./fallbackGenerator.js";
import { createResultId } from "./generateTypes.js";

export async function generateResult(request) {
  const textResult = await generateTextResult(request);
  return completeImageForResult(textResult, request);
}

export async function generateTextResult(request) {
  const safety = checkContentSafety(request.text);

  if (!safety.ok) {
    const fallback = generateFallbackResult(safety.safeText);
    return {
      ...fallback,
      tags: [...fallback.tags, "已脱敏"],
      imageStatus: "ready",
      imageGenerating: false
    };
  }

  try {
    const promptAnalysis = await extractPromptFromStory(safety.safeText, {
      sourceType: request.sourceType,
      generateMode: request.generateMode,
      timestamp: request.timestamp
    });
    const aiResult = promptAnalysis
      ? buildAiResultFromPromptExtraction(promptAnalysis, safety.safeText)
      : await analyzeTextAndCompliment(safety.safeText);
    const requestedTemplateProfileId = normalizeGenerateTemplateProfileId(
      request.templateProfileId
    );
    const requestedTemplateProfile = requestedTemplateProfileId
      ? getTemplateProfile(requestedTemplateProfileId)
      : null;

    return {
      id: createResultId(),
      text: safety.safeText,
      scene: aiResult.scene,
      emotion: aiResult.emotion,
      object: aiResult.object,
      tags: aiResult.tags,
      compliment: aiResult.compliment,
      imageUrl: getTemplateImage(aiResult),
      summary: aiResult.summary || safety.safeText,
      promptLabel: aiResult.promptLabel || aiResult.tags[0] || aiResult.scene,
      imagePrompt: aiResult.imagePrompt || "",
      visualCharacter: aiResult.visualCharacter || "",
      memeText: aiResult.memeText || "",
      animationPrompt: aiResult.animationPrompt || "",
      generateMode: aiResult.analysisMode || request.generateMode || "vent",
      mockTitle: aiResult.mockTitle || "",
      mockSummary: aiResult.mockSummary || "",
      mockTags: aiResult.mockTags || [],
      villainType: aiResult.villainType || "",
      facialExpression: aiResult.facialExpression || "",
      signaturePose: aiResult.signaturePose || "",
      mockProps: aiResult.mockProps || [],
      memeTexts: aiResult.memeTexts || [],
      roastCopy: aiResult.roastCopy || "",
      publicExecutionCopy: aiResult.publicExecutionCopy || "",
      stickerPrompt: aiResult.stickerPrompt || "",
      templatePrompt: aiResult.templatePrompt || "",
      templateKey: aiResult.templateKey || "",
      requestedTemplateProfileId: requestedTemplateProfileId || "auto",
      templateProfileId: aiResult.templateProfileId || requestedTemplateProfileId,
      templateProfileLabel:
        aiResult.templateProfileLabel || requestedTemplateProfile?.label || "",
      templateTitle: aiResult.templateTitle || "",
      promptSource: aiResult.promptSource || "local",
      sourceType: request.sourceType || "text",
      needUserConfirm: Boolean(aiResult.needUserConfirm),
      imageStatus: "pending",
      imageGenerating: true,
      imageError: "",
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.warn("AI generation failed, using fallback.", error);
    return {
      ...generateFallbackResult(safety.safeText),
      imageStatus: "ready",
      imageGenerating: false
    };
  }
}

export async function completeImageForResult(result, request = {}) {
  if (!result || result.imageStatus !== "pending") {
    return result;
  }

  const requestedTemplateProfileId = normalizeGenerateTemplateProfileId(
    result.requestedTemplateProfileId || request.templateProfileId
  );
  const requestedTemplateProfile = requestedTemplateProfileId
    ? getTemplateProfile(requestedTemplateProfileId)
    : null;

  try {
    const imageUrl = await createImageForResult(
      result,
      requestedTemplateProfileId || request.styleSeed
    );

    return {
      ...result,
      imageUrl,
      templatePrompt: result.templatePrompt || "",
      templateKey: result.templateKey || "",
      requestedTemplateProfileId: requestedTemplateProfileId || "auto",
      templateProfileId: result.templateProfileId || requestedTemplateProfileId,
      templateProfileLabel:
        result.templateProfileLabel || requestedTemplateProfile?.label || "",
      templateTitle: result.templateTitle || "",
      imageStatus: "ready",
      imageGenerating: false,
      imageError: ""
    };
  } catch (error) {
    console.warn("Image generation failed, keeping local template image.", error);
    return {
      ...result,
      imageStatus: "ready",
      imageGenerating: false,
      imageError: "图片生成失败，已保留本地模板图"
    };
  }
}

function normalizeGenerateTemplateProfileId(value) {
  return value && value !== "auto" ? value : "";
}

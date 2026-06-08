import { analyzeTextAndCompliment } from "../../services/aiService.js";
import { createImageForResult } from "../../services/imageService.js";
import { checkContentSafety } from "../../services/moderationService.js";
import { generateFallbackResult } from "./fallbackGenerator.js";
import { createResultId } from "./generateTypes.js";

export async function generateResult(request) {
  const safety = checkContentSafety(request.text);

  if (!safety.ok) {
    const fallback = generateFallbackResult(safety.safeText);
    return {
      ...fallback,
      tags: [...fallback.tags, "已脱敏"]
    };
  }

  try {
    const aiResult = await analyzeTextAndCompliment(safety.safeText);
    const imageUrl = await createImageForResult(aiResult, request.styleSeed);

    return {
      id: createResultId(),
      text: safety.safeText,
      scene: aiResult.scene,
      emotion: aiResult.emotion,
      object: aiResult.object,
      tags: aiResult.tags,
      compliment: aiResult.compliment,
      imageUrl,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.warn("AI generation failed, using fallback.", error);
    return generateFallbackResult(safety.safeText);
  }
}

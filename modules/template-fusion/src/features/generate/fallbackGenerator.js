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
    createdAt: new Date().toISOString()
  };
}

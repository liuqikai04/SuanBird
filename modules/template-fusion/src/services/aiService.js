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

function normalizeAiResult(apiResult, text) {
  const sceneInfo = pickSceneByText(text);

  return {
    scene: apiResult.scene || sceneInfo.scene,
    object: apiResult.object || sceneInfo.object,
    emotion: apiResult.emotion || sceneInfo.emotion,
    tags: Array.isArray(apiResult.tags) && apiResult.tags.length ? apiResult.tags : sceneInfo.tags,
    compliment: apiResult.compliment || buildFallbackCompliment(sceneInfo, text)
  };
}

async function tryRemoteAnalyze() {
  return null;
}

import { buildImagePrompt } from "../templates/imagePromptTemplates.js";
import workplaceUrl from "../assets/placeholder/workplace.svg";
import commuteUrl from "../assets/placeholder/commute.svg";
import lifeUrl from "../assets/placeholder/life.svg";
import socialUrl from "../assets/placeholder/social.svg";
import defaultUrl from "../assets/placeholder/default.svg";

const placeholderByScene = {
  职场: workplaceUrl,
  通勤: commuteUrl,
  生活: lifeUrl,
  消费: lifeUrl,
  社交: socialUrl,
  其他: defaultUrl
};

export async function createImageForResult(aiResult, styleSeed) {
  const remoteImage = await tryRemoteImage(aiResult, styleSeed);
  return remoteImage || getPlaceholderImage(aiResult.scene);
}

export function getPlaceholderImage(scene) {
  return placeholderByScene[scene] || defaultUrl;
}

async function tryRemoteImage(aiResult, styleSeed) {
  void buildImagePrompt(aiResult, styleSeed);
  return null;
}

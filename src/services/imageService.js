import { buildImagePrompt } from "../templates/imagePromptTemplates.js";
import { selectImageTemplateKey } from "../templates/imageTemplateLibrary.js";
import { createTemplateMemeImage } from "./templateMemeService.js";

const workplaceUrl = new URL("../assets/placeholder/workplace.svg", import.meta.url).href;
const commuteUrl = new URL("../assets/placeholder/commute.svg", import.meta.url).href;
const lifeUrl = new URL("../assets/placeholder/life.svg", import.meta.url).href;
const socialUrl = new URL("../assets/placeholder/social.svg", import.meta.url).href;
const defaultUrl = new URL("../assets/placeholder/default.svg", import.meta.url).href;

const placeholderByScene = {
  职场: workplaceUrl,
  通勤: commuteUrl,
  生活: lifeUrl,
  消费: lifeUrl,
  社交: socialUrl,
  其他: defaultUrl
};

const placeholderByTemplate = {
  workplace: workplaceUrl,
  commute: commuteUrl,
  life: lifeUrl,
  social: socialUrl,
  default: defaultUrl
};

export async function createImageForResult(aiResult, styleSeed) {
  const remoteImage = await tryRemoteImage(aiResult, styleSeed);
  return remoteImage || getTemplateImage(aiResult);
}

export function getPlaceholderImage(scene) {
  return placeholderByScene[scene] || defaultUrl;
}

export function getTemplateImage(analysis) {
  const templateKey = selectImageTemplateKey(analysis);
  return placeholderByTemplate[templateKey] || defaultUrl;
}

async function tryRemoteImage(aiResult, styleSeed) {
  const prompt = aiResult.imagePrompt || buildImagePrompt(aiResult, styleSeed);
  const generated = await createTemplateMemeImage(
    {
      ...aiResult,
      imagePrompt: prompt
    },
    styleSeed
  );

  if (!generated?.imageUrl) {
    return null;
  }

  aiResult.templatePrompt = generated.finalPrompt;
  aiResult.templateKey = generated.templateKey;
  aiResult.templateProfileId = generated.templateProfileId;
  aiResult.templateProfileLabel = generated.templateProfileLabel;
  aiResult.templateTitle = generated.titleHint;

  return generated.imageUrl;
}

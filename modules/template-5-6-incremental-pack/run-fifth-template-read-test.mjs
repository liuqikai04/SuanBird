import { writeFile } from "node:fs/promises";
import { buildImageRequestPayload, resolveImageUrlFromResponse } from "../src/config/imageModelConfig.js";
import { buildTemplateAwarePrompt, inferTitleHint } from "../src/services/promptComposer.js";
import { createFusionImage } from "../src/services/templateFusionService.js";
import { getTemplateProfile } from "../src/config/templateProfiles.js";

const outputJson = String.raw`C:\Users\user\Documents\task\fifth-template-read-result.json`;
const outputImage = String.raw`C:\Users\user\Documents\task\fifth-template-read-result.jpeg`;
const templateProfile = getTemplateProfile("sticker-emoji-creature");
const userPrompt =
  "主题是朋友已读不回：你认真发消息，对方永远已读不回，但朋友圈点赞从不落下。请做成白底、贴纸感、粉紫淡蓝配色的社交表情怪物，角色带已读标记、手机消息气泡和一点欠欠的表情。标题写“已读不回怪”。";

const finalPrompt = buildTemplateAwarePrompt({
  userPrompt,
  fileName: "sticker-emoji-creature.png",
  templateProfile
});

const title = inferTitleHint(userPrompt, "sticker-emoji-creature.png", templateProfile);

const payload = buildImageRequestPayload({
  prompt: finalPrompt,
  templateImage: "",
  fileName: "sticker-emoji-creature.png",
  useTemplateImage: false
});

const result = await createFusionImage({
  payload,
  resolveImageUrlFromResponse
});

await writeFile(
  outputJson,
  JSON.stringify(
    {
      templateProfile: templateProfile.id,
      title,
      finalPrompt,
      response: result.raw
    },
    null,
    2
  ),
  "utf8"
);

const imageResponse = await fetch(result.imageUrl);
const buffer = Buffer.from(await imageResponse.arrayBuffer());
await writeFile(outputImage, buffer);

console.log(`JSON:${outputJson}`);
console.log(`IMAGE:${outputImage}`);
console.log(`URL:${result.imageUrl}`);

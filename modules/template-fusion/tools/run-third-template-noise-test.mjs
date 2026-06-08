import { writeFile } from "node:fs/promises";
import { buildImageRequestPayload, resolveImageUrlFromResponse } from "../src/config/imageModelConfig.js";
import { buildTemplateAwarePrompt, inferTitleHint } from "../src/services/promptComposer.js";
import { createFusionImage } from "../src/services/templateFusionService.js";
import { getTemplateProfile } from "../src/config/templateProfiles.js";

const outputJson = String.raw`C:\Users\user\Documents\task\third-template-noise-result.json`;
const outputImage = String.raw`C:\Users\user\Documents\task\third-template-noise-result.jpeg`;
const templateProfile = getTemplateProfile("furry-mascot-sheet");
const userPrompt =
  "主题是生活场景中制造噪音的邻居：楼上周末早上电钻装修，沟通无果还说你事多。请保持模板里的同一只毛球怪主角不变，把它变成噪音怪。画面是毛球怪拿着电钻或喇叭制造巨响，其他人捂着耳朵。标题写“噪音怪”。";

const finalPrompt = buildTemplateAwarePrompt({
  userPrompt,
  fileName: "782ce34a62f7fa4151dc89ecae08ce1e.jpg",
  templateProfile
});

const title = inferTitleHint(
  userPrompt,
  "782ce34a62f7fa4151dc89ecae08ce1e.jpg",
  templateProfile
);

const payload = buildImageRequestPayload({
  prompt: finalPrompt,
  templateImage: "",
  fileName: "782ce34a62f7fa4151dc89ecae08ce1e.jpg",
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

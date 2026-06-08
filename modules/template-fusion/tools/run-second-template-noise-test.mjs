import { writeFile } from "node:fs/promises";
import { buildImageRequestPayload, resolveImageUrlFromResponse } from "../src/config/imageModelConfig.js";
import { buildTemplateAwarePrompt, inferTitleHint } from "../src/services/promptComposer.js";
import { createFusionImage } from "../src/services/templateFusionService.js";
import { getTemplateProfile } from "../src/config/templateProfiles.js";

const outputJson = String.raw`C:\Users\user\Documents\task\second-template-noise-result-v3.json`;
const outputImage = String.raw`C:\Users\user\Documents\task\second-template-noise-result-v3.jpeg`;
const templateProfile = getTemplateProfile("creature-flashcard");
const userPrompt =
  "主题是生活场景中制造噪音的邻居：楼上周末早上电钻装修，沟通无果还说你事多。请选一个和打洞、施工、噪音有关的真实动物做原型，把它变成噪音怪。画面是一个拿着电钻、在天花板附近制造巨响的动物变种，其他邻居捂着耳朵。底部标题写“噪音怪”。";

const finalPrompt = buildTemplateAwarePrompt({
  userPrompt,
  fileName: "6de21d11b6a8d1af4a243830846cadd9.png",
  templateProfile
});

const title = inferTitleHint(
  userPrompt,
  "6de21d11b6a8d1af4a243830846cadd9.png",
  templateProfile
);

const payload = buildImageRequestPayload({
  prompt: finalPrompt,
  templateImage: "",
  fileName: "6de21d11b6a8d1af4a243830846cadd9.png",
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

import { writeFile } from "node:fs/promises";
import { buildImageRequestPayload, resolveImageUrlFromResponse } from "../src/config/imageModelConfig.js";
import { buildTemplateAwarePrompt } from "../src/services/promptComposer.js";
import { createFusionImage } from "../src/services/templateFusionService.js";

const outputJson = String.raw`C:\Users\user\Documents\task\fusion-noise-style-only-result.json`;
const outputImage = String.raw`C:\Users\user\Documents\task\fusion-noise-style-only-result.jpeg`;

const userPrompt =
  "主题是生活场景中制造噪音的邻居：楼上周末早上电钻装修，沟通无果还说你事多。画面是一个拿着电钻的丑萌邻居在天花板上狂笑，房间被震得发抖，其他邻居捂着耳朵，讽刺又崩溃。底部标题写“噪音怪”。";

const finalPrompt = buildTemplateAwarePrompt({
  userPrompt,
  fileName: "36301782dc843d4b698d20e9ad90c50e.png"
});

const payload = buildImageRequestPayload({
  prompt: finalPrompt,
  templateImage: "",
  fileName: "36301782dc843d4b698d20e9ad90c50e.png",
  useTemplateImage: false
});

const result = await createFusionImage({
  payload,
  resolveImageUrlFromResponse
});

await writeFile(outputJson, JSON.stringify({ finalPrompt, response: result.raw }, null, 2), "utf8");

const imageResponse = await fetch(result.imageUrl);
const buffer = Buffer.from(await imageResponse.arrayBuffer());
await writeFile(outputImage, buffer);

console.log(`JSON:${outputJson}`);
console.log(`IMAGE:${outputImage}`);
console.log(`URL:${result.imageUrl}`);

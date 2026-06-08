import { writeFile } from "node:fs/promises";
import { buildImageRequestPayload, resolveImageUrlFromResponse } from "../src/config/imageModelConfig.js";
import { buildTemplateAwarePrompt } from "../src/services/promptComposer.js";
import { createFusionImage } from "../src/services/templateFusionService.js";

const outputJson = String.raw`C:\Users\user\Documents\task\fusion-social-style-only-result-v2.json`;
const outputImage = String.raw`C:\Users\user\Documents\task\fusion-social-style-only-result-v2.jpeg`;

const userPrompt =
  "主题是社交场景中已读不回的朋友：认真发的消息被当空气，但对方朋友圈永远秒赞。画面是一个丑萌小人举着手机，手机屏幕显示满屏已读红点，旁边朋友圈图标在放烟花，深夜氛围，委屈又讽刺。底部标题写“已读怪”。";

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

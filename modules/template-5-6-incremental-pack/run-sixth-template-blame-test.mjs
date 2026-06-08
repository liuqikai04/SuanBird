import { writeFile } from "node:fs/promises";
import { buildImageRequestPayload, resolveImageUrlFromResponse } from "../src/config/imageModelConfig.js";
import { buildTemplateAwarePrompt, inferTitleHint } from "../src/services/promptComposer.js";
import { createFusionImage } from "../src/services/templateFusionService.js";
import { getTemplateProfile } from "../src/config/templateProfiles.js";

const outputJson = String.raw`C:\Users\user\Documents\task\sixth-template-blame-result.json`;
const outputImage = String.raw`C:\Users\user\Documents\task\sixth-template-blame-result.jpeg`;
const templateProfile = getTemplateProfile("scratchboard-night-creature");
const userPrompt =
  "主题是职场甩锅同事：对方自己没交材料，却当众把延期全赖在你头上，还装无辜。请做成深黑夜色背景、粗糙刮刻版画、带一点暗红强调色的讽刺怪物海报。主体是一个举着“都怪你”牌子的甩锅怪，表情阴郁又得意。标题写“甩锅怪”。";

const finalPrompt = buildTemplateAwarePrompt({
  userPrompt,
  fileName: "scratchboard-night-creature.png",
  templateProfile
});

const title = inferTitleHint(userPrompt, "scratchboard-night-creature.png", templateProfile);

const payload = buildImageRequestPayload({
  prompt: finalPrompt,
  templateImage: "",
  fileName: "scratchboard-night-creature.png",
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

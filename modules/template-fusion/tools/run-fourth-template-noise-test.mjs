import { writeFile } from "node:fs/promises";
import { buildImageRequestPayload, resolveImageUrlFromResponse } from "../src/config/imageModelConfig.js";
import { buildTemplateAwarePrompt, inferTitleHint } from "../src/services/promptComposer.js";
import { createFusionImage } from "../src/services/templateFusionService.js";
import { getTemplateProfile } from "../src/config/templateProfiles.js";

const outputJson = String.raw`C:\Users\user\Documents\task\fourth-template-noise-result.json`;
const outputImage = String.raw`C:\Users\user\Documents\task\fourth-template-noise-result.jpeg`;
const templateProfile = getTemplateProfile("pastel-plush-bestiary");
const userPrompt =
  "主题是生活场景中制造噪音的邻居：楼上周末早上电钻装修，沟通无果还说你事多。请把它做成第四套模板那种白底、紫粉糖果色、丑萌又欠欠的小怪物条目。主体是一只抱着电钻或喇叭的软萌噪音怪，身上带一点亮晶晶果冻感，两边有被吵到捂耳朵的小人或小怪物。标题写“噪音怪”。";

const finalPrompt = buildTemplateAwarePrompt({
  userPrompt,
  fileName: "8180ecfa9829f4a787bf89324672249c.png",
  templateProfile
});

const title = inferTitleHint(
  userPrompt,
  "8180ecfa9829f4a787bf89324672249c.png",
  templateProfile
);

const payload = buildImageRequestPayload({
  prompt: finalPrompt,
  templateImage: "",
  fileName: "8180ecfa9829f4a787bf89324672249c.png",
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

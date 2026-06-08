import test from "node:test";
import assert from "node:assert/strict";

import {
  buildImageRequestPayload,
  getConfigStatus,
  resolveImageUrlFromResponse
} from "../src/config/imageModelConfig.js";
import { buildTemplateAwarePrompt, inferTitleHint } from "../src/services/promptComposer.js";
import {
  DEFAULT_TEMPLATE_PROFILE,
  getTemplateProfile,
  listTemplateProfiles
} from "../src/config/templateProfiles.js";

test("getConfigStatus reports configured API values as ready", () => {
  const status = getConfigStatus();

  assert.equal(status.ready, true);
});

test("buildImageRequestPayload includes prompt and template image", () => {
  const payload = buildImageRequestPayload({
    prompt: "make it cinematic",
    templateImage: "data:image/png;base64,abc123",
    fileName: "template.png",
    useTemplateImage: true
  });

  assert.equal(payload.prompt, "make it cinematic");
  assert.equal(payload.image, "data:image/png;base64,abc123");
  assert.equal(payload.response_format, "url");
  assert.equal(payload.metadata.template_image_name, "template.png");
});

test("buildImageRequestPayload omits template image in style-only mode", () => {
  const payload = buildImageRequestPayload({
    prompt: "style only",
    templateImage: "data:image/png;base64,abc123",
    fileName: "template.png",
    useTemplateImage: false
  });

  assert.equal("image" in payload, false);
  assert.equal(payload.metadata.use_template_image, false);
});

test("resolveImageUrlFromResponse reads OpenAI-style url output", () => {
  const imageUrl = resolveImageUrlFromResponse({
    data: [{ url: "https://example.com/result.png" }]
  });

  assert.equal(imageUrl, "https://example.com/result.png");
});

test("resolveImageUrlFromResponse converts base64 output into data url", () => {
  const imageUrl = resolveImageUrlFromResponse({
    data: [{ b64_json: "YWJj" }]
  });

  assert.equal(imageUrl, "data:image/png;base64,YWJj");
});

test("resolveImageUrlFromResponse throws when the response shape is unknown", () => {
  assert.throws(
    () => resolveImageUrlFromResponse({ result: "missing-image-field" }),
    /没有识别到图片地址/
  );
});

test("buildTemplateAwarePrompt strengthens the prompt with template-wide style guidance", () => {
  const prompt = buildTemplateAwarePrompt({
    userPrompt: "职场甩锅同事，底部标题写甩锅怪",
    fileName: "template-grid.png"
  });

  assert.match(prompt, /模板风格总结/);
  assert.match(prompt, /纯黑底/);
  assert.match(prompt, /黑色挖空/);
  assert.match(prompt, /丝网印刷/);
  assert.match(prompt, /甩锅怪/);
  assert.match(prompt, /不是对原图做轻微描边重绘/);
});

test("buildTemplateAwarePrompt prefers an explicit title from the user prompt", () => {
  const prompt = buildTemplateAwarePrompt({
    userPrompt: "朋友已读不回，朋友圈秒赞，底部标题写“已读怪”。",
    fileName: "template-grid.png"
  });

  assert.match(prompt, /中文标题“已读怪”/);
});

test("inferTitleHint prefers explicit titles and scene keywords", () => {
  assert.equal(inferTitleHint("底部标题写“噪音怪”", "template-grid.png"), "噪音怪");
  assert.equal(inferTitleHint("朋友已读不回，朋友圈秒赞", "template-grid.png"), "已读怪");
  assert.equal(inferTitleHint("楼上装修电钻扰民", "template-grid.png"), "噪音怪");
});

test("template profiles expose a stable integration interface", () => {
  const profiles = listTemplateProfiles();

  assert.ok(profiles.length >= 4);
  assert.equal(profiles[0].id, DEFAULT_TEMPLATE_PROFILE.id);
  assert.equal(getTemplateProfile("missing-profile").id, DEFAULT_TEMPLATE_PROFILE.id);
  assert.equal(getTemplateProfile("creature-flashcard").label, "动物变种图鉴");
  assert.equal(getTemplateProfile("furry-mascot-sheet").label, "毛球怪手绘系列");
  assert.equal(getTemplateProfile("pastel-plush-bestiary").label, "糖果色吐槽小怪物");
});

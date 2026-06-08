import test from "node:test";
import assert from "node:assert/strict";

import { pickSceneByText } from "../src/templates/sceneRules.js";
import { buildFallbackCompliment } from "../src/templates/complimentTemplates.js";
import { checkContentSafety } from "../src/services/moderationService.js";
import { analyzeTextAndCompliment } from "../src/services/aiService.js";
import {
  buildLocalPromptExtraction,
  extractPromptFromStory
} from "../src/services/promptExtractionService.js";
import { buildAnalyzeStoryRequest } from "../src/services/storyAnalyzeRequest.js";
import { buildMockTargetPrompt } from "../src/services/mockTargetPromptService.js";
import {
  buildImageRequestPayload,
  resolveImageUrlFromResponse
} from "../src/config/imageModelConfig.js";
import { getTemplateProfile, listTemplateProfiles } from "../src/config/templateProfiles.js";
import { selectImageTemplateKey } from "../src/templates/imageTemplateLibrary.js";
import { buildTemplateAwarePrompt } from "../src/services/promptComposer.js";
import {
  buildComplaintTemplatePrompt,
  selectTemplateProfileId
} from "../src/services/templateMemeService.js";
import { generateTextResult } from "../src/features/generate/generateController.js";

test("pickSceneByText matches the strongest scene keyword set", () => {
  const result = pickSceneByText("同事抢我功劳，领导还在开会画饼。");

  assert.equal(result.scene, "职场");
  assert.equal(result.object, "职场槽点");
});

test("pickSceneByText falls back to 其他 when no keyword matches", () => {
  const result = pickSceneByText("今天只想安静发个呆。");

  assert.equal(result.scene, "其他");
  assert.deepEqual(result.tags, ["情绪出口", "自我关照"]);
});

test("buildFallbackCompliment stays stable for the same scene and text", () => {
  const sceneInfo = {
    scene: "社交",
    emotion: "尴尬"
  };

  const first = buildFallbackCompliment(sceneInfo, "朋友已读不回");
  const second = buildFallbackCompliment(sceneInfo, "朋友已读不回");

  assert.equal(first, second);
  assert.ok(first.includes("你"));
});

test("checkContentSafety redacts risky content", () => {
  const result = checkContentSafety(
    "我要曝光他，手机号是13812345678，公司全名也要放出来。"
  );

  assert.equal(result.ok, false);
  assert.equal(result.safeText.includes("13812345678"), false);
  assert.equal(result.safeText.includes("公司全名"), false);
  assert.ok(result.safeText.includes("狠狠吐槽"));
});

test("analyzeTextAndCompliment returns local scene info with a compliment", async () => {
  const result = await analyzeTextAndCompliment("外卖等了很久，结果货不对板。");

  assert.equal(result.scene, "消费");
  assert.ok(Array.isArray(result.tags));
  assert.ok(result.compliment.length > 0);
});

test("buildLocalPromptExtraction extracts a core label from long stories", () => {
  const result = buildLocalPromptExtraction(
    "今天上班真的把我气笑了，同事明明自己拖延，开会却把锅甩到我身上。"
  );

  assert.equal(result.scene, "职场");
  assert.equal(result.promptLabel, "甩锅");
  assert.equal(result.targetRole, "被甩锅的打工人");
  assert.match(result.visualCharacter, /自嘲/);
  assert.doesNotMatch(result.visualCharacter, /反派/);
  assert.ok(result.imagePrompt.includes("甩锅"));
});

test("selectImageTemplateKey uses prompt labels to pick a template image", () => {
  const key = selectImageTemplateKey({
    scene: "其他",
    promptLabel: "已读不回",
    tags: ["社交", "尴尬"]
  });

  assert.equal(key, "social");
});

test("result display tags can be deduped by normalization services", () => {
  const result = buildLocalPromptExtraction("同事又把我的功劳说成自己的。");

  assert.equal(new Set(result.complaintTags).size, result.complaintTags.length);
});

test("buildAnalyzeStoryRequest creates API body from timestamp and frontend text", () => {
  const request = buildAnalyzeStoryRequest("早高峰地铁被包怼到门边。", {
    timestamp: 1765012456789,
    sourceType: "speech"
  });

  assert.equal(request.userId, "u12456789");
  assert.equal(request.roomId, "r12456789");
  assert.equal(request.storyText, "早高峰地铁被包怼到门边。");
  assert.equal(request.sourceType, "speech");
  assert.equal(request.generateMode, "vent");
});

test("template profile registry is available in MVP1", () => {
  const profiles = listTemplateProfiles();

  assert.ok(profiles.length >= 7);
  assert.ok(profiles.some((profile) => profile.id === "monster-atlas"));
  assert.ok(profiles.every((profile) => profile.description.length > 0));
  assert.equal(getTemplateProfile("sticker-emoji-creature").label, "贴纸感表情怪物");
  assert.equal(getTemplateProfile("scratchboard-night-creature").label, "夜色刮刻怪物");
  assert.equal(getTemplateProfile("garlic-bird-grid-localization").label, "蒜鸟日常状态格");
});

test("template prompt composer combines analysis fields with selected style", () => {
  const analysis = buildLocalPromptExtraction(
    "今天上班真的把我气笑了，同事明明自己拖延，开会却把锅甩到我身上。"
  );
  const userPrompt = buildComplaintTemplatePrompt({
    scene: analysis.scene,
    emotion: analysis.emotion,
    tags: analysis.complaintTags,
    summary: analysis.summary,
    coreConflict: analysis.coreConflict,
    visualCharacter: analysis.visualCharacter,
    memeText: analysis.memeText,
    imagePrompt: analysis.imagePrompt,
    animationPrompt: analysis.animationPrompt
  });
  const finalPrompt = buildTemplateAwarePrompt({
    userPrompt,
    fileName: "workplace-monster-atlas.png",
    templateProfile: "monster-atlas"
  });

  assert.match(finalPrompt, /模板风格总结/);
  assert.match(finalPrompt, /甩锅/);
  assert.match(finalPrompt, /纯黑底/);
});

test("image request payload and proxy response resolver match the template module contract", () => {
  const payload = buildImageRequestPayload({
    prompt: "生成甩锅怪",
    templateImage: "",
    fileName: "workplace-monster-atlas.png",
    useTemplateImage: false
  });

  assert.equal(payload.prompt, "生成甩锅怪");
  assert.equal(payload.response_format, "url");
  assert.equal(payload.metadata.use_template_image, false);
  assert.equal("image" in payload, false);
  assert.equal(
    resolveImageUrlFromResponse({
      code: 200,
      data: { imageUrl: "https://example.com/result.png" }
    }),
    "https://example.com/result.png"
  );
});

test("template selector routes social chat topics to sticker template", () => {
  const profileId = selectTemplateProfileId("social", "", {
    mockTags: ["已读不回", "嘴硬"],
    mockTitle: "已读怪"
  });

  assert.equal(profileId, "sticker-emoji-creature");
});

test("template selector routes blame topics to scratchboard template", () => {
  const profileId = selectTemplateProfileId("workplace", "", {
    mockTags: ["甩锅", "推责"],
    mockProps: ["甩锅锅盖"],
    coreConflict: "会议上把责任推给别人"
  });

  assert.equal(profileId, "scratchboard-night-creature");
});

test("template selector respects manual profile selection", () => {
  const profileId = selectTemplateProfileId("workplace", "sticker-emoji-creature", {
    mockTags: ["甩锅", "推责"]
  });

  assert.equal(profileId, "sticker-emoji-creature");
});

test("template selector routes self-mode daily topics to garlic bird template", () => {
  const profileId = selectTemplateProfileId("life", "", {
    generateMode: "self",
    summary: "今天只想稍后再回，社交低电量。"
  });

  assert.equal(profileId, "garlic-bird-grid-localization");
});

test("mock target prompt service exposes the vent-mode LLM contract", () => {
  const prompt = buildMockTargetPrompt("同事又把锅甩给我。");

  assert.match(prompt, /被吐槽对象恶搞形象生成助手/);
  assert.match(prompt, /mockTitle/);
  assert.match(prompt, /丑萌反派/);
});

test("extractPromptFromStory routes vent mode to mock target analysis fallback", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = undefined;

  try {
    const result = await extractPromptFromStory("同事又把锅甩给我。", {
      generateMode: "vent"
    });

    assert.equal(result.analysisMode, "vent");
    assert.equal(result.source, "mock-target-fallback");
    assert.ok(result.mockTitle);
    assert.ok(result.imagePrompt.includes("丑萌反派"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("extractPromptFromStory routes self mode to the original story analysis fallback", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = undefined;

  try {
    const result = await extractPromptFromStory("同事又把锅甩给我。", {
      generateMode: "self"
    });

    assert.equal(result.analysisMode, "self");
    assert.equal(result.source, "local");
    assert.equal(result.promptLabel, "甩锅");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("generateTextResult returns a visible text-first result before image generation completes", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = undefined;

  try {
    const result = await generateTextResult({
      text: "同事又把锅甩给我。",
      generateMode: "vent",
      templateProfileId: "auto",
      sourceType: "text",
      timestamp: 1765012456789
    });

    assert.equal(result.imageGenerating, true);
    assert.equal(result.imageStatus, "pending");
    assert.ok(result.summary);
    assert.ok(result.imageUrl);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

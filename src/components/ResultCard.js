import { escapeHtml } from "../utils/escapeHtml.js";

export function createResultCard(result, { onSave, onRetry, onEdit }) {
  const element = document.createElement("article");
  const displayTags = buildDisplayTags(result);
  const isImageGenerating = Boolean(result.imageGenerating);
  element.className = `result-card ${isImageGenerating ? "text-first-card" : "result-ready-card"}`;
  element.dataset.exportTarget = "meme-card";

  element.innerHTML = isImageGenerating
    ? buildTextFirstMarkup(result, displayTags)
    : buildReadyMarkup(result, displayTags);

  const saveButton = element.querySelector('[data-action="save"]');
  const retryButton = element.querySelector('[data-action="retry"]');
  const editButton = element.querySelector('[data-action="edit"]');

  if (saveButton) {
    saveButton.addEventListener("click", () => onSave(result));
  }

  if (retryButton) {
    retryButton.addEventListener("click", () => onRetry(result));
  }

  if (editButton) {
    editButton.addEventListener("click", () => (onEdit || onRetry)(result));
  }

  return element;
}

function buildTextFirstMarkup(result, displayTags) {
  return `
    <div class="result-content">
      <p class="card-kicker">AI 为你拆解好了</p>
      <dl class="analysis-list">
        ${buildAnalysisRow("标题", result.summary || result.promptLabel || result.compliment, "is-title")}
        ${buildAnalysisTagsRow(displayTags)}
        ${buildAnalysisRow("表情文案", result.memeText)}
        ${buildAnalysisRow("反派形象", result.visualCharacter)}
        ${buildAnalysisRow("图片提示词", result.imagePrompt)}
        ${buildAnalysisRow("动画提示词", result.animationPrompt)}
      </dl>
      <div class="text-first-loading">
        <div class="garlic-bird tiny" aria-hidden="true"></div>
        <div>
          <p>图片生成中，先看文案</p>
          <div class="progress-track"><span></span></div>
        </div>
      </div>
    </div>
    <div class="result-actions">
      <button class="secondary-button" type="button" data-action="edit">返回修改</button>
      <button class="primary-button" type="button" disabled>图片生成中</button>
    </div>
  `;
}

function buildReadyMarkup(result, displayTags) {
  const safeTags = displayTags
    .map((tag) => `<span>${escapeHtml(tag)}</span>`)
    .join("");

  return `
    <div class="result-content result-hero-copy">
      <p class="card-kicker">生成完成</p>
      <h2>${escapeHtml(result.compliment)}</h2>
    </div>
    <div class="image-frame">
      <img src="${escapeHtml(result.imageUrl)}" alt="生成的丑萌表情包形象" />
    </div>
    <div class="result-content">
      <div class="tag-row">${safeTags}</div>
      ${result.summary && result.summary !== result.text ? `<p class="summary-text">${escapeHtml(result.summary)}</p>` : ""}
      ${buildPromptDetails(result)}
      <p class="prompt-source">生成模式：${result.generateMode === "self" ? "自嘲" : "发泄"}</p>
      <p class="prompt-source">图片模板：${escapeHtml(getTemplateSourceText(result))}</p>
      <p class="prompt-source">输入来源：${result.sourceType === "speech" ? "语音转文字" : "文字输入"} · ${formatTime(result.createdAt)}</p>
    </div>
    <div class="result-actions">
      <button class="secondary-button" type="button" data-action="retry">再来一张</button>
      <button class="primary-button" type="button" data-action="save">保存图片</button>
    </div>
  `;
}

function buildAnalysisRow(label, value, className = "") {
  const text = String(value || "").trim();
  if (!text) return "";

  return `
    <div class="analysis-row ${className}">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(text)}</dd>
    </div>
  `;
}

function buildAnalysisTagsRow(tags) {
  if (!tags.length) return "";

  return `
    <div class="analysis-row">
      <dt>标签</dt>
      <dd class="analysis-tags">
        ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
      </dd>
    </div>
  `;
}

function getTemplateSourceText(result) {
  if (result.templateProfileLabel) {
    return result.templateProfileLabel;
  }

  if (result.requestedTemplateProfileId && result.requestedTemplateProfileId !== "auto") {
    return result.requestedTemplateProfileId;
  }

  return "自动匹配";
}

function buildDisplayTags(result) {
  const tags = [
    result.scene,
    result.emotion,
    result.promptLabel,
    ...(result.tags || [])
  ];
  const output = [];

  for (const tag of tags) {
    const value = String(tag || "").trim();
    if (value && !output.includes(value)) {
      output.push(value);
    }
  }

  return output.slice(0, 5);
}

function buildPromptDetails(result) {
  const rows = [
    ["表情文案", result.memeText],
    ["反派形象", result.visualCharacter],
    ["图片提示词", result.imagePrompt],
    ["动画提示词", result.animationPrompt]
  ]
    .map(([label, value]) => [label, String(value || "").trim()])
    .filter(([, value]) => value);

  if (!rows.length) {
    return "";
  }

  return `
    <details class="prompt-detail-collapse">
      <summary>提示词详情</summary>
      <dl class="prompt-detail-list">
        ${rows
          .map(
            ([label, value]) => `
              <div>
                <dt>${escapeHtml(label)}</dt>
                <dd>${escapeHtml(value)}</dd>
              </div>
            `
          )
          .join("")}
      </dl>
    </details>
  `;
}

function formatTime(value) {
  if (!value) return "刚刚";

  try {
    return new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return "刚刚";
  }
}

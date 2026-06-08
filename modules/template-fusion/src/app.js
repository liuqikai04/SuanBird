import {
  buildImageRequestPayload,
  getConfigStatus,
  resolveImageUrlFromResponse
} from "./config/imageModelConfig.js";
import {
  createFusionImage,
  fileToDataUrl,
  triggerImageDownload
} from "./services/templateFusionService.js";
import { buildTemplateAwarePrompt, inferTitleHint } from "./services/promptComposer.js";
import { overlayResultTitle } from "./services/resultImagePostprocess.js";
import {
  DEFAULT_TEMPLATE_PROFILE,
  getTemplateProfile,
  listTemplateProfiles
} from "./config/templateProfiles.js";

export function initApp(root) {
  const templateProfiles = listTemplateProfiles();
  const state = {
    templateFile: null,
    templatePreviewUrl: "",
    resultUrl: "",
    finalPrompt: "",
    resultTitle: "",
    templateProfile: DEFAULT_TEMPLATE_PROFILE,
    useTemplateImage: false,
    isLoading: false,
    errorMessage: ""
  };

  root.innerHTML = `
    <main class="app-shell">
      <header class="app-header">
        <p class="eyebrow">Template + Prompt Image Fusion</p>
        <h1>模板图融合生图工具</h1>
        <p class="subhead">
          上传一张模板图，输入提示词，页面会把模板图转成 Base64 后提交给你的生图接口，
          返回融合后的新图。API 地址和 Key 已经在代码里预留好位置，稍后填上即可。
        </p>
      </header>

      <section class="workspace" aria-label="模板图融合生成">
        <article class="input-panel">
          <div class="panel-block">
            <div class="section-heading">
              <h2>1. 上传模板图</h2>
              <p>支持常见图片格式</p>
            </div>
            <label class="upload-dropzone" for="template-image">
              <input id="template-image" type="file" accept="image/*" />
              <span class="upload-title">点击选择图片</span>
              <span class="upload-hint">建议使用主体清晰的模板图</span>
            </label>
            <div id="template-preview" class="preview-card preview-empty">
              <p>还没有选择模板图</p>
            </div>
          </div>

          <div class="panel-block">
            <label class="input-label" for="prompt-input">2. 输入提示词</label>
            <textarea
              id="prompt-input"
              rows="6"
              maxlength="600"
              placeholder="例如：保留人物构图和姿态，变成未来感电影海报，霓虹灯、体积光、超清细节"
            ></textarea>
          </div>

          <div class="panel-block">
            <div class="section-heading">
              <h2>3. 接口配置状态</h2>
              <p>需要先填写代码中的 URL 和 Key</p>
            </div>
            <div id="config-status" class="status-banner"></div>
          </div>

          <div class="panel-block">
            <div class="section-heading">
              <h2>4. 模板类型</h2>
              <p>同一流程里切换不同模板风格</p>
            </div>
            <label class="input-label" for="template-profile">模板配置</label>
            <select id="template-profile" class="select-input">
              ${templateProfiles
                .map(
                  (profile) =>
                    `<option value="${profile.id}"${
                      profile.id === state.templateProfile.id ? " selected" : ""
                    }>${escapeHtml(profile.label)}</option>`
                )
                .join("")}
            </select>
          </div>

          <div class="panel-block">
            <div class="section-heading">
              <h2>5. 参考模式</h2>
              <p>默认只借风格，不把模板具体内容带进生成</p>
            </div>
            <label class="mode-toggle">
              <input id="use-template-image" type="checkbox" />
              <span>强参考模板图内容和构图</span>
            </label>
          </div>

          <div class="panel-block">
            <div class="section-heading">
              <h2>6. 模板融合后的实际 Prompt</h2>
              <p>生成前会先做模板风格增强</p>
            </div>
            <div id="prompt-preview" class="prompt-preview preview-empty">
              <p>选择模板图并输入主题后，这里会显示真正发给模型的增强 prompt。</p>
            </div>
          </div>

          <div class="action-row">
            <button class="secondary-button" type="button" data-action="fill-demo">填入示例提示词</button>
            <button class="primary-button" type="button" data-action="generate">生成融合图</button>
          </div>
        </article>

        <section class="result-card" aria-label="生成结果">
          <div class="result-header">
            <div>
              <p class="result-label">生成结果</p>
              <h2>7. 查看并下载</h2>
            </div>
            <button class="ghost-button" type="button" data-action="download" disabled>下载图片</button>
          </div>

          <div id="result-view" class="result-stage empty-result">
            <div>
              <div class="empty-art"></div>
              <h2>等待生成</h2>
              <p>上传模板图并输入提示词后，结果会显示在这里。</p>
            </div>
          </div>
        </section>
      </section>
    </main>
  `;

  const fileInput = root.querySelector("#template-image");
  const promptInput = root.querySelector("#prompt-input");
  const templatePreview = root.querySelector("#template-preview");
  const configStatus = root.querySelector("#config-status");
  const templateProfileInput = root.querySelector("#template-profile");
  const useTemplateImageInput = root.querySelector("#use-template-image");
  const promptPreview = root.querySelector("#prompt-preview");
  const resultView = root.querySelector("#result-view");
  const generateButton = root.querySelector('[data-action="generate"]');
  const fillDemoButton = root.querySelector('[data-action="fill-demo"]');
  const downloadButton = root.querySelector('[data-action="download"]');

  renderConfigStatus();

  fileInput.addEventListener("change", handleTemplateChange);
  fillDemoButton.addEventListener("click", () => {
    promptInput.value =
      "主题是职场甩锅同事：表面装无辜，背地里推责，当众把锅甩给别人，做成和模板全集同系列的黑白怪物图，底部标题写“甩锅怪”。";
    syncPromptPreview();
  });
  templateProfileInput.addEventListener("change", () => {
    state.templateProfile = getTemplateProfile(templateProfileInput.value);
    syncPromptPreview();
  });
  useTemplateImageInput.addEventListener("change", () => {
    state.useTemplateImage = useTemplateImageInput.checked;
    syncPromptPreview();
  });
  generateButton.addEventListener("click", handleGenerate);
  downloadButton.addEventListener("click", () => {
    if (state.resultUrl) {
      triggerImageDownload(state.resultUrl, "fusion-result.png");
    }
  });
  promptInput.addEventListener("input", syncPromptPreview);

  async function handleTemplateChange(event) {
    const [file] = event.target.files || [];

    if (!file) {
      return;
    }

    if (state.templatePreviewUrl) {
      URL.revokeObjectURL(state.templatePreviewUrl);
    }

    state.templateFile = file;
    state.templatePreviewUrl = URL.createObjectURL(file);
    templatePreview.className = "preview-card";
    templatePreview.innerHTML = `
      <img src="${state.templatePreviewUrl}" alt="模板图预览" />
      <div class="preview-meta">
        <strong>${escapeHtml(file.name)}</strong>
        <span>${formatFileSize(file.size)}</span>
      </div>
    `;
    syncPromptPreview();
  }

  async function handleGenerate() {
    const prompt = promptInput.value.trim();
    const config = getConfigStatus();

    state.errorMessage = "";
    state.resultUrl = "";
    downloadButton.disabled = true;

    if (!state.templateFile) {
      renderError("请先选择一张模板图。");
      return;
    }

    if (!prompt) {
      renderError("请输入提示词。");
      return;
    }

    if (!config.ready) {
      renderError("请先在 src/config/imageModelConfig.js 中填写 API URL 和 API Key。");
      return;
    }

    setLoading(true);

    try {
      const finalPrompt = buildTemplateAwarePrompt({
        userPrompt: prompt,
        fileName: state.templateFile.name,
        templateProfile: state.templateProfile
      });
      const resultTitle = inferTitleHint(prompt, state.templateFile.name, state.templateProfile);
      state.finalPrompt = finalPrompt;
      state.resultTitle = resultTitle;
      renderPromptPreview();
      const templateImage = state.useTemplateImage ? await fileToDataUrl(state.templateFile) : "";
      const payload = buildImageRequestPayload({
        prompt: finalPrompt,
        templateImage,
        fileName: state.templateFile.name,
        useTemplateImage: state.useTemplateImage
      });

      const response = await createFusionImage({
        payload,
        resolveImageUrlFromResponse
      });

      state.resultUrl = await overlayResultTitle(response.imageUrl, resultTitle).catch(() => response.imageUrl);
      resultView.className = "result-stage";
      resultView.innerHTML = `
        <img src="${state.resultUrl}" alt="融合生成结果" class="result-image" />
      `;
      downloadButton.disabled = false;
    } catch (error) {
      renderError(error.message || "生成失败，请检查接口配置和返回格式。");
    } finally {
      setLoading(false);
    }
  }

  function renderConfigStatus() {
    const config = getConfigStatus();

    configStatus.className = `status-banner ${config.ready ? "status-ready" : "status-pending"}`;
    configStatus.innerHTML = config.ready
      ? "<strong>已检测到接口配置。</strong><span>可以直接开始测试生成。</span>"
      : "<strong>尚未填写接口配置。</strong><span>打开 src/config/imageModelConfig.js，把占位 URL 和 API Key 改成你的真实值。</span>";
  }

  function syncPromptPreview() {
    const userPrompt = promptInput.value.trim();

    if (!state.templateFile || !userPrompt) {
      state.finalPrompt = "";
      renderPromptPreview();
      return;
    }

    state.finalPrompt = buildTemplateAwarePrompt({
      userPrompt,
      fileName: state.templateFile.name,
      templateProfile: state.templateProfile
    });
    state.resultTitle = inferTitleHint(userPrompt, state.templateFile.name, state.templateProfile);
    renderPromptPreview();
  }

  function renderPromptPreview() {
    if (!state.finalPrompt) {
      promptPreview.className = "prompt-preview preview-empty";
      promptPreview.innerHTML =
        "<p>选择模板图并输入主题后，这里会显示真正发给模型的增强 prompt。</p>";
      return;
    }

    promptPreview.className = "prompt-preview";
    promptPreview.innerHTML = `<pre>${escapeHtml(state.finalPrompt)}</pre>`;
  }

  function renderError(message) {
    state.errorMessage = message;
    resultView.className = "result-stage empty-result";
    resultView.innerHTML = `
      <div>
        <div class="empty-art empty-art-error"></div>
        <h2>暂时无法生成</h2>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }

  function setLoading(isLoading) {
    state.isLoading = isLoading;
    generateButton.disabled = isLoading;
    fillDemoButton.disabled = isLoading;
    fileInput.disabled = isLoading;
    promptInput.disabled = isLoading;
    generateButton.textContent = isLoading ? "生成中..." : "生成融合图";

    if (isLoading) {
      resultView.className = "result-stage loading-state";
      resultView.innerHTML = `
        <div>
          <div class="loading-orbit"></div>
          <h2>正在请求生图接口</h2>
          <p>模板图已编码发送，等待服务端返回融合结果。</p>
        </div>
      `;
    }
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

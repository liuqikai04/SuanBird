import { listTemplateProfiles } from "../config/templateProfiles.js";

const MAX_INPUT_LENGTH = 1000;
const INPUT_PANEL_DEFAULT_GENERATE_MODE = "vent";
const AUTO_TEMPLATE_ID = "auto";
const PLACEHOLDER_EXAMPLES = [
  "比如：同事又抢我功劳，领导又开始画饼...",
  "比如：地铁上被挤到变形，旁边的人还外放短视频...",
  "比如：外卖等了一个小时，打开发现汤洒了一袋...",
  "比如：客服绕来绕去，就是不解决我的退款问题...",
  "比如：开会讲了两小时，最后发现没人知道要干嘛...",
  "比如：排队半小时，前面的人突然开始疯狂插队...",
  "比如：群里临时甩锅，还说我怎么不早点提醒...",
  "比如：熬夜做完方案，第二天被说方向全错了...",
  "比如：快递显示已签收，但我连盒子的影子都没见到...",
  "比如：朋友迟到四十分钟，还说我太较真了...",
  "比如：游戏队友全程挂机，结束还怪我没带飞...",
  "比如：家里人一句为你好，把我整天好心情清空..."
];
const TEMPLATE_OPTIONS = [
  {
    id: AUTO_TEMPLATE_ID,
    label: "自动匹配",
    description: "根据槽点标签和场景自动选择最合适的模板。"
  },
  ...listTemplateProfiles()
];

export function createInputPanel({ onGenerate, onVoice }) {
  const element = document.createElement("article");
  const initialPlaceholder = pickPlaceholderExample();
  element.className = "input-panel";
  element.innerHTML = `
    <div class="input-heading">
      <label class="input-label" for="rant-input">今天想吐槽什么？</label>
      <button class="clear-input-button" type="button" data-action="clear-input">清空</button>
    </div>
    <textarea id="rant-input" rows="5" maxlength="${MAX_INPUT_LENGTH}" placeholder="${initialPlaceholder}"></textarea>
    <div class="voice-capture" data-role="voice-capture" hidden>
      <p data-role="voice-copy">开始说吧，点停止结束</p>
      <div class="voice-wave" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      <time data-role="voice-timer">00:00</time>
    </div>
    <div class="input-meta">
      <span>支持文字输入，语音不可用时会自动降级</span>
      <span data-role="counter">0/${MAX_INPUT_LENGTH}</span>
    </div>
    <div class="mode-segmented" aria-label="生成模式">
      <button class="is-active" type="button" data-mode="vent">发泄</button>
      <button type="button" data-mode="self">自嘲</button>
    </div>
    <div class="template-picker">
      <label for="template-select">选择模板</label>
      <select id="template-select" data-role="template-select"></select>
      <p data-role="template-description"></p>
      <details>
        <summary>模板介绍</summary>
        <ul data-role="template-list"></ul>
      </details>
    </div>
    <div class="action-row">
      <button class="secondary-button" type="button" data-action="voice">语音</button>
      <button class="primary-button" type="button" data-action="generate">生成表情包</button>
    </div>
  `;

  const textarea = element.querySelector("textarea");
  const clearButton = element.querySelector('[data-action="clear-input"]');
  const generateButton = element.querySelector('[data-action="generate"]');
  const voiceButton = element.querySelector('[data-action="voice"]');
  const voiceCapture = element.querySelector('[data-role="voice-capture"]');
  const voiceCopy = element.querySelector('[data-role="voice-copy"]');
  const voiceTimer = element.querySelector('[data-role="voice-timer"]');
  const counter = element.querySelector('[data-role="counter"]');
  const modeButtons = [...element.querySelectorAll("[data-mode]")];
  const templateSelect = element.querySelector('[data-role="template-select"]');
  const templateDescription = element.querySelector('[data-role="template-description"]');
  const templateList = element.querySelector('[data-role="template-list"]');
  let generateMode = INPUT_PANEL_DEFAULT_GENERATE_MODE;
  let templateProfileId = AUTO_TEMPLATE_ID;
  let activeVoiceSession = null;
  let voiceStartedAt = 0;
  let voiceTimerId = 0;

  for (const option of TEMPLATE_OPTIONS) {
    const selectOption = document.createElement("option");
    selectOption.value = option.id;
    selectOption.textContent = option.label;
    templateSelect.append(selectOption);

    const item = document.createElement("li");
    const name = document.createElement("strong");
    const description = document.createElement("span");
    name.textContent = option.label;
    description.textContent = option.description;
    item.append(name, description);

    const examples = createTemplateExampleImages(option);
    if (examples) {
      item.append(examples);
    }

    templateList.append(item);
  }

  for (const button of modeButtons) {
    button.addEventListener("click", () => {
      setGenerateMode(button.dataset.mode);
    });
  }

  clearButton.addEventListener("click", () => {
    setValue("");
    refreshPlaceholder();
    textarea.focus();
  });

  generateButton.addEventListener("click", () => {
    onGenerate(getValue(), { generateMode, templateProfileId });
  });

  textarea.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      onGenerate(getValue(), { generateMode, templateProfileId });
    }
  });

  textarea.addEventListener("input", updateCounter);
  templateSelect.addEventListener("change", () => {
    setTemplateProfileId(templateSelect.value);
  });

  voiceButton.addEventListener("click", async () => {
    if (activeVoiceSession?.stop) {
      activeVoiceSession.stop();
      setVoiceFinalizing();
      return;
    }

    setVoiceListening(true);
    try {
      activeVoiceSession = normalizeVoiceSession(onVoice());
      const transcript = await activeVoiceSession.result;
      if (transcript) {
        setValue(transcript);
      }
    } finally {
      activeVoiceSession = null;
      setVoiceListening(false);
    }
  });

  function getValue() {
    return textarea.value;
  }

  function setValue(value) {
    textarea.value = value;
    updateCounter();
  }

  function refreshPlaceholder() {
    textarea.placeholder = pickPlaceholderExample(textarea.placeholder);
  }

  function setBusy(isBusy) {
    clearButton.disabled = isBusy;
    generateButton.disabled = isBusy;
    voiceButton.disabled = isBusy;
    textarea.disabled = isBusy;
    templateSelect.disabled = isBusy;
    modeButtons.forEach((button) => {
      button.disabled = isBusy;
    });
    generateButton.textContent = isBusy ? "生成中..." : "生成表情包";
  }

  function setVoiceListening(isListening) {
    voiceButton.disabled = false;
    voiceButton.classList.toggle("is-listening", isListening);
    voiceButton.textContent = isListening ? "停止" : "语音";
    element.classList.toggle("is-voice-listening", isListening);
    voiceCapture.hidden = !isListening;
    voiceCopy.textContent = "开始说吧，点停止结束";
    generateButton.disabled = isListening;

    if (isListening) {
      startVoiceTimer();
    } else {
      stopVoiceTimer();
    }
  }

  function setVoiceFinalizing() {
    voiceButton.disabled = true;
    voiceButton.classList.remove("is-listening");
    voiceButton.textContent = "整理中...";
    element.classList.add("is-voice-listening");
    voiceCapture.hidden = false;
    voiceCopy.textContent = "正在整理语音...";
    stopVoiceTimer();
  }

  function startVoiceTimer() {
    voiceStartedAt = Date.now();
    updateVoiceTimer();
    stopVoiceTimer();
    voiceTimerId = window.setInterval(updateVoiceTimer, 1000);
  }

  function stopVoiceTimer() {
    if (voiceTimerId) {
      window.clearInterval(voiceTimerId);
      voiceTimerId = 0;
    }
  }

  function updateVoiceTimer() {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - voiceStartedAt) / 1000));
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
    const seconds = String(elapsedSeconds % 60).padStart(2, "0");
    voiceTimer.textContent = `${minutes}:${seconds}`;
  }

  function updateCounter() {
    counter.textContent = `${textarea.value.length}/${MAX_INPUT_LENGTH}`;
  }

  function setGenerateMode(mode) {
    generateMode = mode === "self" ? "self" : INPUT_PANEL_DEFAULT_GENERATE_MODE;
    modeButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.mode === generateMode);
    });
  }

  function setTemplateProfileId(value) {
    const nextValue = TEMPLATE_OPTIONS.some((option) => option.id === value)
      ? value
      : AUTO_TEMPLATE_ID;
    const option = TEMPLATE_OPTIONS.find((item) => item.id === nextValue);
    templateProfileId = nextValue;
    templateSelect.value = nextValue;
    templateDescription.textContent = option?.description || "";
  }

  setTemplateProfileId(AUTO_TEMPLATE_ID);

  return {
    element,
    getValue,
    setValue,
    setBusy,
    setGenerateMode,
    setTemplateProfileId
  };
}

function pickPlaceholderExample(currentValue = "") {
  const candidates = PLACEHOLDER_EXAMPLES.filter((item) => item !== currentValue);
  const pool = candidates.length > 0 ? candidates : PLACEHOLDER_EXAMPLES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function normalizeVoiceSession(voiceResult) {
  if (voiceResult?.result && typeof voiceResult.result.then === "function") {
    return voiceResult;
  }

  return {
    result: Promise.resolve(voiceResult || ""),
    stop: null
  };
}

function createTemplateExampleImages(option) {
  if (!Array.isArray(option.exampleImages) || option.exampleImages.length === 0) {
    return null;
  }

  const grid = document.createElement("div");
  grid.className = "template-example-grid";

  option.exampleImages.forEach((src, index) => {
    const image = document.createElement("img");
    image.src = src;
    image.alt = `${option.label}示例${index + 1}`;
    image.loading = "lazy";
    grid.append(image);
  });

  return grid;
}

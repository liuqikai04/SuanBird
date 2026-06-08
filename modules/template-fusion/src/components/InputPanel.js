export function createInputPanel({ examples, onGenerate, onVoice }) {
  const element = document.createElement("article");
  element.className = "input-panel";
  element.innerHTML = `
    <label class="input-label" for="rant-input">今天想吐槽什么？</label>
    <textarea id="rant-input" rows="5" maxlength="120" placeholder="比如：同事又抢我功劳，领导又开始画饼..."></textarea>
    <div class="example-row" aria-label="示例槽点"></div>
    <div class="action-row">
      <button class="secondary-button" type="button" data-action="voice">语音</button>
      <button class="primary-button" type="button" data-action="generate">生成表情包</button>
    </div>
  `;

  const textarea = element.querySelector("textarea");
  const exampleRow = element.querySelector(".example-row");
  const generateButton = element.querySelector('[data-action="generate"]');
  const voiceButton = element.querySelector('[data-action="voice"]');

  for (const example of examples) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "example-chip";
    button.textContent = example;
    button.addEventListener("click", () => {
      setValue(example);
      textarea.focus();
    });
    exampleRow.append(button);
  }

  generateButton.addEventListener("click", () => {
    onGenerate(getValue());
  });

  textarea.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      onGenerate(getValue());
    }
  });

  voiceButton.addEventListener("click", async () => {
    const transcript = await onVoice();
    if (transcript) {
      setValue(transcript);
    }
  });

  function getValue() {
    return textarea.value;
  }

  function setValue(value) {
    textarea.value = value;
  }

  function setBusy(isBusy) {
    generateButton.disabled = isBusy;
    voiceButton.disabled = isBusy;
    textarea.disabled = isBusy;
    generateButton.textContent = isBusy ? "生成中..." : "生成表情包";
  }

  return {
    element,
    getValue,
    setValue,
    setBusy
  };
}

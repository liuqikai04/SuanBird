export function createApiKeyPanel({ hasKey, onSave }) {
  const element = document.createElement("article");
  element.className = "api-key-panel";
  element.innerHTML = `
    <button class="api-key-toggle" type="button">
      ${hasKey ? "MiniMax 直连已配置" : "配置 MiniMax 直连"}
    </button>
    <div class="api-key-form" hidden>
      <input type="password" placeholder="粘贴 MiniMax API Key，本地浏览器保存" />
      <button class="secondary-button" type="button">保存</button>
    </div>
  `;

  const toggle = element.querySelector(".api-key-toggle");
  const form = element.querySelector(".api-key-form");
  const input = element.querySelector("input");
  const save = element.querySelector(".secondary-button");

  toggle.addEventListener("click", () => {
    form.hidden = !form.hidden;
  });

  save.addEventListener("click", () => {
    onSave(input.value);
    input.value = "";
    form.hidden = true;
    toggle.textContent = "MiniMax 直连已配置";
  });

  return element;
}

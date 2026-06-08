import { escapeHtml } from "../utils/escapeHtml.js";

export function createHistoryStrip(items, { onSelect }) {
  const element = document.createElement("div");
  element.className = "history-strip";

  if (!items.length) {
    element.innerHTML = `
      <div class="section-heading">
        <h2>最近生成</h2>
        <p>保存最近 3 张。</p>
      </div>
      <div class="history-empty">生成后这里会出现你的蒜鸟战绩。</div>
    `;
    return element;
  }

  element.innerHTML = `
      <div class="section-heading">
        <h2>最近生成</h2>
      <p>点击回看。</p>
      </div>
    <div class="history-list"></div>
  `;

  const list = element.querySelector(".history-list");

  for (const item of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-item";
    button.innerHTML = `
      <img src="${escapeHtml(item.imageUrl)}" alt="" />
      <span>
        <strong>${escapeHtml(item.promptLabel || item.scene)}</strong>
        <small>${escapeHtml(item.summary || item.compliment)}</small>
      </span>
    `;
    button.addEventListener("click", () => onSelect(item));
    list.append(button);
  }

  return element;
}

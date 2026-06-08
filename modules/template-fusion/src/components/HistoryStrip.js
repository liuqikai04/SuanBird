export function createHistoryStrip(items, { onSelect }) {
  const element = document.createElement("div");
  element.className = "history-strip";

  if (!items.length) {
    element.innerHTML = `
      <div class="section-heading">
        <h2>最近生成</h2>
        <p>本机保留最近 3 张，方便录屏和回看。</p>
      </div>
      <div class="history-empty">生成后这里会出现历史卡片。</div>
    `;
    return element;
  }

  element.innerHTML = `
    <div class="section-heading">
      <h2>最近生成</h2>
      <p>点击可切回历史结果。</p>
    </div>
    <div class="history-list"></div>
  `;

  const list = element.querySelector(".history-list");

  for (const item of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-item";
    button.innerHTML = `
      <img src="${item.imageUrl}" alt="" />
      <span>${item.scene}</span>
    `;
    button.addEventListener("click", () => onSelect(item));
    list.append(button);
  }

  return element;
}

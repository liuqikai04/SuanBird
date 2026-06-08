export function createResultCard(result, { onSave, onRetry }) {
  const element = document.createElement("article");
  element.className = "result-card";
  element.dataset.exportTarget = "meme-card";
  element.innerHTML = `
    <div class="image-frame">
      <img src="${result.imageUrl}" alt="生成的丑萌表情包形象" />
    </div>
    <div class="result-content">
      <div class="tag-row">
        <span>${result.scene}</span>
        <span>${result.emotion}</span>
        ${result.tags.slice(0, 2).map((tag) => `<span>${tag}</span>`).join("")}
      </div>
      <p class="source-text">${result.text}</p>
      <h2>${result.compliment}</h2>
    </div>
    <div class="result-actions">
      <button class="secondary-button" type="button" data-action="retry">再来一张</button>
      <button class="primary-button" type="button" data-action="save">保存图片</button>
    </div>
  `;

  element.querySelector('[data-action="save"]').addEventListener("click", () => {
    onSave(result);
  });

  element.querySelector('[data-action="retry"]').addEventListener("click", () => {
    onRetry(result);
  });

  return element;
}

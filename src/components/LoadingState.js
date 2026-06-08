export function createLoadingState() {
  const element = document.createElement("article");
  element.className = "loading-state";
  element.innerHTML = `
    <div class="loading-orbit" aria-hidden="true"></div>
    <h2>正在把槽点揉成表情包</h2>
    <p>先拆文案，再生成丑萌图。</p>
    <div class="progress-track"><span></span></div>
  `;
  return element;
}

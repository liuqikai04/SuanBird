export function createLoadingState() {
  const element = document.createElement("article");
  element.className = "loading-state";
  element.innerHTML = `
    <div class="loading-orbit" aria-hidden="true"></div>
    <h2>正在把槽点揉成表情包</h2>
    <p>解析场景、生成图像、写一句反向夸夸。</p>
  `;
  return element;
}

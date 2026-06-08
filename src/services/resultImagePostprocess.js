export async function overlayResultTitle(imageUrl, title) {
  const image = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const titleBandHeight = Math.max(Math.round(canvas.height * 0.22), 220);
  const bandTop = canvas.height - titleBandHeight;

  context.fillStyle = "#000000";
  context.fillRect(0, bandTop, canvas.width, titleBandHeight);

  const fontSize = fitTitleFontSize(context, title, canvas.width);
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `900 ${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
  context.fillText(title, canvas.width / 2, bandTop + titleBandHeight / 2);

  return canvas.toDataURL("image/png");
}

function fitTitleFontSize(context, title, canvasWidth) {
  const minFontSize = 88;
  const maxFontSize = Math.round(canvasWidth * 0.15);
  const maxTextWidth = canvasWidth * 0.82;

  for (let size = maxFontSize; size >= minFontSize; size -= 4) {
    context.font = `900 ${size}px "Microsoft YaHei", "PingFang SC", sans-serif`;

    if (context.measureText(title).width <= maxTextWidth) {
      return size;
    }
  }

  return minFontSize;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("结果图加载失败，无法覆盖标题。"));
    image.src = src;
  });
}

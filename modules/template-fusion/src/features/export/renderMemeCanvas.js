export async function renderMemeCanvas(result) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const width = 1080;
  const height = 1350;

  canvas.width = width;
  canvas.height = height;

  drawBackground(ctx, width, height);

  const image = await loadImage(result.imageUrl);
  drawImageFrame(ctx, image, 130, 110, 820, 720);

  drawPill(ctx, result.scene, 130, 880, "#1f2937", "#ffffff");
  drawPill(ctx, result.emotion, 270, 880, "#f4d35e", "#1f2937");

  ctx.fillStyle = "#24201a";
  ctx.font = "700 54px system-ui, sans-serif";
  wrapText(ctx, result.compliment, 130, 990, 820, 72, 3);

  ctx.fillStyle = "#6b6257";
  ctx.font = "400 30px system-ui, sans-serif";
  wrapText(ctx, result.text, 130, 1210, 820, 44, 2);

  ctx.fillStyle = "#24201a";
  ctx.font = "700 32px system-ui, sans-serif";
  ctx.fillText("吐槽一下", 130, 1295);

  return canvas;
}

function drawBackground(ctx, width, height) {
  ctx.fillStyle = "#f7f3ea";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#fffaf0";
  roundRect(ctx, 70, 70, width - 140, height - 140, 38);
  ctx.fill();
}

function drawImageFrame(ctx, image, x, y, width, height) {
  ctx.save();
  roundRect(ctx, x, y, width, height, 34);
  ctx.clip();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, width, height);
  ctx.drawImage(image, x, y, width, height);
  ctx.restore();
}

function drawPill(ctx, text, x, y, background, color) {
  ctx.save();
  ctx.font = "700 28px system-ui, sans-serif";
  const width = Math.max(108, ctx.measureText(text).width + 42);
  roundRect(ctx, x, y, width, 54, 27);
  ctx.fillStyle = background;
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillText(text, x + 21, y + 36);
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const chars = Array.from(text);
  let line = "";
  let lineCount = 0;

  for (const char of chars) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = char;
      y += lineHeight;
      lineCount += 1;

      if (lineCount >= maxLines - 1) {
        break;
      }
    } else {
      line = testLine;
    }
  }

  if (line) {
    ctx.fillText(line, x, y);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

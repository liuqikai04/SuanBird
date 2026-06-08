import { renderMemeCanvas } from "./renderMemeCanvas.js";

export async function exportResultImage(result) {
  const canvas = await renderMemeCanvas(result);
  const link = document.createElement("a");
  link.download = `tu-cao-${result.id || Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

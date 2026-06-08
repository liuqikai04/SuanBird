export async function exportResultImage(result) {
  const imageUrl = String(result?.imageUrl || "").trim();

  if (!imageUrl) {
    throw new Error("No generated image to save.");
  }

  const fileNameBase = `tu-cao-${sanitizeFileName(result.id || Date.now())}`;

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Image download failed: ${response.status}`);
    }

    const blob = await response.blob();
    downloadBlob(blob, `${fileNameBase}.${inferImageExtension(blob.type, imageUrl)}`);
  } catch {
    triggerDirectDownload(imageUrl, `${fileNameBase}.${inferImageExtension("", imageUrl)}`);
  }
}

function downloadBlob(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob);
  triggerDirectDownload(objectUrl, fileName);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function triggerDirectDownload(imageUrl, fileName) {
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = fileName;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
}

function inferImageExtension(mimeType, imageUrl) {
  if (mimeType.includes("jpeg")) return "jpg";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("svg")) return "svg";

  const pathExtension = String(imageUrl)
    .split("?")[0]
    .match(/\.([a-z0-9]+)$/i)?.[1]
    ?.toLowerCase();

  return ["jpg", "jpeg", "png", "webp", "svg"].includes(pathExtension)
    ? pathExtension
    : "png";
}

function sanitizeFileName(value) {
  return String(value)
    .trim()
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "") || Date.now();
}

import { getRequestConfig } from "../config/imageModelConfig.js";

export async function createFusionImage({ payload, resolveImageUrlFromResponse }) {
  const { apiUrl, apiKey, timeoutMs } = getRequestConfig();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const responseJson = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail = responseJson?.error?.message || response.statusText || "Unknown error";
      throw new Error(`接口调用失败: ${response.status} ${detail}`);
    }

    return {
      imageUrl: resolveImageUrlFromResponse(responseJson),
      raw: responseJson
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("请求超时，请稍后重试，或在配置里调大 timeoutMs。");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("模板图读取失败。"));
    reader.readAsDataURL(file);
  });
}

export function triggerImageDownload(imageUrl, fileName) {
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = fileName;
  link.rel = "noopener";
  link.click();
}

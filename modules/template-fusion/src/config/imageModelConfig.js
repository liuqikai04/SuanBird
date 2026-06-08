const API_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const API_KEY = "";
const MODEL_NAME = "doubao-seedream-5-0-260128";

export function getConfigStatus() {
  const hasUrl = API_URL && !API_URL.includes("PASTE_YOUR");
  const hasKey = API_KEY && !API_KEY.includes("PASTE_YOUR");

  return {
    ready: hasUrl && hasKey,
    apiUrl: API_URL,
    apiKey: API_KEY
  };
}

export function getRequestConfig() {
  return {
    apiUrl: API_URL,
    apiKey: API_KEY,
    model: MODEL_NAME,
    timeoutMs: 120000
  };
}

export function buildImageRequestPayload({ prompt, templateImage, fileName, useTemplateImage }) {
  const payload = {
    model: MODEL_NAME,
    prompt,
    size: "2K",
    response_format: "url",
    watermark: false,
    metadata: {
      template_image_name: fileName,
      use_template_image: Boolean(useTemplateImage)
    }
  };

  if (useTemplateImage && templateImage) {
    payload.image = templateImage;
  }

  return payload;
}

export function resolveImageUrlFromResponse(responseJson) {
  if (typeof responseJson?.image_url === "string") {
    return responseJson.image_url;
  }

  if (typeof responseJson?.url === "string") {
    return responseJson.url;
  }

  if (typeof responseJson?.output === "string") {
    return responseJson.output;
  }

  if (Array.isArray(responseJson?.output) && typeof responseJson.output[0] === "string") {
    return responseJson.output[0];
  }

  const firstDataItem = responseJson?.data?.[0];

  if (typeof firstDataItem?.url === "string") {
    return firstDataItem.url;
  }

  if (typeof firstDataItem?.b64_json === "string") {
    return `data:image/png;base64,${firstDataItem.b64_json}`;
  }

  throw new Error(
    "接口已返回数据，但没有识别到图片地址。请在 src/config/imageModelConfig.js 里调整 resolveImageUrlFromResponse。"
  );
}

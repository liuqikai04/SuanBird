const IMAGE_PROXY_PATH = "/api/image/generate";
const LOCAL_IMAGE_PROXY = "http://localhost:8787/api/image/generate";
const MODEL_NAME = "doubao-seedream-5-0-260128";

export function getConfigStatus() {
  return {
    ready: typeof fetch !== "undefined",
    apiUrl: getImageProxyEndpoint(),
    apiKey: ""
  };
}

export function getRequestConfig() {
  return {
    apiUrl: getImageProxyEndpoint(),
    apiKey: "",
    model: MODEL_NAME,
    timeoutMs: 120000
  };
}

export function buildImageRequestPayload({
  prompt,
  templateImage,
  fileName,
  useTemplateImage
}) {
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
  if (typeof responseJson?.data?.imageUrl === "string") {
    return responseJson.data.imageUrl;
  }

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
    "接口已返回数据，但没有识别到图片地址。请检查图像代理或 resolveImageUrlFromResponse。"
  );
}

function getImageProxyEndpoint() {
  if (
    typeof window !== "undefined" &&
    window.location?.protocol?.startsWith("http") &&
    window.location?.origin
  ) {
    return `${window.location.origin}${IMAGE_PROXY_PATH}`;
  }

  return LOCAL_IMAGE_PROXY;
}

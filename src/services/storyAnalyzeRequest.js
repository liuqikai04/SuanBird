const DEFAULT_GENERATE_MODE = "vent";

export function buildAnalyzeStoryRequest(storyText, options = {}) {
  const timestamp = Number(options.timestamp || Date.now());
  const sourceType = options.sourceType === "speech" ? "speech" : "text";

  return {
    userId: options.userId || buildTimestampId("u", timestamp),
    roomId: options.roomId || buildTimestampId("r", timestamp),
    storyText: String(storyText || "").trim(),
    sourceType,
    generateMode: options.generateMode || DEFAULT_GENERATE_MODE
  };
}

function buildTimestampId(prefix, timestamp) {
  return `${prefix}${String(timestamp).slice(-8)}`;
}

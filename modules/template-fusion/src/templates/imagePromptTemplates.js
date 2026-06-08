export function buildImagePrompt(aiResult, styleSeed = "") {
  return [
    "square meme image",
    "cute exaggerated cartoon character",
    "not a real person",
    "clean background",
    `scene: ${aiResult.scene}`,
    `object: ${aiResult.object}`,
    `emotion: ${aiResult.emotion}`,
    `tags: ${aiResult.tags.join(", ")}`,
    styleSeed ? `style seed: ${styleSeed}` : ""
  ]
    .filter(Boolean)
    .join("; ");
}

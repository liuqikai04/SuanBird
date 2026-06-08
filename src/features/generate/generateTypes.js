export function createEmptyResult() {
  return {
    id: "",
    text: "",
    scene: "其他",
    emotion: "",
    object: "",
    tags: [],
    compliment: "",
    imageUrl: "",
    summary: "",
    promptLabel: "",
    imagePrompt: "",
    visualCharacter: "",
    memeText: "",
    animationPrompt: "",
    generateMode: "vent",
    mockTitle: "",
    mockSummary: "",
    mockTags: [],
    villainType: "",
    facialExpression: "",
    signaturePose: "",
    mockProps: [],
    memeTexts: [],
    roastCopy: "",
    publicExecutionCopy: "",
    stickerPrompt: "",
    templatePrompt: "",
    templateKey: "",
    requestedTemplateProfileId: "auto",
    templateProfileId: "",
    templateProfileLabel: "",
    templateTitle: "",
    promptSource: "local",
    sourceType: "text",
    needUserConfirm: false,
    createdAt: ""
  };
}

export function createResultId() {
  return `result_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

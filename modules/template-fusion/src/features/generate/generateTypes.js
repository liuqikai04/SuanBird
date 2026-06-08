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
    createdAt: ""
  };
}

export function createResultId() {
  return `result_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

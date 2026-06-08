const templatesByScene = {
  职场: [
    "你认真负责、尊重成果，是职场里很难得的体面人。",
    "你清醒务实，不会被空话带跑，判断力一直都在线。"
  ],
  生活: [
    "你愿意把小事说出来，说明你很会照顾自己的情绪。",
    "你没有被糟心事带偏，还能吐槽得这么精准，很有生活判断力。"
  ],
  通勤: [
    "你守时又有秩序感，是城市通勤里的隐藏稳定器。",
    "你能在混乱里保持清醒，这份耐心已经很厉害了。"
  ],
  消费: [
    "你看重体验也尊重付出，当然值得被认真对待。",
    "你能发现问题并说清来龙去脉，是很强的生活质检员。"
  ],
  社交: [
    "你在意关系里的回应和边界，这份真诚很珍贵。",
    "你没有装作没事，而是认真感受自己，这很勇敢。"
  ],
  其他: [
    "你能把糟心事讲出来，已经是在给情绪找出口了。",
    "你没被坏心情吞掉，还能保留一点幽默感，很不容易。"
  ]
};

export function buildFallbackCompliment(sceneInfo, text = "") {
  const templates = templatesByScene[sceneInfo.scene] || templatesByScene.其他;
  const index = Math.abs(hash(`${sceneInfo.scene}${sceneInfo.emotion}${text}`)) % templates.length;
  return templates[index];
}

function hash(value) {
  return Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

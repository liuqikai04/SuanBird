const templateRules = [
  {
    key: "workplace",
    scenes: ["职场"],
    keywords: ["职场", "同事", "领导", "老板", "甩锅", "背锅", "抢功", "画饼", "开会", "汇报", "绩效"]
  },
  {
    key: "commute",
    scenes: ["通勤"],
    keywords: ["通勤", "地铁", "公交", "堵车", "迟到", "早高峰", "晚高峰", "打车"]
  },
  {
    key: "social",
    scenes: ["社交"],
    keywords: ["社交", "朋友", "已读不回", "爽约", "冷场", "群聊", "相亲", "恋爱"]
  },
  {
    key: "life",
    scenes: ["生活", "消费"],
    keywords: ["生活", "消费", "外卖", "快递", "货不对板", "售后", "退款", "排队", "插队", "噪音", "物业", "房东"]
  }
];

export function selectImageTemplateKey(analysis) {
  const haystack = [
    analysis.scene,
    analysis.object,
    analysis.promptLabel,
    analysis.summary,
    analysis.imagePrompt,
    ...(analysis.tags || []),
    ...(analysis.complaintTags || [])
  ]
    .filter(Boolean)
    .join(" ");

  let bestKey = "default";
  let bestScore = 0;

  for (const rule of templateRules) {
    let score = 0;

    if (rule.scenes.includes(analysis.scene)) {
      score += 3;
    }

    score += rule.keywords.reduce(
      (sum, keyword) => sum + Number(haystack.includes(keyword)),
      0
    );

    if (score > bestScore) {
      bestScore = score;
      bestKey = rule.key;
    }
  }

  return bestKey;
}

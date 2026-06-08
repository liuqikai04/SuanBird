const DEFAULT_SCENE = {
  scene: "其他",
  object: "糟心事",
  emotion: "疲惫",
  tags: ["情绪出口", "自我关照"]
};

const sceneRules = [
  {
    scene: "职场",
    keywords: ["同事", "领导", "老板", "开会", "画饼", "抢功", "加班", "绩效", "汇报"],
    object: "职场槽点",
    emotion: "委屈",
    tags: ["职场", "边界感", "清醒"]
  },
  {
    scene: "通勤",
    keywords: ["地铁", "公交", "堵车", "迟到", "打车", "通勤", "早高峰", "晚高峰"],
    object: "通勤槽点",
    emotion: "疲惫",
    tags: ["通勤", "秩序感", "耐心"]
  },
  {
    scene: "消费",
    keywords: ["外卖", "快递", "买", "商家", "客服", "退款", "货不对板", "售后"],
    object: "消费槽点",
    emotion: "无语",
    tags: ["消费", "体验", "质检"]
  },
  {
    scene: "社交",
    keywords: ["朋友", "已读", "不回", "爽约", "冷场", "聊天", "群聊", "相亲"],
    object: "社交槽点",
    emotion: "尴尬",
    tags: ["社交", "真诚", "边界感"]
  },
  {
    scene: "生活",
    keywords: ["排队", "插队", "邻居", "噪音", "天气", "做饭", "房东", "物业", "卫生"],
    object: "生活槽点",
    emotion: "无语",
    tags: ["生活", "秩序", "情绪出口"]
  }
];

export function pickSceneByText(text) {
  const normalizedText = normalizeText(text);
  let bestMatch = null;
  let bestScore = 0;

  for (const rule of sceneRules) {
    const score = rule.keywords.reduce(
      (sum, keyword) => sum + Number(normalizedText.includes(keyword)),
      0
    );

    if (score > bestScore) {
      bestScore = score;
      bestMatch = rule;
    }
  }

  return bestMatch || DEFAULT_SCENE;
}

function normalizeText(text) {
  return String(text || "").trim().toLowerCase();
}

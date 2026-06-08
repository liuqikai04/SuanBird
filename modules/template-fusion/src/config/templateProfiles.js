const COMMON_TITLE_PATTERN =
  /标题(?:写|为|叫)?[“"'‘’]?([\u4e00-\u9fa5]{2,8}(?:怪|客|兽|云|泡泡|鸽子怪|舍友|大爷|大妈))[”"'‘’]?/;

const COMMON_TITLE_RULES = [
  { keywords: ["已读", "不回", "朋友圈"], title: "已读怪" },
  { keywords: ["噪音", "电钻", "装修"], title: "噪音怪" },
  { keywords: ["甩锅", "推责"], title: "甩锅怪" }
];

const MONSTER_ATLAS_PROFILE = {
  id: "monster-atlas",
  label: "黑白怪物图鉴",
  promptIntro:
    "请基于上传模板图里所有示例的共同风格，创作一张新的、风格一致的衍生怪物梗图。",
  styleSummary: [
    "参考模板全集的共同视觉语言，生成像从这张怪物图鉴里单独裁出来的一格",
    "纯黑底，纯白图形，没有彩色，没有灰阶，没有渐变，没有写实光影",
    "白色粗线和大块白色剪影结合，角色内部用黑色挖空形成眼睛、嘴、表情和服饰",
    "边缘有低分辨率像素锯齿、粉笔颗粒、丝网印刷漏墨和扫描噪点感",
    "造型是简化的讽刺小怪物图标，不是精致插画；比例夸张，身体敦实，动作荒诞",
    "画面构成像表情包图鉴条目：上方单个主题怪物或少量辅助小人，下方一个短中文名称",
    "主体轮廓要清楚，留出大量黑色负空间，白色元素集中成醒目的图标轮廓",
    "中文标题使用厚重、粗糙、略像手刻版画的白色块字，放在底部居中"
  ],
  extraRules: [
    "不要写实摄影风",
    "不要彩色主调，保持黑白单色风格",
    "不要铅笔素描感",
    "不要细腻漫画线稿",
    "不要星空背景或装饰性散点过多",
    "不要复杂透视场景",
    "不要海报排版感",
    "不要偏日漫精致立绘",
    "不要保留原模板上的其他多个角色分格",
    "不要生成完整房间场景，优先生成图标化怪物条目"
  ],
  compositionTemplate(titleHint) {
    return `构图要求：单格图鉴式构图，主体居中，上方是图标化怪物动作，下方放中文标题“${titleHint}”；主体和标题之间留黑色空隙，整体像模板合集中的一个新条目。`;
  },
  goal:
    "目标效果：让人一眼看出这是和模板同系列的新图，而不是对原图做轻微描边重绘。",
  explicitTitlePattern: COMMON_TITLE_PATTERN,
  titleRules: COMMON_TITLE_RULES,
  fileNameRules: [{ includes: "插队", title: "甩锅怪" }],
  defaultTitle: "甩锅怪"
};

const CREATURE_FLASHCARD_PROFILE = {
  id: "creature-flashcard",
  label: "动物变种图鉴",
  promptIntro:
    "请基于上传模板图里所有示例的共同风格，创作一张新的、风格一致的动物变种图鉴卡片。",
  styleSummary: [
    "参考模板中的图鉴卡片风格，生成像整套系列里新增的一张单独条目",
    "先选择一个真实可辨认的动物原型，再把社会行为主题嫁接到这个动物身上，形成动物变种，而不是抽象团子怪",
    "角色必须保留明显动物特征，例如鹿角、蛙眼、龟壳、乌鸦喙、蛇身、猫耳、鱼鳞、树懒姿态这类可识别线索",
    "动物身上再叠加主题变异部件或道具，例如电钻、手机、时钟、锅、秤、云团、队列、屏幕、标牌",
    "米白或浅纸色背景，干净留白，主体是居中的彩色动物变种插画",
    "角色使用柔和水彩或马克笔上色，颜色偏低饱和，线稿细而稳定，边缘轻微手绘感",
    "整体气质是轻松讽刺、可爱中带吐槽，像一本幽默动物怪物词典",
    "标题区通常包含编号、中文名称和简短英文副标题，文字排版整洁清楚，主体下方有一两句短说明"
  ],
  extraRules: [
    "不要纯黑背景",
    "不要黑白剪影风",
    "不要丝网印刷噪点占主导",
    "不要复杂写实背景",
    "不要做成九宫格合集，只生成单张卡片",
    "不要过强的三维渲染感",
    "不要赛博朋克或电影海报风",
    "不要把主体画成没有动物来源的通用小怪物",
    "不要丢掉动物辨识度",
    "保持标题、英文副标题和释义像图鉴卡片一样规整"
  ],
  compositionTemplate(titleHint) {
    return `构图要求：做成一张独立图鉴卡片，上方放编号、中文标题“${titleHint}”和简短英文副标题，中间是单个彩色动物变种角色，下方是一两句短说明；主体必须一眼看出是哪种动物被主题污染或改造，整体要像模板中的单张卡片，而不是自由海报。`;
  },
  goal:
    "目标效果：让人一眼认出这是同一套动物变种图鉴中的新成员，既能看出原型动物，也能看出被吐槽主题改造成了什么。",
  explicitTitlePattern: COMMON_TITLE_PATTERN,
  titleRules: COMMON_TITLE_RULES,
  fileNameRules: [{ includes: "已读", title: "已读怪" }],
  defaultTitle: "已读怪"
};

const FURRY_MASCOT_PROFILE = {
  id: "furry-mascot-sheet",
  label: "毛球怪手绘系列",
  promptIntro:
    "请基于上传模板图里所有示例的共同风格，创作一张新的、风格一致的毛球怪系列条目。",
  styleSummary: [
    "参考模板中的统一主角设定，生成像同一套毛球怪系列里新增的一格",
    "纯白或很浅的纸张背景，黑色手绘线稿为主，几乎没有颜色填充",
    "主体是同一只圆滚滚、毛茸茸、带小角、圆眼睛、露齿笑的毛球怪，通过姿态和道具变化表达不同主题",
    "角色的基础体型要稳定，像同一只主角在不同场景里的变体，而不是每次换一种生物原型",
    "线条像钢笔或漫画墨线，简单、干净、略带毛边，带一点轻松的手绘速写感",
    "一个主题通常只配一个核心道具或一个简洁小场景，例如喇叭、电钻、时钟、电脑、鱼缸、手机、秤、队伍",
    "构图像合集中的单格：上方是中文标题，中间是毛球怪主体，下方留一些空白，不做复杂版式",
    "整体气质是可爱、荒诞、讽刺，像同一只毛球怪在演不同生活槽点"
  ],
  extraRules: [
    "不要彩色水彩卡片风",
    "不要米白图鉴释义排版",
    "不要写实阴影",
    "不要把主体换成动物原型",
    "不要复杂背景",
    "不要九宫格合集",
    "不要过度精细的插画质感",
    "保持统一毛球怪角色的一致性"
  ],
  compositionTemplate(titleHint) {
    return `构图要求：做成一张白底单格手绘条目，上方写中文标题“${titleHint}”，中间是同一只毛球怪拿着或使用主题道具，必要时加一两个辅助小元素表现受害者或环境；整体要像模板中的单格截图，而不是卡片海报。`;
  },
  goal:
    "目标效果：让人一眼看出这是同一只毛球怪主角系列中的新条目，角色身份稳定，主要靠道具和动作来表达主题。",
  explicitTitlePattern: COMMON_TITLE_PATTERN,
  titleRules: COMMON_TITLE_RULES,
  fileNameRules: [{ includes: "已读", title: "已读不回怪" }],
  defaultTitle: "噪音怪"
};

const PASTEL_PLUSH_BESTIARY_PROFILE = {
  id: "pastel-plush-bestiary",
  label: "糖果色吐槽小怪物",
  promptIntro:
    "请基于上传模板图里所有示例的共同风格，创作一张新的、风格一致的糖果色吐槽小怪物条目。",
  styleSummary: [
    "参考模板中的同系列可爱吐槽怪物图鉴，生成像其中新增的一张单格条目",
    "白底或极浅米白色背景，主体居中，留白很多，不要复杂场景",
    "角色是圆润、肉嘟嘟、有点丑萌又有点无辜的小怪物或动物变体，比例头大身体短，眼睛圆圆，表情夸张",
    "配色以薰紫、粉紫、浅粉、淡桃色为主，间或点缀奶白、淡蓝或糖果色，整体低饱和、柔和、甜系",
    "线稿清楚但不粗重，上色是柔软的插画阴影和渐变，带有微弱的果冻感、膨胀感或亮晶晶的高光",
    "主题道具往往直接长在角色身上或者被抱在怀里，例如时钟、电钻、手机、喇叭、锅、标牌、评价泡泡和小云朵",
    "整体气质是可爱、调侃、带点讽刺的社交表情包图鉴，像手机贴纸和网络梗图的结合",
    "排版像图鉴单格：上方是中文标题，中间是主角插画，下方是一小段短的吐槽说明文案"
  ],
  extraRules: [
    "不要黑白线稿风",
    "不要真实动物科普感",
    "不要做成同一只毛球怪反复换道具的风格",
    "不要重口恐怖或黑暗血腥感",
    "不要赛博朋克或电影海报风",
    "不要过度写实的光影和材质",
    "不要九宫格合集，只生成单格条目",
    "保持可爱糖果色、软萌感和网感吐槽气质"
  ],
  compositionTemplate(titleHint) {
    return `构图要求：做成一张独立的图鉴条目，上方写中文标题“${titleHint}”，中间是一只甜系紫粉色可爱吐槽小怪物，把主题内容做成身体特征或核心道具，下方留给一小段吐槽式说明；整体要像白底可爱表情包图鉴新增成员，而不是海报或儿童插画。`;
  },
  goal:
    "目标效果：让人一眼看出这是同一套紫粉糖果色吐槽怪物图鉴的新成员，要可爱，要好笑，也要有点讽刺。",
  explicitTitlePattern: COMMON_TITLE_PATTERN,
  titleRules: COMMON_TITLE_RULES,
  fileNameRules: [{ includes: "已读", title: "已读不回怪" }],
  defaultTitle: "噪音怪"
};

const TEMPLATE_PROFILES = {
  [MONSTER_ATLAS_PROFILE.id]: MONSTER_ATLAS_PROFILE,
  [CREATURE_FLASHCARD_PROFILE.id]: CREATURE_FLASHCARD_PROFILE,
  [FURRY_MASCOT_PROFILE.id]: FURRY_MASCOT_PROFILE,
  [PASTEL_PLUSH_BESTIARY_PROFILE.id]: PASTEL_PLUSH_BESTIARY_PROFILE
};

export const DEFAULT_TEMPLATE_PROFILE = MONSTER_ATLAS_PROFILE;

export function getTemplateProfile(templateId = DEFAULT_TEMPLATE_PROFILE.id) {
  return TEMPLATE_PROFILES[templateId] || DEFAULT_TEMPLATE_PROFILE;
}

export function listTemplateProfiles() {
  return Object.values(TEMPLATE_PROFILES).map((profile) => ({
    id: profile.id,
    label: profile.label
  }));
}

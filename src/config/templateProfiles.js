const COMMON_TITLE_PATTERN =
  /标题(?:写|为|叫)?[“"'‘’]?([\u4e00-\u9fa5]{2,8}(?:怪|客|兽|云|泡泡|鸽子怪|舍友|大爷|大妈))[”"'‘’]?/;

const COMMON_TITLE_RULES = [
  { keywords: ["已读", "不回", "朋友圈"], title: "已读怪" },
  { keywords: ["噪音", "电钻", "装修"], title: "噪音怪" },
  { keywords: ["甩锅", "推责"], title: "甩锅怪" }
];

const GARLIC_BIRD_TITLE_PATTERN =
  /标题(?:写|为|叫)?[“"'‘’]?([\u4e00-\u9fa5]{2,10})[”"'‘’]?/;

const GARLIC_BIRD_TITLE_RULES = [
  { keywords: ["会议", "开会", "隐身"], title: "会议隐身" },
  { keywords: ["已读", "不回", "稍后", "消息"], title: "稍后再回" },
  { keywords: ["社交", "低电量", "尬聊", "群聊"], title: "社交低电量" },
  { keywords: ["快递", "包裹"], title: "等快递中" },
  { keywords: ["加班", "日程", "忙", "排期"], title: "日程爆满" },
  { keywords: ["外卖", "咖啡", "翻车"], title: "咖啡翻车" },
  { keywords: ["天气", "下雨", "淋雨"], title: "淋雨上班" },
  { keywords: ["独处", "一个人"], title: "守护独处" }
];

const TEMPLATE_EXAMPLE_IMAGES = {
  "monster-atlas": [
    new URL("../assets/template-examples/monster-atlas/example-01.png", import.meta.url).href,
    new URL("../assets/template-examples/monster-atlas/example-02.png", import.meta.url).href
  ],
  "creature-flashcard": [
    new URL("../assets/template-examples/creature-flashcard/example-01.png", import.meta.url).href,
    new URL("../assets/template-examples/creature-flashcard/example-02.png", import.meta.url).href
  ],
  "furry-mascot-sheet": [
    new URL("../assets/template-examples/furry-mascot-sheet/example-01.png", import.meta.url).href,
    new URL("../assets/template-examples/furry-mascot-sheet/example-02.png", import.meta.url).href
  ],
  "pastel-plush-bestiary": [
    new URL("../assets/template-examples/pastel-plush-bestiary/example-01.png", import.meta.url).href,
    new URL("../assets/template-examples/pastel-plush-bestiary/example-02.png", import.meta.url).href
  ],
  "sticker-emoji-creature": [
    new URL("../assets/template-examples/sticker-emoji-creature/example-01.png", import.meta.url).href,
    new URL("../assets/template-examples/sticker-emoji-creature/example-02.png", import.meta.url).href
  ],
  "scratchboard-night-creature": [
    new URL("../assets/template-examples/scratchboard-night-creature/example-01.png", import.meta.url).href,
    new URL("../assets/template-examples/scratchboard-night-creature/example-02.png", import.meta.url).href
  ],
  "garlic-bird-grid-localization": [
    new URL("../assets/template-examples/garlic-bird-grid-localization/example-01.png", import.meta.url).href,
    new URL("../assets/template-examples/garlic-bird-grid-localization/example-02.png", import.meta.url).href
  ]
};

const MONSTER_ATLAS_PROFILE = {
  id: "monster-atlas",
  label: "黑白怪物图鉴",
  description: "黑底白形、粗糙块面和底部粗标题，适合甩锅、插队、会议这类强讽刺梗图。",
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
  description: "把槽点嫁接到真实动物原型上，做成米白图鉴卡片，适合已读不回、拖延、噪音等主题。",
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
  description: "白底黑线稿的固定毛球怪主角，靠动作和道具变化表达吐槽，适合噪音、摸鱼、临时鸽。",
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
  description: "紫粉糖果色、软萌小怪物和短吐槽说明，适合社交吐槽、差评、生活小崩溃。",
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

const STICKER_EMOJI_CREATURE_PROFILE = {
  id: "sticker-emoji-creature",
  label: "贴纸感表情怪物",
  description: "像聊天贴纸包里的单张怪物，带外描边、气泡和 emoji 点缀，适合已读不回、双标、嘴硬。",
  promptIntro:
    "请基于模板风格创作一张新的、风格一致的贴纸感表情怪物条目。",
  styleSummary: [
    "白底或浅奶油背景，主体像手机贴纸包中的单张怪物贴纸",
    "角色是圆滚滚、可爱又有点欠的小怪物，轮廓清晰，外形偏表情包和社交贴纸",
    "配色以粉紫、淡蓝、奶白、果冻粉为主，带轻微发光感和糖果色高光",
    "线条比普通插画更干净，最好带一圈明显贴纸外描边或阴影贴边效果",
    "主体周围可以有简短的表情符号、消息气泡、心形、怒气记号、已读标记、震动线之类的小图形",
    "整体像网络贴纸角色，不要复杂场景，重点是角色性格和一个核心行为道具",
    "标题在上，主体在中，下方只放一句非常短的网感吐槽文案",
    "气质要轻巧、可转发表情包化、适合社交传播"
  ],
  extraRules: [
    "不要写实动物图鉴感",
    "不要黑白木刻风",
    "不要复杂背景透视",
    "不要沉重电影海报风",
    "不要长段说明文",
    "不要九宫格合集",
    "不要做成同一只毛球怪重复换道具",
    "保持贴纸包、表情包、社交媒体角色感"
  ],
  compositionTemplate(titleHint) {
    return `构图要求：做成一张单独的贴纸风怪物图，顶部写中文标题“${titleHint}”，中间是一个带核心道具和夸张表情的可爱怪物，周围只点缀少量表情符号或气泡，下方放一句极短吐槽，整体像可以直接发在聊天里的梗图贴纸。`;
  },
  goal:
    "目标效果：让人一眼看出这是社交贴纸风格的新怪物，不是普通插画，也不是严肃图鉴卡片。",
  explicitTitlePattern: COMMON_TITLE_PATTERN,
  titleRules: COMMON_TITLE_RULES,
  fileNameRules: [{ includes: "已读", title: "已读不回怪" }],
  defaultTitle: "已读不回怪"
};

const SCRATCHBOARD_NIGHT_PROFILE = {
  id: "scratchboard-night-creature",
  label: "夜色刮刻怪物",
  description: "深黑夜色背景和粗糙刮刻线条，气质更尖锐，适合甩锅、背刺、压榨、会议折磨。",
  promptIntro:
    "请基于模板风格创作一张新的、风格一致的夜色刮刻怪物条目。",
  styleSummary: [
    "深黑或墨蓝背景，主体像用刮刻版画、粉笔刀刻或粗糙木刻线条刮出来的怪物形象",
    "颜色以黑白灰为主，只允许极少量单一强调色，例如暗红、脏黄或酸绿，用来点亮道具或眼睛",
    "主体是孤立居中的一个怪物角色，轮廓强烈，质感偏粗粝和夜间地下海报",
    "线条不是光滑矢量，而是有断裂、刻痕、颗粒、噪点和版画感",
    "构图更像深夜讽刺海报中的单个 emblem，不需要复杂场景，只保留最必要的受害者或提示道具",
    "中文标题要醒目、厚重、带手刻或刷字感，可以放底部或顶部，但必须和怪物一起形成一个强图形",
    "整体气质是怪诞、阴郁、冷幽默、带一点地下独立海报气息",
    "适合做尖锐讽刺类主题，不要画得太可爱"
  ],
  extraRules: [
    "不要糖果色萌系风",
    "不要动物科普卡片感",
    "不要干净明亮白底",
    "不要复杂电影级光影",
    "不要同一只毛球怪吉祥物感",
    "不要九宫格合集",
    "不要长篇释义文字",
    "保持夜色、刻痕、粗糙图形冲击力"
  ],
  compositionTemplate(titleHint) {
    return `构图要求：做成一张单幅夜色怪物海报条目，深色背景，中心是带版画刮刻质感的主题怪物，中文标题“${titleHint}”要和怪物一起形成强烈图形识别，辅助元素极少，重点突出压迫感和讽刺感。`;
  },
  goal:
    "目标效果：让人一眼看出这是深夜地下海报气质的讽刺怪物，不是普通卡通，也不是图鉴说明卡。",
  explicitTitlePattern: COMMON_TITLE_PATTERN,
  titleRules: COMMON_TITLE_RULES,
  fileNameRules: [{ includes: "甩锅", title: "甩锅怪" }],
  defaultTitle: "甩锅怪"
};

const GARLIC_BIRD_GRID_PROFILE = {
  id: "garlic-bird-grid-localization",
  label: "蒜鸟日常状态格",
  description: "固定蒜鸟主角、浅纸底编号卡片和本地化短标题，适合自嘲、低电量、会议隐身、快递等待等轻吐槽。",
  promptIntro:
    "请基于模板风格创作一张新的、风格一致的蒜鸟日常状态单格表情卡。",
  styleSummary: [
    "浅米色纸张背景，带细线圆角边框，整体像从一组日常状态网格里单独裁出来的一格",
    "左上角有黄色或浅色圆形编号标记，顶部是粗黑中文短标题",
    "主体是固定蒜鸟角色：蒜瓣一样的圆滚滚白色身体，小翅膀、小黄鸟嘴、头顶绿色小芽，表情委屈但可爱",
    "角色周围只放少量生活化道具、气泡、时钟、手机、电量条、门、包裹等辅助元素",
    "画风是柔和手绘、水彩纸感和轻微铅笔线，不要强烈光影，不要复杂背景",
    "情绪表达偏自嘲、低电量、生活小崩溃和轻松吐槽，不做攻击性反派审判",
    "构图简洁，主体居中或略偏下，标题清楚可读，像一张能直接发聊天的本地化状态贴纸"
  ],
  extraRules: [
    "不要把蒜鸟换成其他怪物或真实动物",
    "不要黑白木刻风",
    "不要深色地下海报风",
    "不要复杂房间或完整场景",
    "不要九宫格合集，只生成单格条目",
    "不要尖锐辱骂或审判感",
    "保持固定 IP、浅纸底、编号、中文标题和生活化道具"
  ],
  compositionTemplate(titleHint) {
    return `构图要求：做成一张独立的蒜鸟日常状态格，浅米纸底和细线圆角边框，左上角放圆形编号，顶部写中文标题“${titleHint}”，中间是固定蒜鸟主角，用一两个生活道具或气泡表达用户的轻吐槽状态；整体像模板网格中的新单格，而不是自由插画或海报。`;
  },
  goal:
    "目标效果：让人一眼认出这是同一只蒜鸟 IP 的本地化日常状态新条目，可爱、轻松、适合聊天传播。",
  explicitTitlePattern: GARLIC_BIRD_TITLE_PATTERN,
  titleRules: GARLIC_BIRD_TITLE_RULES,
  fileNameRules: [{ includes: "garlic-bird", title: "稍后再回" }],
  defaultTitle: "稍后再回"
};

const TEMPLATE_PROFILES = {
  [MONSTER_ATLAS_PROFILE.id]: MONSTER_ATLAS_PROFILE,
  [CREATURE_FLASHCARD_PROFILE.id]: CREATURE_FLASHCARD_PROFILE,
  [FURRY_MASCOT_PROFILE.id]: FURRY_MASCOT_PROFILE,
  [PASTEL_PLUSH_BESTIARY_PROFILE.id]: PASTEL_PLUSH_BESTIARY_PROFILE,
  [STICKER_EMOJI_CREATURE_PROFILE.id]: STICKER_EMOJI_CREATURE_PROFILE,
  [SCRATCHBOARD_NIGHT_PROFILE.id]: SCRATCHBOARD_NIGHT_PROFILE,
  [GARLIC_BIRD_GRID_PROFILE.id]: GARLIC_BIRD_GRID_PROFILE
};

export const DEFAULT_TEMPLATE_PROFILE = MONSTER_ATLAS_PROFILE;

export function getTemplateProfile(templateId = DEFAULT_TEMPLATE_PROFILE.id) {
  return TEMPLATE_PROFILES[templateId] || DEFAULT_TEMPLATE_PROFILE;
}

export function listTemplateProfiles() {
  return Object.values(TEMPLATE_PROFILES).map((profile) => ({
    id: profile.id,
    label: profile.label,
    description: profile.description,
    exampleImages: TEMPLATE_EXAMPLE_IMAGES[profile.id] || []
  }));
}

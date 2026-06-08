import { RUNTIME_CONFIG } from "../config/runtimeConfig.js";

const MOCK_TARGET_STORAGE_KEY = "tu-cao-minimax-api-key";
const MOCK_TARGET_MINIMAX_ENDPOINT = "https://api.minimaxi.com/anthropic/v1/messages";
const MOCK_TARGET_DEFAULT_MODEL = "MiniMax-M2.7";
const MOCK_TARGET_TIMEOUT_MS = 45000;

export async function analyzeMockTargetWithMinimaxDirect(storyText, options = {}) {
  const apiKey = options.apiKey || getMockTargetApiKey();

  if (!apiKey || typeof fetch === "undefined") {
    return normalizeMockTargetAnalysis(null, storyText);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MOCK_TARGET_TIMEOUT_MS);

  try {
    const response = await fetch(MOCK_TARGET_MINIMAX_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        Authorization: `Bearer ${apiKey}`,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: options.model || RUNTIME_CONFIG.MINIMAX_MODEL || MOCK_TARGET_DEFAULT_MODEL,
        max_tokens: options.max_tokens || 2048,
        temperature: options.temperature ?? 0.55,
        stream: false,
        messages: [
          {
            role: "user",
            content: buildMockTargetPrompt(storyText)
          }
        ]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      console.info("MiniMax mock target call failed, using fallback result.");
      return normalizeMockTargetAnalysis(null, storyText);
    }

    const raw = await response.json();
    const content = extractMockTargetContent(raw);
    const parsed = parseMockTargetJsonContent(content);

    return normalizeMockTargetAnalysis(parsed, storyText);
  } catch {
    console.info("MiniMax mock target call unavailable, using fallback result.");
    return normalizeMockTargetAnalysis(null, storyText);
  } finally {
    clearTimeout(timeout);
  }
}

export function buildMockTargetPrompt(storyText) {
  return `你是一个“被吐槽对象恶搞形象生成助手”。

你的任务是从用户讲述的一大段吐槽故事中，理解被吐槽对象的行为、槽点、人物关系和冲突，然后把“被吐槽的人”转化成一个适合生成表情包、恶搞角色图、泄愤动画和吐槽台词的娱乐化反派形象。

重要要求：
1. 用户不会直接给你标签，你必须从完整故事中自动识别“被吐槽对象是谁”“TA做了什么”“为什么让人无语”。
2. 不要照抄用户原文，要进行概括、归纳和创意改写。
3. 输出重点不是总结用户情绪，而是生成“被吐槽对象的恶搞设定”。
4. 可以夸张、荒诞、丑萌、阴阳怪气、抽象化，但必须保持娱乐化，不能鼓励现实伤害。
5. 不得输出真实姓名、手机号、住址、公司精确名称、学校班级等隐私信息。
6. 不得攻击真实外貌、身材、疾病、残障、性别、地域、民族、宗教等敏感属性。
7. 如果故事中出现真实人物，要用抽象称呼替代，例如“甩锅型同事”“迟到大王”“消息已读不回怪”“双标王者”等。
8. 恶搞方向应聚焦在行为槽点，而不是人格侮辱。
9. 语言风格要年轻化、社交化、抖音感，适合做表情包和互动空间内容。
10. 只能输出 JSON，不要输出 Markdown，不要输出代码块，不要输出解释。

请严格按照以下 JSON 格式输出：

{
  "targetRole": "被吐槽对象的抽象称呼，例如甩锅型同事、迟到大王、双标室友",
  "mockTitle": "给被吐槽对象起一个恶搞称号，不超过12字",
  "mockSummary": "用一句话概括TA的迷惑行为，不超过35字",
  "scene": "职场、生活、通勤、校园、聚会、网购、家庭、恋爱、游戏、其他 中的一个",
  "coreBehavior": "TA最核心的槽点行为，不超过40字",
  "annoyingLevel": 1,
  "mockTags": ["提炼3到6个恶搞标签，例如甩锅、嘴硬、双标、拖延、阴阳怪气"],
  "villainType": "把TA抽象成一种丑萌反派类型，例如甩锅章鱼怪、拖延树懒精、已读不回石像鬼",
  "visualCharacter": "详细描述被吐槽对象的恶搞视觉形象，适合用于AI生图",
  "facialExpression": "TA的典型表情，例如心虚但嘴硬、装傻、理直气壮、无辜甩锅",
  "signaturePose": "TA的标志性动作，例如一边后退一边甩锅、一手摊开一手装忙",
  "mockProps": ["3到5个代表TA槽点的道具，例如甩锅锅盖、拖延日历、已读不回气泡"],
  "memeTexts": [
    "3到5句适合放在表情包上的短文案，每句不超过18字"
  ],
  "roastCopy": "一段轻度阴阳怪气的吐槽文案，控制在60字以内",
  "publicExecutionCopy": "适合档案馆/公开处刑墙展示的恶搞说明，控制在50字以内",
  "imagePrompt": "用于生成被吐槽对象恶搞表情包图片的中文提示词",
  "animationPrompt": "用于生成被吐槽对象被视觉化吐槽/泄愤动画的中文提示词",
  "stickerPrompt": "用于生成一套表情包贴纸的中文提示词",
  "safeVersion": "如果原始故事攻击性太强，请给出一个更安全、更娱乐化的改写版本",
  "safetyLevel": "safe",
  "confidence": 0.9
}

字段要求：
- annoyingLevel 为 1 到 5 的整数，1 表示轻微无语，5 表示非常离谱。
- imagePrompt 必须包含：丑萌反派、夸张表情、行为槽点道具、表情包风格、高清、无真实姓名。
- animationPrompt 必须是非暴力泄愤，例如被吐槽泡泡包围、被弹幕淹没、被锅盖追着跑、被问号砸懵，不能出现现实伤害。
- stickerPrompt 要适合生成一组 4 到 6 张表情包。
- 如果故事信息不足，也要基于已有内容生成，不要反问用户。

用户故事如下：
${storyText}`;
}

function getMockTargetApiKey() {
  if (RUNTIME_CONFIG.MINIMAX_API_KEY) {
    return RUNTIME_CONFIG.MINIMAX_API_KEY;
  }

  try {
    return window.localStorage.getItem(MOCK_TARGET_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function extractMockTargetContent(raw) {
  const content = raw?.content;

  if (Array.isArray(content)) {
    return content
      .map((item) => item?.text || "")
      .filter(Boolean)
      .join("");
  }

  return raw?.reply || raw?.choices?.[0]?.message?.content || "";
}

function parseMockTargetJsonContent(content) {
  const trimmed = String(content || "")
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start < 0 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalizeMockTargetAnalysis(data, storyText) {
  const fallback = buildMockTargetFallback(storyText);
  const source = data ? "mock-target-direct" : "mock-target-fallback";
  const mockTags = Array.isArray(data?.mockTags)
    ? uniqueMockTargetList(data.mockTags).slice(0, 6)
    : fallback.mockTags;
  const mockProps = Array.isArray(data?.mockProps)
    ? uniqueMockTargetList(data.mockProps).slice(0, 5)
    : fallback.mockProps;
  const memeTexts = Array.isArray(data?.memeTexts)
    ? uniqueMockTargetList(data.memeTexts).slice(0, 5)
    : fallback.memeTexts;

  return {
    source,
    available: Boolean(data),
    analysisMode: "vent",

    targetRole: mockTargetSafeText(data?.targetRole, fallback.targetRole),
    mockTitle: limitMockTargetText(mockTargetSafeText(data?.mockTitle, fallback.mockTitle), 12),
    mockSummary: limitMockTargetText(
      mockTargetSafeText(data?.mockSummary, fallback.mockSummary),
      35
    ),
    scene: normalizeMockTargetScene(data?.scene || fallback.scene),
    coreBehavior: limitMockTargetText(
      mockTargetSafeText(data?.coreBehavior, fallback.coreBehavior),
      40
    ),
    annoyingLevel: clampMockTargetNumber(data?.annoyingLevel ?? fallback.annoyingLevel, 1, 5),

    mockTags,
    villainType: mockTargetSafeText(data?.villainType, fallback.villainType),
    visualCharacter: mockTargetSafeText(data?.visualCharacter, fallback.visualCharacter),
    facialExpression: mockTargetSafeText(data?.facialExpression, fallback.facialExpression),
    signaturePose: mockTargetSafeText(data?.signaturePose, fallback.signaturePose),
    mockProps,
    memeTexts,

    roastCopy: limitMockTargetText(mockTargetSafeText(data?.roastCopy, fallback.roastCopy), 60),
    publicExecutionCopy: limitMockTargetText(
      mockTargetSafeText(data?.publicExecutionCopy, fallback.publicExecutionCopy),
      50
    ),

    imagePrompt: ensureMockTargetImagePrompt(
      mockTargetSafeText(data?.imagePrompt, fallback.imagePrompt),
      fallback
    ),
    animationPrompt: ensureMockTargetAnimationPrompt(
      mockTargetSafeText(data?.animationPrompt, fallback.animationPrompt),
      fallback
    ),
    stickerPrompt: ensureMockTargetStickerPrompt(
      mockTargetSafeText(data?.stickerPrompt, fallback.stickerPrompt),
      fallback
    ),

    safeVersion: mockTargetSafeText(data?.safeVersion, fallback.safeVersion),
    safetyLevel: "safe",
    confidence: clampMockTargetNumber(data?.confidence ?? fallback.confidence, 0, 1)
  };
}

function buildMockTargetFallback(storyText) {
  const text = String(storyText || "").trim();
  const simpleScene = guessMockTargetScene(text);
  const simpleTargetRole = guessMockTargetRole(text);
  const simpleTag = guessMockTargetCoreTag(text);

  return {
    targetRole: simpleTargetRole,
    mockTitle: `${simpleTag}怪`,
    mockSummary: "把迷惑操作发挥到让人沉默的程度",
    scene: simpleScene,
    coreBehavior: "用一套离谱操作精准制造无语瞬间",
    annoyingLevel: 3,
    mockTags: uniqueMockTargetList([simpleTag, "嘴硬", "迷惑操作", "情绪暴击"]),
    villainType: `${simpleTag}丑萌小怪`,
    visualCharacter: `一个${simpleTag}型丑萌反派，圆滚滚身体，夸张表情，手里拿着代表迷惑行为的道具，整体是搞笑表情包风格`,
    facialExpression: "心虚但嘴硬",
    signaturePose: "一边装无辜一边偷偷把锅往外推",
    mockProps: ["甩锅锅盖", "问号气泡", "离谱小本本"],
    memeTexts: ["你也挺会啊", "这操作绝了", "沉默是今晚的我"],
    roastCopy: "这位选手主打一个操作不多，但每一步都精准踩雷。",
    publicExecutionCopy: "因迷惑操作过于稳定，现收录进今日离谱档案。",
    imagePrompt:
      "丑萌反派，夸张表情，行为槽点道具，表情包风格，高清，无真实姓名，一个圆滚滚的迷惑行为小怪，手拿甩锅锅盖和问号气泡，画面搞笑荒诞，适合抖音表情包",
    animationPrompt:
      "非暴力泄愤动画，丑萌反派被吐槽泡泡包围，被弹幕淹没，被问号砸懵，最后举着甩锅锅盖原地转圈，搞笑夸张，不出现现实伤害",
    stickerPrompt:
      "生成一套4到6张丑萌反派表情包贴纸，包含嘴硬、甩锅、装傻、已读不回、被问号砸懵、被弹幕淹没等动作，高清，表情包风格，无真实姓名",
    safeVersion: "把具体人物改写成抽象迷惑行为角色，只吐槽行为，不攻击个人属性。",
    safetyLevel: "safe",
    confidence: 0.55
  };
}

function guessMockTargetScene(text) {
  if (/老板|同事|领导|加班|项目|会议|甲方|工作|职场/.test(text)) return "职场";
  if (/老师|同学|室友|作业|考试|学校|宿舍|校园/.test(text)) return "校园";
  if (/对象|恋爱|男朋友|女朋友|前任|暧昧|分手/.test(text)) return "恋爱";
  if (/爸|妈|亲戚|家里|家庭|父母|孩子/.test(text)) return "家庭";
  if (/地铁|公交|打车|司机|高铁|通勤/.test(text)) return "通勤";
  if (/快递|外卖|淘宝|拼多多|客服|退货|网购/.test(text)) return "网购";
  if (/游戏|队友|开黑|排位|匹配|挂机/.test(text)) return "游戏";
  if (/聚会|朋友|饭局|唱歌|喝酒/.test(text)) return "聚会";
  return "生活";
}

function guessMockTargetRole(text) {
  if (/老板|领导|主管/.test(text)) return "迷惑型领导";
  if (/同事/.test(text)) return "甩锅型同事";
  if (/室友/.test(text)) return "双标型室友";
  if (/朋友/.test(text)) return "已读不回型朋友";
  if (/男朋友|女朋友|对象|前任/.test(text)) return "嘴硬型恋爱选手";
  if (/客服|商家|卖家/.test(text)) return "话术型客服";
  if (/队友/.test(text)) return "迷惑操作型队友";
  return "迷惑行为选手";
}

function guessMockTargetCoreTag(text) {
  if (/甩锅|怪我|推给|责任/.test(text)) return "甩锅";
  if (/不回|已读|消息|微信/.test(text)) return "已读不回";
  if (/迟到|拖|拖延|等了/.test(text)) return "拖延";
  if (/双标|只许|不许/.test(text)) return "双标";
  if (/阴阳|嘲讽|冷嘲热讽/.test(text)) return "阴阳怪气";
  if (/装|不知道|忘了|没看见/.test(text)) return "装傻";
  return "迷惑操作";
}

function normalizeMockTargetScene(scene) {
  const allowedScenes = [
    "职场",
    "生活",
    "通勤",
    "校园",
    "聚会",
    "网购",
    "家庭",
    "恋爱",
    "游戏",
    "其他"
  ];

  return allowedScenes.includes(scene) ? scene : "其他";
}

function mockTargetSafeText(value, fallback = "") {
  const text = String(value || fallback || "").trim();

  return text
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function limitMockTargetText(value, maxLength) {
  const text = mockTargetSafeText(value);
  return text.length <= maxLength ? text : text.slice(0, maxLength);
}

function uniqueMockTargetList(list) {
  const result = [];

  for (const item of list || []) {
    const value = mockTargetSafeText(item);

    if (value && !result.includes(value)) {
      result.push(value);
    }
  }

  return result;
}

function clampMockTargetNumber(value, min, max) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return min;
  }

  return Math.min(max, Math.max(min, number));
}

function ensureMockTargetImagePrompt(prompt, fallback) {
  const requiredWords = [
    "丑萌反派",
    "夸张表情",
    "行为槽点道具",
    "表情包风格",
    "高清",
    "无真实姓名"
  ];
  let finalPrompt = mockTargetSafeText(prompt || fallback.imagePrompt);

  for (const word of requiredWords) {
    if (!finalPrompt.includes(word)) {
      finalPrompt += `，${word}`;
    }
  }

  return finalPrompt;
}

function ensureMockTargetAnimationPrompt(prompt, fallback) {
  let finalPrompt = mockTargetSafeText(prompt || fallback.animationPrompt);
  const unsafeWords = [
    "杀",
    "打死",
    "砍",
    "捅",
    "流血",
    "爆头",
    "真实伤害",
    "殴打",
    "虐待"
  ];
  const hasUnsafeWord = unsafeWords.some((word) => finalPrompt.includes(word));

  if (hasUnsafeWord) {
    finalPrompt =
      "非暴力泄愤动画，丑萌反派被吐槽泡泡包围，被弹幕淹没，被锅盖追着跑，被问号砸懵，搞笑夸张，不出现现实伤害";
  }

  if (!finalPrompt.includes("非暴力")) {
    finalPrompt = `非暴力泄愤动画，${finalPrompt}`;
  }

  if (!finalPrompt.includes("不出现现实伤害")) {
    finalPrompt += "，不出现现实伤害";
  }

  return finalPrompt;
}

function ensureMockTargetStickerPrompt(prompt, fallback) {
  let finalPrompt = mockTargetSafeText(prompt || fallback.stickerPrompt);

  if (!/4|5|6|四|五|六/.test(finalPrompt)) {
    finalPrompt = `生成一套4到6张表情包贴纸，${finalPrompt}`;
  }

  if (!finalPrompt.includes("无真实姓名")) {
    finalPrompt += "，无真实姓名";
  }

  return finalPrompt;
}

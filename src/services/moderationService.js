const riskyPatterns = [
  /杀|死|砍|打爆|人肉|曝光|身份证|手机号|住址/,
  /公司全名|学校全名|真实姓名/
];

const redactionRules = [
  { pattern: /1[3-9]\d{9}/g, replacement: "某个手机号" },
  { pattern: /\b\d{17}[\dXx]\b/g, replacement: "某个身份信息" },
  { pattern: /\b\d{6,}\b/g, replacement: "某些信息" },
  { pattern: /公司全名|学校全名|真实姓名/g, replacement: "具体信息" },
  { pattern: /杀|死|砍|打爆|人肉|曝光/g, replacement: "狠狠吐槽" }
];

export function checkContentSafety(text) {
  const sourceText = String(text || "").trim();
  const hasRisk = riskyPatterns.some((pattern) => pattern.test(sourceText));

  if (!hasRisk) {
    return {
      ok: true,
      safeText: sourceText
    };
  }

  return {
    ok: false,
    safeText: redactRiskyText(sourceText)
  };
}

function redactRiskyText(text) {
  return redactionRules.reduce(
    (safeText, rule) => safeText.replaceAll(rule.pattern, rule.replacement),
    text
  );
}

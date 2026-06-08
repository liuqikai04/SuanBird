import {
  DEFAULT_TEMPLATE_PROFILE,
  getTemplateProfile
} from "../config/templateProfiles.js";

export function buildTemplateAwarePrompt({
  userPrompt,
  fileName,
  templateProfile = DEFAULT_TEMPLATE_PROFILE
}) {
  const profile = resolveTemplateProfile(templateProfile);
  const normalizedPrompt = userPrompt.trim();
  const titleHint = inferTitleHint(normalizedPrompt, fileName, profile);

  return [
    profile.promptIntro,
    `模板风格总结：${profile.styleSummary.join("；")}。`,
    `用户想表达的主题：${normalizedPrompt}。`,
    `额外约束：${profile.extraRules.join("；")}。`,
    profile.compositionTemplate(titleHint),
    profile.goal
  ].join("\n");
}

export function inferTitleHint(
  userPrompt,
  fileName,
  templateProfile = DEFAULT_TEMPLATE_PROFILE
) {
  const profile = resolveTemplateProfile(templateProfile);
  const compact = userPrompt.replace(/\s+/g, "");
  const explicitTitle = compact.match(profile.explicitTitlePattern);

  if (explicitTitle) {
    return explicitTitle[1];
  }

  for (const rule of profile.titleRules) {
    if (rule.keywords.some((keyword) => compact.includes(keyword))) {
      return rule.title;
    }
  }

  for (const rule of profile.fileNameRules) {
    if (fileName.includes(rule.includes)) {
      return rule.title;
    }
  }

  return profile.defaultTitle;
}

function resolveTemplateProfile(templateProfile) {
  if (typeof templateProfile === "string") {
    return getTemplateProfile(templateProfile);
  }

  return templateProfile || DEFAULT_TEMPLATE_PROFILE;
}

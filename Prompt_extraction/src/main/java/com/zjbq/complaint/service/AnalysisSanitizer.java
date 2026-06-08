package com.zjbq.complaint.service;

import com.zjbq.complaint.vo.AnalyzeStoryResponse;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class AnalysisSanitizer {

    private static final Set<String> SCENES = Set.of("职场", "生活", "通勤", "校园", "聚会", "网购", "家庭", "恋爱", "游戏", "其他");

    public AnalyzeStoryResponse sanitize(AnalyzeStoryResponse response) {
        if (response == null) {
            return fallback();
        }
        if (!StringUtils.hasText(response.getSummary())) response.setSummary("用户遇到了一件让人很无语的糟心事。");
        if (!StringUtils.hasText(response.getTargetRole())) response.setTargetRole("离谱当事人");
        if (!SCENES.contains(response.getScene())) response.setScene("其他");
        if (!StringUtils.hasText(response.getEmotion())) response.setEmotion("无语、心累");
        response.setEmotionLevel(Math.min(5, Math.max(1, response.getEmotionLevel() == null ? 3 : response.getEmotionLevel())));
        response.setComplaintTags(normalizeTags(response.getComplaintTags()));
        if (!StringUtils.hasText(response.getCoreConflict())) response.setCoreConflict("用户的感受没有被尊重。");
        if (!StringUtils.hasText(response.getVisualCharacter())) response.setVisualCharacter("一个满脸无辜但疯狂甩锅的丑萌小人");
        if (!StringUtils.hasText(response.getVentTool())) response.setVentTool("把离谱行为揉成纸团扔进吐槽垃圾桶");
        response.setMemeText(truncate(defaultIfBlank(response.getMemeText(), "这也太离谱了吧"), 18));
        response.setPositivePraise(cleanPraise(defaultIfBlank(response.getPositivePraise(), "你能清楚表达自己的感受，已经很勇敢了。")));
        response.setImagePrompt(desensitize(defaultIfBlank(response.getImagePrompt(), fallback().getImagePrompt())));
        response.setAnimationPrompt(defaultIfBlank(response.getAnimationPrompt(), fallback().getAnimationPrompt()));
        if (!"need_review".equals(response.getSafetyLevel())) response.setSafetyLevel("safe");
        response.setConfidence(normalizeConfidence(response.getConfidence()));
        response.setNeedUserConfirm("need_review".equals(response.getSafetyLevel()) || response.getConfidence().compareTo(new BigDecimal("0.70")) < 0);
        return response;
    }

    public AnalyzeStoryResponse fallback() {
        AnalyzeStoryResponse response = new AnalyzeStoryResponse();
        response.setSummary("用户遇到了一件让人很无语的糟心事。");
        response.setTargetRole("离谱当事人");
        response.setScene("其他");
        response.setEmotion("无语、心累");
        response.setEmotionLevel(3);
        response.setComplaintTags(List.of("离谱操作", "让人无语", "情绪受伤"));
        response.setCoreConflict("用户的感受没有被尊重。");
        response.setVisualCharacter("一个满脸无辜但疯狂甩锅的丑萌小人");
        response.setVentTool("把离谱行为揉成纸团扔进吐槽垃圾桶");
        response.setMemeText("这也太离谱了吧");
        response.setPositivePraise("你能清楚表达自己的感受，已经很勇敢了。");
        response.setImagePrompt("丑萌表情包风格，一个夸张无语表情的小人站在吐槽垃圾桶旁边，画面搞笑、轻松、适合社交分享");
        response.setAnimationPrompt("一个写着离谱行为的纸团被扔进吐槽垃圾桶，垃圾桶冒出夸张烟雾和弹幕，整体轻松搞笑");
        response.setSafetyLevel("safe");
        response.setConfidence(new BigDecimal("0.30"));
        response.setNeedUserConfirm(true);
        return response;
    }

    private List<String> normalizeTags(List<String> tags) {
        List<String> result = new ArrayList<>();
        if (tags != null) {
            for (String tag : tags) {
                if (StringUtils.hasText(tag) && result.size() < 6) {
                    result.add(truncate(tag.trim(), 12));
                }
            }
        }
        for (String tag : List.of("离谱操作", "让人无语", "情绪受伤")) {
            if (result.size() >= 3) break;
            result.add(tag);
        }
        return result;
    }

    private String cleanPraise(String praise) {
        String cleaned = praise.replace("你是全世界最棒的人", "你已经把这件事处理得很清楚了");
        return truncate(cleaned, 40);
    }

    private String desensitize(String text) {
        return text.replaceAll("1[3-9]\\d{9}", "某手机号")
                .replaceAll("[\\w.-]+@[\\w.-]+", "某邮箱")
                .replaceAll("[\\u4e00-\\u9fa5]{2,4}(公司|集团|科技|有限公司)", "某公司");
    }

    private BigDecimal normalizeConfidence(BigDecimal confidence) {
        if (confidence == null) return new BigDecimal("0.30");
        if (confidence.compareTo(BigDecimal.ZERO) < 0) return BigDecimal.ZERO;
        if (confidence.compareTo(BigDecimal.ONE) > 0) return BigDecimal.ONE;
        return confidence;
    }

    private String defaultIfBlank(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }

    private String truncate(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}

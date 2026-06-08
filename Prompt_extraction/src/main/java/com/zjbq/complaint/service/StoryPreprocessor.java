package com.zjbq.complaint.service;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class StoryPreprocessor {

    private static final int MAX_LENGTH = 3000;

    public String clean(String storyText) {
        if (!StringUtils.hasText(storyText)) {
            return "";
        }
        String cleaned = storyText.trim()
                .replaceAll("\\s+", " ")
                .replaceAll("([啊哈呵嗯呃额哦呀哎])\\1{5,}", "$1$1$1")
                .replaceAll("(.{1,6})\\1{6,}", "$1$1$1");
        if (cleaned.length() > MAX_LENGTH) {
            return cleaned.substring(0, 2600) + "\n……以上内容较长，已截断，请基于已给故事提炼核心槽点。";
        }
        return cleaned;
    }

    public int chineseLikeLength(String text) {
        if (text == null) {
            return 0;
        }
        return text.replaceAll("\\s", "").length();
    }
}

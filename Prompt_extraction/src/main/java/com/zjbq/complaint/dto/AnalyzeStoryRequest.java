package com.zjbq.complaint.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AnalyzeStoryRequest {

    private String userId;

    private String roomId;

    @NotBlank(message = "storyText 不能为空")
    private String storyText;

    private SourceType sourceType = SourceType.text;

    private GenerateMode generateMode = GenerateMode.both;

    public enum SourceType {
        text, speech
    }

    public enum GenerateMode {
        meme, vent, both
    }
}

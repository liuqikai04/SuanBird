package com.zjbq.complaint.vo;

import java.math.BigDecimal;
import java.util.List;
import lombok.Data;

@Data
public class AnalyzeStoryResponse {

    private String analysisId;

    private String summary;

    private String targetRole;

    private String scene;

    private String emotion;

    private Integer emotionLevel;

    private List<String> complaintTags;

    private String coreConflict;

    private String visualCharacter;

    private String ventTool;

    private String memeText;

    private String positivePraise;

    private String imagePrompt;

    private String animationPrompt;

    private String safetyLevel;

    private BigDecimal confidence;

    private Boolean needUserConfirm;
}

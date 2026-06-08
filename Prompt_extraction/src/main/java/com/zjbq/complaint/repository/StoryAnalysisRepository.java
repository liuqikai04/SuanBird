package com.zjbq.complaint.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zjbq.complaint.config.StorageProperties;
import com.zjbq.complaint.dto.AnalyzeStoryRequest;
import com.zjbq.complaint.vo.AnalyzeStoryResponse;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class StoryAnalysisRepository {

    private final StorageProperties storageProperties;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public void saveIfEnabled(AnalyzeStoryRequest request, String cleanedStory, AnalyzeStoryResponse response) {
        if (!storageProperties.enabled()) {
            return;
        }
        try {
            jdbcTemplate.update("""
                            INSERT INTO story_analysis (
                                analysis_id, user_id, room_id, original_story, summary, target_role, scene,
                                emotion, emotion_level, complaint_tags, core_conflict, visual_character,
                                vent_tool, meme_text, positive_praise, image_prompt, animation_prompt,
                                safety_level, confidence, created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """,
                    response.getAnalysisId(), request.getUserId(), request.getRoomId(), cleanedStory,
                    response.getSummary(), response.getTargetRole(), response.getScene(), response.getEmotion(),
                    response.getEmotionLevel(), objectMapper.writeValueAsString(response.getComplaintTags()),
                    response.getCoreConflict(), response.getVisualCharacter(), response.getVentTool(),
                    response.getMemeText(), response.getPositivePraise(), response.getImagePrompt(),
                    response.getAnimationPrompt(), response.getSafetyLevel(), response.getConfidence(),
                    Timestamp.valueOf(LocalDateTime.now()), Timestamp.valueOf(LocalDateTime.now()));
        } catch (Exception ignored) {
            // 存储是可选能力，失败不影响主接口返回。
        }
    }
}

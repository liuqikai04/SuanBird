package com.zjbq.complaint.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zjbq.complaint.dto.AnalyzeStoryRequest;
import com.zjbq.complaint.exception.BadRequestException;
import com.zjbq.complaint.llm.LlmClient;
import com.zjbq.complaint.prompt.ComplaintStoryPromptTemplate;
import com.zjbq.complaint.repository.StoryAnalysisRepository;
import com.zjbq.complaint.vo.AnalyzeStoryResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ComplaintStoryAnalyzerService {

    private static final String TOO_SHORT_MESSAGE = "内容太短，请再多讲一点，AI 才能更准确帮你出气。";

    private final StoryPreprocessor preprocessor;
    private final ComplaintStoryPromptTemplate promptTemplate;
    private final LlmClient llmClient;
    private final ObjectMapper objectMapper;
    private final AnalysisSanitizer sanitizer;
    private final StoryAnalysisRepository repository;

    public AnalyzeStoryResponse analyze(AnalyzeStoryRequest request) {
        String cleanedStory = preprocessor.clean(request.getStoryText());
        if (preprocessor.chineseLikeLength(cleanedStory) < 20) {
            throw new BadRequestException(TOO_SHORT_MESSAGE);
        }

        AnalyzeStoryResponse response;
        try {
            response = callAndParse(promptTemplate.build(cleanedStory));
        } catch (Exception firstFailure) {
            try {
                response = callAndParse(promptTemplate.build(cleanedStory + "\n请只返回合法 JSON，补齐缺失字段，不要输出解释。"));
            } catch (Exception retryFailure) {
                response = sanitizer.fallback();
            }
        }

        response = sanitizer.sanitize(response);
        response.setAnalysisId(UUID.randomUUID().toString().replace("-", ""));
        repository.saveIfEnabled(request, cleanedStory, response);
        return response;
    }

    private AnalyzeStoryResponse callAndParse(String prompt) throws Exception {
        String content = llmClient.completeJson(prompt);
        String json = extractJson(content);
        return objectMapper.readValue(json, AnalyzeStoryResponse.class);
    }

    private String extractJson(String content) {
        if (content == null) {
            return "";
        }
        String trimmed = content.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceAll("^```(?:json)?", "").replaceAll("```$", "").trim();
        }
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1);
        }
        return trimmed;
    }
}

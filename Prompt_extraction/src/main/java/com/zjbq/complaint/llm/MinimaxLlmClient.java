package com.zjbq.complaint.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zjbq.complaint.config.LlmProperties;
import com.zjbq.complaint.exception.LlmCallException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Slf4j
@Component
@RequiredArgsConstructor
public class MinimaxLlmClient implements LlmClient {

    private final LlmProperties properties;
    private final ObjectMapper objectMapper;

    @Override
    public String completeJson(String prompt) {
        if (properties.mockEnabled()) {
            log.info("LLM mock mode is enabled, returning mock response. endpoint={}, model={}", properties.endpoint(), properties.model());
            return mockResponse();
        }
        if (!StringUtils.hasText(properties.apiKey())) {
            log.warn("MINIMAX_API_KEY is empty, returning mock response. endpoint={}, model={}", properties.endpoint(), properties.model());
            return mockResponse();
        }

        log.info("Calling MINIMAXM2.7. endpoint={}, model={}", properties.endpoint(), properties.model());
        try {
            WebClient webClient = WebClient.builder()
                    .baseUrl(properties.endpoint())
                    .defaultHeader("x-api-key", properties.apiKey())
                    .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.apiKey())
                    .defaultHeader("anthropic-version", "2023-06-01")
                    .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .build();

            Map<String, Object> body = Map.of(
                    "model", properties.model(),
                    "max_tokens", 2048,
                    "messages", List.of(Map.of(
                            "role", "user",
                            "content", prompt
                    )),
                    "temperature", 0.45,
                    "stream", false
            );

            String raw = webClient.post()
                    .uri("/v1/messages")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(Duration.ofSeconds(properties.timeoutSeconds()));

            log.info("MINIMAXM2.7 raw response: {}", raw);
            return extractContent(raw);
        } catch (WebClientResponseException ex) {
            log.error("MINIMAXM2.7 HTTP error. status={}, body={}", ex.getStatusCode(), ex.getResponseBodyAsString(), ex);
            throw new LlmCallException("MINIMAXM2.7 调用失败: " + ex.getStatusCode() + " " + ex.getResponseBodyAsString(), ex);
        } catch (Exception ex) {
            log.error("MINIMAXM2.7 call failed. endpoint={}, model={}, message={}", properties.endpoint(), properties.model(), ex.getMessage(), ex);
            throw new LlmCallException("MINIMAXM2.7 调用失败", ex);
        }
    }

    private String extractContent(String raw) throws Exception {
        JsonNode root = objectMapper.readTree(raw);

        JsonNode content = root.path("content");
        if (content.isArray() && !content.isEmpty()) {
            StringBuilder textBuilder = new StringBuilder();
            for (JsonNode item : content) {
                JsonNode text = item.path("text");
                if (text.isTextual()) {
                    textBuilder.append(text.asText());
                }
            }
            if (!textBuilder.isEmpty()) {
                return textBuilder.toString();
            }
        }

        JsonNode choices = root.path("choices");
        if (choices.isArray() && !choices.isEmpty()) {
            JsonNode messageContent = choices.get(0).path("message").path("content");
            if (messageContent.isTextual()) {
                return messageContent.asText();
            }
            if (messageContent.isArray() && !messageContent.isEmpty()) {
                StringBuilder textBuilder = new StringBuilder();
                for (JsonNode item : messageContent) {
                    JsonNode text = item.path("text");
                    if (text.isTextual()) {
                        textBuilder.append(text.asText());
                    }
                }
                if (!textBuilder.isEmpty()) {
                    return textBuilder.toString();
                }
            }
            JsonNode text = choices.get(0).path("text");
            if (text.isTextual()) {
                return text.asText();
            }
        }
        JsonNode reply = root.path("reply");
        if (reply.isTextual()) {
            return reply.asText();
        }
        return raw;
    }

    private String mockResponse() {
        return """
                {
                  "summary": "同事甩锅让人心累",
                  "targetRole": "甩锅同事",
                  "scene": "职场",
                  "emotion": "无语、心累",
                  "emotionLevel": 4,
                  "complaintTags": ["甩锅", "沟通低效", "责任不清"],
                  "coreConflict": "对方把自己的问题转嫁给用户承担。",
                  "visualCharacter": "戴着假笑面具、怀里抱锅的丑萌同事小人",
                  "ventTool": "用弹簧拳套把黑锅弹回甩锅墙",
                  "memeText": "锅又飞我头上了",
                  "positivePraise": "你能冷静复盘问题，说明你很有边界感。",
                  "imagePrompt": "丑萌表情包风格，职场办公桌旁，一个无语小人看着黑锅飞来，旁边有假笑甩锅同事，夸张表情，轻松搞笑",
                  "animationPrompt": "黑锅从甩锅同事手中飞出，被弹簧拳套啪地弹回墙上，弹幕飘过离谱二字，节奏爽快搞笑",
                  "safetyLevel": "safe",
                  "confidence": 0.88
                }
                """;
    }
}

package com.zjbq.complaint.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "complaint.llm")
public record LlmProperties(
        boolean mockEnabled,
        String apiKey,
        String endpoint,
        String model,
        int timeoutSeconds
) {
}

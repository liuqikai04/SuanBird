package com.zjbq.complaint.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "complaint.storage")
public record StorageProperties(boolean enabled) {
}

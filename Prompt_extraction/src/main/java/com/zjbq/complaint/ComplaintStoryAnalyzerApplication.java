package com.zjbq.complaint;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class ComplaintStoryAnalyzerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ComplaintStoryAnalyzerApplication.class, args);
    }
}

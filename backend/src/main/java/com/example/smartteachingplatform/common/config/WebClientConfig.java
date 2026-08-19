package com.example.smartteachingplatform.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${agent.service.base-url}")
    private String agentBaseUrl;

    @Bean
    public WebClient agentWebClient() {
        return WebClient.builder()
                .baseUrl(agentBaseUrl)
                .build();
    }
}

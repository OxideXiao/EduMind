package com.example.smartteachingplatform.scheduler.task;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class HeartbeatTask {

    private final WebClient agentWebClient;

    /**
     * 每天 22:00 触发 Agent Heartbeat
     */
    @Scheduled(cron = "0 0 22 * * ?")
    public void runHeartbeat() {
        log.info("Heartbeat 定时任务触发");
        try {
            String result = agentWebClient
                    .post()
                    .uri("/api/agent/heartbeat")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(120))
                    .onErrorResume(e -> {
                        log.error("Heartbeat 调用失败: {}", e.getMessage());
                        return Mono.just("{\"error\": \"" + e.getMessage() + "\"}");
                    })
                    .block();
            log.info("Heartbeat 完成: {}", result);
        } catch (Exception e) {
            log.error("Heartbeat 异常: {}", e.getMessage());
        }
    }
}

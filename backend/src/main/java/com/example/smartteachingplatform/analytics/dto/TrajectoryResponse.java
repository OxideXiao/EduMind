package com.example.smartteachingplatform.analytics.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TrajectoryResponse {
    private List<QuizRecord> recentQuizzes;
    private List<LogRecord> recentLogs;

    @Data
    public static class QuizRecord {
        private String quizName;
        private BigDecimal score;
        private LocalDateTime submittedAt;
    }

    @Data
    public static class LogRecord {
        private String action;
        private String nodeName;
        private LocalDateTime createdAt;
    }
}

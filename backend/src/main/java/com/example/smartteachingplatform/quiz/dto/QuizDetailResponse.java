package com.example.smartteachingplatform.quiz.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class QuizDetailResponse {
    private Long quizId;
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer attemptLimit;
    private String status;
    private List<QuestionItem> questions;

    @Data
    public static class QuestionItem {
        private Long questionId;
        private String type;
        private String stem;
        private List<OptionItem> options;
        private BigDecimal score;
        private Integer sortOrder;
    }

    @Data
    public static class OptionItem {
        private String label;
        private String content;
    }
}

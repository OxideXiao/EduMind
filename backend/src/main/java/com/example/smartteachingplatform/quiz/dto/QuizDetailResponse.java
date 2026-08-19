package com.example.smartteachingplatform.quiz.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class QuizDetailResponse {

    private Long quizId;
    private String name;
    private String description;
    private BigDecimal totalScore;
    private LocalDateTime deadline;
    private List<QuestionItem> questions;

    @Data
    public static class QuestionItem {
        private Long questionId;
        private String type;
        private String content;
        private List<OptionItem> options;
        private BigDecimal score;
    }

    @Data
    public static class OptionItem {
        private String label;
        private String text;
        // 不返回 isCorrect
    }
}

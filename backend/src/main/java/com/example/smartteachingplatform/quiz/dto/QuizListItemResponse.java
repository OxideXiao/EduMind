package com.example.smartteachingplatform.quiz.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class QuizListItemResponse {
    private Long quizId;
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer attemptLimit;
    private String status;
    private Integer questionCount;
    private BigDecimal totalScore;
}

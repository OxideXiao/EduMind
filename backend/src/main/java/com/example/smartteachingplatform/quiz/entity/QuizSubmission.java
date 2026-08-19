package com.example.smartteachingplatform.quiz.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizSubmission {
    private Long id;
    private Long quizId;
    private Long studentId;
    private Integer attemptNo;
    private LocalDateTime submitTime;
    private BigDecimal totalScore;
    private BigDecimal correctRate;
    private String status;
}

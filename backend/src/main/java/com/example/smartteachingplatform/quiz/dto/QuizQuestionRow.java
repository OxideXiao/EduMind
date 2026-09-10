package com.example.smartteachingplatform.quiz.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class QuizQuestionRow {
    private Long questionId;
    private String questionType;
    private String stem;
    private BigDecimal score;
    private Integer sortOrder;
}

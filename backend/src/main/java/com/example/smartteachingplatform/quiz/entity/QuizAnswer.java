package com.example.smartteachingplatform.quiz.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizAnswer {
    private Long id;
    private Long submissionId;
    private Long questionId;
    private String studentAnswer;
    private Integer isCorrect;
    private BigDecimal score;
}

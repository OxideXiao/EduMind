package com.example.smartteachingplatform.quiz.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionOption {
    private Long id;
    private Long questionId;
    private String optionLabel;
    private String optionContent;
    private Integer isCorrect;
}

package com.example.smartteachingplatform.quiz.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class QuestionCreateRequest {

    private String questionCode;
    private List<Long> nodeIds;

    @NotBlank
    private String type;

    @NotBlank
    private String stem;

    private List<OptionItem> options;

    private String answer;

    private String analysis;

    private Integer difficulty;

    @Data
    public static class OptionItem {
        private String label;
        private String content;
        private Boolean isCorrect;
    }
}

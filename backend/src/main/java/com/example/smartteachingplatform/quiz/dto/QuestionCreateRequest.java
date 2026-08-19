package com.example.smartteachingplatform.quiz.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class QuestionCreateRequest {

    @NotNull
    private Long nodeId;

    @NotBlank
    private String type;

    @NotBlank
    private String content;

    private List<OptionItem> options;

    private String answer;

    private String analysis;

    private Integer difficulty;

    @Data
    public static class OptionItem {
        private String label;
        private String text;
        private Boolean isCorrect;
    }
}

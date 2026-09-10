package com.example.smartteachingplatform.quiz.dto;

import lombok.Data;

import java.util.List;

@Data
public class QuestionListResponse {
    private List<QuestionItem> items;
    private long total;
    private int page;
    private int pageSize;

    @Data
    public static class QuestionItem {
        private Long questionId;
        private String questionCode;
        private String type;
        private String stem;
        private List<OptionItem> options;
        private String answer;
        private String analysis;
        private Integer difficulty;
        private List<Long> nodeIds;
    }

    @Data
    public static class OptionItem {
        private String label;
        private String content;
        private Boolean isCorrect;
    }
}

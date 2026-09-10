package com.example.smartteachingplatform.quiz.dto;

import lombok.Data;

import java.util.List;

@Data
public class QuestionImportPreviewResponse {
    private String importToken;
    private int total;
    private int valid;
    private int warningCount;
    private int errorCount;
    private List<RowResult> rows;

    @Data
    public static class RowResult {
        private int row;
        private String status;      // VALID / WARNING / ERROR
        private List<String> messages;
    }
}

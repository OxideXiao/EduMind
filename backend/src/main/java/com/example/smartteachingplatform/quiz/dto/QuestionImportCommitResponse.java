package com.example.smartteachingplatform.quiz.dto;

import lombok.Data;

import java.util.List;

@Data
public class QuestionImportCommitResponse {
    private int created;
    private int updated;
    private List<FailedRow> failedRows;

    @Data
    public static class FailedRow {
        private int row;
        private String reason;
    }
}

package com.example.smartteachingplatform.course.dto;

import lombok.Data;

import java.util.List;

@Data
public class StudentImportCommitResponse {
    private int created;
    private int joined;
    private int skipped;
    private List<FailedRow> failedRows;
    private String credentialExportToken;

    @Data
    public static class FailedRow {
        private int row;
        private String studentNo;
        private String reason;
    }
}

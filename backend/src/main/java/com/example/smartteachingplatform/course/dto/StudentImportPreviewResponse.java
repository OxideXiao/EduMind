package com.example.smartteachingplatform.course.dto;

import lombok.Data;

import java.util.List;

@Data
public class StudentImportPreviewResponse {
    private String importToken;
    private int total;
    private int valid;
    private int warningCount;
    private int errorCount;
    private List<RowResult> rows;

    @Data
    public static class RowResult {
        private int row;
        private String studentNo;
        private String realName;
        private String status;
        private List<String> messages;
    }
}

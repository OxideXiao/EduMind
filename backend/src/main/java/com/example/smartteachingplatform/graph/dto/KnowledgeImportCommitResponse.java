package com.example.smartteachingplatform.graph.dto;

import lombok.Data;
import java.util.List;

@Data
public class KnowledgeImportCommitResponse {
    private int createdNodes;
    private int updatedNodes;
    private int createdEdges;
    private List<FailedRow> failedRows;

    @Data
    public static class FailedRow {
        private int row;
        private String message;
    }
}

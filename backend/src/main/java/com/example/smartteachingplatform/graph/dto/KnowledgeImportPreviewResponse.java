package com.example.smartteachingplatform.graph.dto;

import lombok.Data;
import java.util.List;

@Data
public class KnowledgeImportPreviewResponse {
    private String importToken;
    private int totalNodes;
    private int totalEdges;
    private int validNodes;
    private int validEdges;
    private List<Issue> warnings;
    private List<Issue> errors;

    @Data
    public static class Issue {
        private int row;
        private String field;
        private String message;
    }
}

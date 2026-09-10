package com.example.smartteachingplatform.graph.service.impl;

import lombok.Data;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class KnowledgeImportSessionStore {

    private static final long TTL_MINUTES = 30;
    private final Map<String, ImportSession> sessions = new ConcurrentHashMap<>();

    public void put(String token, ImportSession s) { sessions.put(token, s); }

    public ImportSession get(String token) {
        ImportSession s = sessions.get(token);
        if (s == null) return null;
        if (s.getCreatedAt().plusMinutes(TTL_MINUTES).isBefore(LocalDateTime.now())) {
            sessions.remove(token);
            return null;
        }
        return s;
    }

    public void remove(String token) { sessions.remove(token); }

    @Data
    public static class ImportSession {
        private String token;
        private Long courseId;
        private Long teacherId;
        private List<ImportedNode> nodes;
        private List<ImportedEdge> edges;
        private LocalDateTime createdAt;
    }

    @Data
    public static class ImportedNode {
        private int row;
        private String nodeCode;
        private String name;
        private String description;
        private String parentCode;
        private Integer orderNo;
    }

    @Data
    public static class ImportedEdge {
        private int row;
        private String fromCode;
        private String toCode;
        private String relationType;
    }
}

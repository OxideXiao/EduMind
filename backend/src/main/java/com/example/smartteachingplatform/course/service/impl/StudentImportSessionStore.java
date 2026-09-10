package com.example.smartteachingplatform.course.service.impl;

import lombok.Data;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 学生导入会话内存缓存。importToken 关联预览解析结果，供确认导入（commit）阶段取回。
 */
@Component
public class StudentImportSessionStore {

    private static final long TTL_MINUTES = 30;

    private final Map<String, ImportSession> sessions = new ConcurrentHashMap<>();

    public void put(String token, ImportSession session) {
        sessions.put(token, session);
    }

    public void remove(String token) {
        sessions.remove(token);
    }

    /** 惰性过期：超时返回 null 并删除。 */
    public ImportSession get(String token) {
        ImportSession s = sessions.get(token);
        if (s == null) {
            return null;
        }
        if (s.getCreatedAt().plusMinutes(TTL_MINUTES).isBefore(LocalDateTime.now())) {
            sessions.remove(token);
            return null;
        }
        return s;
    }

    @Data
    public static class ImportSession {
        private String token;
        private Long courseId;
        private Long teacherId;
        private String passwordMode;
        private String defaultPassword;
        private List<ImportedRow> rows;
        private LocalDateTime createdAt;
    }

    @Data
    public static class ImportedRow {
        private int row;
        private String studentNo;
        private String realName;
        private String email;
        private String phone;
        private String className;
    }
}

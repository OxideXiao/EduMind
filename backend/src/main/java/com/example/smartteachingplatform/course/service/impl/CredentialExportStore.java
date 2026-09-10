package com.example.smartteachingplatform.course.service.impl;

import lombok.Data;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 账号凭证内存缓存。credentialExportToken 关联导入生成的学生账号与初始密码（明文），一次性下载。
 */
@Component
public class CredentialExportStore {

    private static final long TTL_MINUTES = 30;

    private final Map<String, CredentialExport> exports = new ConcurrentHashMap<>();

    public void put(String token, CredentialExport data) {
        exports.put(token, data);
    }

    /** 惰性过期：超时返回 null 并删除。 */
    public CredentialExport get(String token) {
        CredentialExport e = exports.get(token);
        if (e == null) {
            return null;
        }
        if (e.getCreatedAt().plusMinutes(TTL_MINUTES).isBefore(LocalDateTime.now())) {
            exports.remove(token);
            return null;
        }
        return e;
    }

    /** 一次性：下载成功后删除。 */
    public void remove(String token) {
        exports.remove(token);
    }

    @Data
    public static class CredentialExport {
        private String token;
        private Long teacherId;
        private List<CredentialRow> rows;
        private LocalDateTime createdAt;
    }

    @Data
    public static class CredentialRow {
        private String studentNo;
        private String realName;
        private String username;
        private String initialPassword;
    }
}

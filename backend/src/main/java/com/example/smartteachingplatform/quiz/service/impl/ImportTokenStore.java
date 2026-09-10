package com.example.smartteachingplatform.quiz.service.impl;

import com.example.smartteachingplatform.quiz.dto.QuestionCreateRequest;
import lombok.Data;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** 导入预览会话（内存存储，短期有效，用完即删） */
@Component
public class ImportTokenStore {

    private final Map<String, Session> store = new ConcurrentHashMap<>();

    public void put(String token, Session session) {
        store.put(token, session);
    }

    /** commit 时原子取出并删除，防重复提交 */
    public Session remove(String token) {
        return store.remove(token);
    }

    @Data
    public static class Session {
        private Long courseId;
        private Long targetNodeId;   // 节点下导入时的目标节点，可为 null
        private List<ParsedRow> rows;
    }

    @Data
    public static class ParsedRow {
        private int rowNumber;
        private String status;          // VALID / WARNING / ERROR
        private List<String> messages;
        private QuestionCreateRequest request;
    }
}

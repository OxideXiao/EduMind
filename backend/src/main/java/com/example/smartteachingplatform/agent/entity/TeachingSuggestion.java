package com.example.smartteachingplatform.agent.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TeachingSuggestion {
    private Long id;
    private Long courseId;
    private Long teacherId;
    private String problem;
    private String suggestions;    // JSON 字符串（jsonb），Service 层用 Jackson 转 List<String>
    private String priority;
    private String weakNodeIds;    // JSON 字符串（jsonb），Service 层转 List<Long>
    private LocalDateTime createdAt;
}

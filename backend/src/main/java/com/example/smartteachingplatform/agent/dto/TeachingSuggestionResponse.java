package com.example.smartteachingplatform.agent.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class TeachingSuggestionResponse {

    private Long id;
    private String problem;
    private List<String> suggestions;
    private String priority;
    private List<Long> weakNodeIds;
    private LocalDateTime generatedAt;
}

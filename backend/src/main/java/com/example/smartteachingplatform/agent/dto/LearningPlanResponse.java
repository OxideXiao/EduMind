package com.example.smartteachingplatform.agent.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class LearningPlanResponse {

    private Long planId;
    private String summary;

    @JsonProperty("short_term")
    private Map<String, Object> shortTerm;

    @JsonProperty("mid_term")
    private Map<String, Object> midTerm;

    private String motivation;

    private LocalDateTime generatedAt;
}

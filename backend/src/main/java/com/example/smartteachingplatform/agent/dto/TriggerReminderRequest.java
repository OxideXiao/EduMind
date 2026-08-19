package com.example.smartteachingplatform.agent.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class TriggerReminderRequest {

    @NotNull
    private Long studentId;

    @NotNull
    private String reason;

    private Map<String, Object> context;
}

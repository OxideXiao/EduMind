package com.example.smartteachingplatform.agent.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class HeartbeatStatusResponse {

    private LocalDateTime lastRunAt;
    private String status;
    private Integer totalStudents;
    private Integer remindedCount;
}

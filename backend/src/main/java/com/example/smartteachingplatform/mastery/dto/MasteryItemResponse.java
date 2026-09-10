package com.example.smartteachingplatform.mastery.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class MasteryItemResponse {
    private Long nodeId;
    private String nodeName;
    private BigDecimal masteryScore;
    private String masteryLevel;
    private LocalDateTime lastLearnedAt;
}

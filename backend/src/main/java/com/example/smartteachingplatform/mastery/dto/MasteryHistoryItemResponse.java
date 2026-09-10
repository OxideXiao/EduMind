package com.example.smartteachingplatform.mastery.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class MasteryHistoryItemResponse {
    private Long masteryId;
    private Long nodeId;
    private BigDecimal oldScore;
    private BigDecimal newScore;
    private String changeReason;
    private LocalDateTime createdAt;
}

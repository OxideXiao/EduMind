package com.example.smartteachingplatform.mastery.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AdjustResponse {
    private Long masteryId;
    private Long nodeId;
    private BigDecimal newScore;
    private LocalDateTime updatedAt;
}

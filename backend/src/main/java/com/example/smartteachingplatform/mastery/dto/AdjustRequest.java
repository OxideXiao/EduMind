package com.example.smartteachingplatform.mastery.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AdjustRequest {
    @NotNull
    private Long studentId;

    @NotNull
    private Long nodeId;

    @NotNull
    private BigDecimal newScore;

    private String reason;
}

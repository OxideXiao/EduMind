package com.example.smartteachingplatform.assignment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class GradeRequest {
    @NotNull(message = "分数不能为空")
    private BigDecimal score;
    private String feedback;
}

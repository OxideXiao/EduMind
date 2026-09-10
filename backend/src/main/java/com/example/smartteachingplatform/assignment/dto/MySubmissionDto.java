package com.example.smartteachingplatform.assignment.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class MySubmissionDto {
    private Long submissionId;
    private String status;
    private BigDecimal score;
    private String feedback;
    private LocalDateTime submittedAt;
}

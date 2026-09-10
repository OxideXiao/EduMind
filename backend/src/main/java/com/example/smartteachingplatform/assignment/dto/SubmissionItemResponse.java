package com.example.smartteachingplatform.assignment.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class SubmissionItemResponse {
    private Long submissionId;
    private Long studentId;
    private String studentName;
    private String content;
    private String status;
    private BigDecimal score;
    private String feedback;
    private LocalDateTime submittedAt;
    private LocalDateTime gradedAt;
    private List<SubmissionFileDto> files;
}

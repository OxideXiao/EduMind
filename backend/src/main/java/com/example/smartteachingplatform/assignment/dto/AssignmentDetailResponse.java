package com.example.smartteachingplatform.assignment.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AssignmentDetailResponse {
    private Long courseId;
    private String courseName;
    private Long assignmentId;
    private String title;
    private String description;
    private String submissionType;
    private List<Long> nodeIds;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal totalScore;
    private String status;
    private MySubmissionDto mySubmission;
}

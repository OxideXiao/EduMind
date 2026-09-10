package com.example.smartteachingplatform.assignment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AssignmentRequest {
    @NotBlank(message = "标题不能为空")
    private String title;
    private String description;
    @NotBlank(message = "提交类型不能为空")
    private String submissionType;   // TEXT / FILE / TEXT_AND_FILE
    private List<Long> nodeIds;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal totalScore;
}

package com.example.smartteachingplatform.assignment.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Assignment {
    private Long id;
    private Long courseId;
    private String title;
    private String description;
    private String submissionType;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal totalScore;
    private String status;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** 提交人数，列表查询 JOIN 聚合 */
    private Long submissionCount;

    /** 课程名，列表查询 JOIN courses */
    private String courseName;
}

package com.example.smartteachingplatform.assignment.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentSubmission {
    private Long id;
    private Long assignmentId;
    private Long studentId;
    private String content;
    private String status;
    private BigDecimal score;
    private String feedback;
    private LocalDateTime submittedAt;
    private LocalDateTime gradedAt;

    /** 学生姓名，列表查询 JOIN users */
    private String studentName;
}

package com.example.smartteachingplatform.learningplan.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearningPlan {
    private Long id;
    private Long courseId;
    private Long studentId;
    private String title;
    private String planContent;
    private String generatedBy;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

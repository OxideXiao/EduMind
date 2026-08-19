package com.example.smartteachingplatform.quiz.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    private Long id;
    private Long courseId;
    private Long knowledgeNodeId;
    private String questionType;
    private String stem;
    private String answer;
    private String analysis;
    private Integer difficulty;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

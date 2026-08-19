package com.example.smartteachingplatform.quiz.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeMastery {
    private Long id;
    private Long courseId;
    private Long studentId;
    private Long knowledgeNodeId;
    private BigDecimal masteryScore;
    private String masteryLevel;
    private LocalDateTime lastLearnedAt;
    private BigDecimal lastQuizScore;
    private Integer riskFlag;
    private LocalDateTime updatedAt;
}

package com.example.smartteachingplatform.graph.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeEdge {
    private Long id;
    private Long courseId;
    private Long sourceNodeId;
    private Long targetNodeId;
    private String relationType;
    private BigDecimal weight;
    private LocalDateTime createdAt;
}

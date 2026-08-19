package com.example.smartteachingplatform.graph.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeNode {
    private Long id;
    private Long courseId;
    private Long parentId;
    private String nodeName;
    private String nodeDesc;
    private Integer difficulty;
    private Integer sortOrder;
    private BigDecimal xPosition;
    private BigDecimal yPosition;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** 掌握度分数，查询时 JOIN 计算 */
    private Double masteryScore;
}

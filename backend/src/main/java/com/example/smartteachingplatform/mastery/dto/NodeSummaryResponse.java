package com.example.smartteachingplatform.mastery.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class NodeSummaryResponse {
    private Long nodeId;
    private String nodeName;
    private Integer studentCount;
    private BigDecimal averageScore;
    private Map<String, Integer> distribution;
    private List<AtRiskStudent> atRiskStudents;

    @Data
    public static class AtRiskStudent {
        private Long studentId;
        private String studentNo;
        private String realName;
        private BigDecimal score;
    }
}

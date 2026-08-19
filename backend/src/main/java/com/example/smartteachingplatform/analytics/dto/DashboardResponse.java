package com.example.smartteachingplatform.analytics.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class DashboardResponse {
    private BigDecimal completionRate;
    private BigDecimal activeRate;
    private int riskStudentCount;
    private List<WeakNode> weakKnowledgePoints;
    private List<RiskStudent> riskStudents;
    private List<ActiveTrend> activeTrend;

    @Data
    public static class WeakNode {
        private Long nodeId;
        private String name;
        private BigDecimal avgScore;
    }

    @Data
    public static class RiskStudent {
        private Long userId;
        private String name;
        private String reason;
        private BigDecimal avgMastery;
    }

    @Data
    public static class ActiveTrend {
        private String date;
        private int activeCount;
    }
}

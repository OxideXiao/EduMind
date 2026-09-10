package com.example.smartteachingplatform.assignment.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class GradeResponse {
    private Long submissionId;
    private String status;
    private BigDecimal score;
    private List<MasteryUpdate> masteryUpdates;

    @Data
    public static class MasteryUpdate {
        private Long nodeId;
        private String nodeName;
        private BigDecimal oldScore;
        private BigDecimal newScore;
        private BigDecimal delta;
    }
}

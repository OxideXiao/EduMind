package com.example.smartteachingplatform.quiz.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class SubmitResultResponse {

    private Long submissionId;
    private BigDecimal score;
    private BigDecimal totalScore;
    private List<MasteryUpdate> masteryUpdates;
    private Boolean triggerReminder;

    @Data
    public static class MasteryUpdate {
        private Long nodeId;
        private String nodeName;
        private BigDecimal oldScore;
        private BigDecimal newScore;
        private BigDecimal delta;
    }
}

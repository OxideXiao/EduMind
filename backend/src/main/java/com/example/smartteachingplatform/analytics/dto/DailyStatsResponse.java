package com.example.smartteachingplatform.analytics.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class DailyStatsResponse {
    private Long courseId;
    private String date;
    private List<StudentStats> students;

    @Data
    public static class StudentStats {
        @JsonProperty("student_id")
        private Long studentId;
        @JsonProperty("student_name")
        private String studentName;
        @JsonProperty("completion_rate")
        private BigDecimal completionRate;
        @JsonProperty("active_days_this_week")
        private int activeDaysThisWeek;
        @JsonProperty("quiz_avg_score")
        private BigDecimal quizAvgScore;
        @JsonProperty("at_risk")
        private boolean atRisk;
        @JsonProperty("knowledge_mastery")
        private Map<String, BigDecimal> knowledgeMastery;
    }
}

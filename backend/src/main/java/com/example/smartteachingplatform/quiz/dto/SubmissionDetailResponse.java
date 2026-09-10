package com.example.smartteachingplatform.quiz.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubmissionDetailResponse {

    private Long submissionId;
    private BigDecimal score;
    private BigDecimal totalScore;
    private LocalDateTime submittedAt;
    private List<AnswerItem> answers;

    @Data
    public static class AnswerItem {
        private Long questionId;
        private String type;
        private String stem;
        private List<OptionItem> options;
        private String studentAnswer;

        // 仅教师填充
        private String correctAnswer;
        private Boolean isCorrect;
        private BigDecimal score;
        private String analysis;
    }

    @Data
    public static class OptionItem {
        private String label;
        private String content;
        private Boolean isCorrect; // 仅教师填充
    }
}

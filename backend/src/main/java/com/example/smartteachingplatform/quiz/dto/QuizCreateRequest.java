package com.example.smartteachingplatform.quiz.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class QuizCreateRequest {

    // ── 新字段 ──
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer attemptLimit;

    @Valid
    private List<QuestionItem> questions;

    // ── 旧字段）──
    private String name;
    private List<Long> questionIds;
    private LocalDateTime deadline;

    @Data
    public static class QuestionItem {
        @NotNull
        private Long questionId;

        @NotNull
        private BigDecimal score;

        private Integer sortOrder;
    }
}

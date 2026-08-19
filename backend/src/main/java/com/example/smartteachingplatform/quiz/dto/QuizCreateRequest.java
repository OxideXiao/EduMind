package com.example.smartteachingplatform.quiz.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class QuizCreateRequest {

    @NotBlank
    private String name;

    private String description;

    @NotEmpty
    private List<Long> questionIds;

    private LocalDateTime deadline;
}

package com.example.smartteachingplatform.quiz.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class SubmitRequest {

    @NotNull
    private Map<String, String> answers;  // questionId → answer
}

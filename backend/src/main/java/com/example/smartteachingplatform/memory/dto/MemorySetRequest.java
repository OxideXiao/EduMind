package com.example.smartteachingplatform.memory.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MemorySetRequest {

    @NotBlank
    @JsonProperty("memory_json")
    private String memoryJson;
}

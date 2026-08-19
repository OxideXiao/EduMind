package com.example.smartteachingplatform.memory.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemoryGetResponse {

    @JsonProperty("memory_json")
    private String memoryJson;
}

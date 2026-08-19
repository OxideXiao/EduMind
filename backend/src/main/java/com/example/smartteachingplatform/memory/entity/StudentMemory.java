package com.example.smartteachingplatform.memory.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentMemory {

    private Long id;
    private Long studentId;
    private Long courseId;
    private String memoryJson;
    private LocalDateTime updatedAt;
}

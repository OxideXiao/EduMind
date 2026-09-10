package com.example.smartteachingplatform.assignment.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionFile {
    private Long id;
    private Long submissionId;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private LocalDateTime createdAt;
}

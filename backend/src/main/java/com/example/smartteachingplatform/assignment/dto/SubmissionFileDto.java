package com.example.smartteachingplatform.assignment.dto;

import lombok.Data;

@Data
public class SubmissionFileDto {
    private Long fileId;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
}

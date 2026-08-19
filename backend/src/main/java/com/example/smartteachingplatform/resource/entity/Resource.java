package com.example.smartteachingplatform.resource.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Resource {
    private Long id;
    private Long courseId;
    private Long uploaderId;
    private String resourceName;
    private String resourceType;
    private String fileUrl;
    private Long fileSize;
    private Integer duration;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

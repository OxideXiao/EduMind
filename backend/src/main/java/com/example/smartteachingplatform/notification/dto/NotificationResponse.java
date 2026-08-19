package com.example.smartteachingplatform.notification.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationResponse {
    private Long notificationId;
    private String type;
    private String title;
    private String content;
    private Long courseId;
    private String priority;
    private Boolean isRead;
    private LocalDateTime createdAt;
}

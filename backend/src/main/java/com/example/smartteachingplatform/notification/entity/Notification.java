package com.example.smartteachingplatform.notification.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    private Long id;
    private Long receiverId;
    private Long courseId;
    private String notificationType;
    private String title;
    private String content;
    private Integer isRead;
    private LocalDateTime createdAt;
}

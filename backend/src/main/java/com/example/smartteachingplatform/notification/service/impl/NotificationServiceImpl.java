package com.example.smartteachingplatform.notification.service.impl;

import com.example.smartteachingplatform.notification.dto.NotificationResponse;
import com.example.smartteachingplatform.notification.entity.Notification;
import com.example.smartteachingplatform.notification.mapper.NotificationMapper;
import com.example.smartteachingplatform.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationMapper notificationMapper;

    @Override
    public Map<String, Object> list(Long userId, Boolean isRead, int page, int size) {
        int offset = (page - 1) * size;
        List<Notification> notifications;
        if (isRead != null) {
            notifications = notificationMapper.findByReceiver(userId, isRead ? 1 : 0, offset, size);
        } else {
            notifications = notificationMapper.findByReceiverAll(userId, offset, size);
        }
        int unreadCount = notificationMapper.countUnread(userId);

        List<NotificationResponse> items = new ArrayList<>();
        for (Notification n : notifications) {
            items.add(toResponse(n));
        }

        return Map.of(
                "unreadCount", unreadCount,
                "items", items
        );
    }

    @Override
    public void markRead(Long notificationId, Long userId) {
        int rows = notificationMapper.markRead(notificationId, userId);
        if (rows == 0) throw new RuntimeException("通知不存在或无权操作");
    }

    @Override
    public int markAllRead(Long userId) {
        return notificationMapper.markAllRead(userId);
    }

    @Override
    @Transactional
    public Long createInternal(Long userId, Long courseId, String type, String title, String content) {
        Notification n = new Notification();
        n.setReceiverId(userId);
        n.setCourseId(courseId);
        n.setNotificationType(mapType(type));
        n.setTitle(title);
        n.setContent(content);
        n.setIsRead(0);
        notificationMapper.insert(n);
        return n.getId();
    }

    /** Agent/API 类型 → DB notification_type */
    private String mapType(String type) {
        if (type == null) return "warning";
        return switch (type.toUpperCase()) {
            case "REMINDER" -> "reminder";
            case "PLAN" -> "report";
            case "SYSTEM" -> "warning";
            case "ADVICE" -> "suggestion";
            default -> type.toLowerCase();
        };
    }

    /** DB 类型 → API 类型 */
    private String mapTypeToApi(String dbType) {
        if (dbType == null) return "SYSTEM";
        return switch (dbType) {
            case "reminder" -> "REMINDER";
            case "warning" -> "SYSTEM";
            case "report" -> "PLAN";
            case "suggestion" -> "ADVICE";
            default -> dbType.toUpperCase();
        };
    }

    private NotificationResponse toResponse(Notification n) {
        NotificationResponse r = new NotificationResponse();
        r.setNotificationId(n.getId());
        r.setType(mapTypeToApi(n.getNotificationType()));
        r.setTitle(n.getTitle());
        r.setContent(n.getContent());
        r.setCourseId(n.getCourseId());
        r.setPriority("NORMAL");
        r.setIsRead(n.getIsRead() != null && n.getIsRead() == 1);
        r.setCreatedAt(n.getCreatedAt());
        return r;
    }
}

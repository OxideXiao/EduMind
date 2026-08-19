package com.example.smartteachingplatform.notification.service;

import com.example.smartteachingplatform.notification.dto.NotificationResponse;

import java.util.List;
import java.util.Map;

public interface NotificationService {

    /** 查询通知列表，返回 items + unreadCount */
    Map<String, Object> list(Long userId, Boolean isRead, int page, int size);

    /** 单条已读 */
    void markRead(Long notificationId, Long userId);

    /** 全部已读 */
    int markAllRead(Long userId);

    /** 内部创建通知（Agent 调用），返回 notificationId */
    Long createInternal(Long userId, Long courseId, String type, String title, String content);
}

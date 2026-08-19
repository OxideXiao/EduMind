package com.example.smartteachingplatform.notification.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** 通知列表 — 已登录 */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public Result<Map<String, Object>> list(@RequestParam(required = false) Boolean isRead,
                                             @RequestParam(defaultValue = "1") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        Long userId = getCurrentUserId();
        return Result.success(notificationService.list(userId, isRead, page, size));
    }

    /** 单条已读 — 已登录 */
    @PatchMapping("/{notificationId}/read")
    @PreAuthorize("isAuthenticated()")
    public Result<Void> markRead(@PathVariable Long notificationId) {
        try {
            notificationService.markRead(notificationId, getCurrentUserId());
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /** 全部已读 — 已登录 */
    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public Result<Map<String, Object>> markAllRead() {
        int count = notificationService.markAllRead(getCurrentUserId());
        return Result.success(Map.of("updatedCount", count));
    }

    /** 内部创建通知 — X-Internal-Token */
    @PostMapping
    public Result<Map<String, Object>> createInternal(@RequestBody Map<String, Object> body) {
        Long userId = toLong(body.get("user_id"));
        Long courseId = toLong(body.get("course_id"));
        String type = (String) body.getOrDefault("type", "SYSTEM");
        String title = (String) body.getOrDefault("title", "");
        String content = (String) body.getOrDefault("content", "");

        Long id = notificationService.createInternal(userId, courseId, type, title, content);
        log.info("内部通知创建: id={}, userId={}, type={}", id, userId, type);
        return Result.success(Map.of("notification_id", id));
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Long) return (Long) principal;
        return Long.valueOf(principal.toString());
    }

    private Long toLong(Object obj) {
        if (obj instanceof Long) return (Long) obj;
        if (obj instanceof Integer) return ((Integer) obj).longValue();
        if (obj instanceof String) return Long.valueOf((String) obj);
        return null;
    }
}

package com.example.smartteachingplatform.learningplan.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.learningplan.service.LearningPlanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class LearningPlanController {

    private final LearningPlanService learningPlanService;

    /** 最新学习计划 — STUDENT（本人） */
    @GetMapping("/api/courses/{courseId}/learning-plans/latest")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<Map<String, Object>> getLatest(@PathVariable Long courseId) {
        Long userId = getCurrentUserId();
        return Result.success(learningPlanService.getLatest(courseId, userId));
    }

    /** 内部创建学习计划 — X-Internal-Token */
    @PostMapping("/api/learning-plans")
    public Result<Map<String, Object>> createInternal(@RequestBody Map<String, Object> body) {
        Long courseId = toLong(body.get("course_id"));
        Long studentId = toLong(body.get("student_id"));
        String title = (String) body.getOrDefault("title", "学习计划");
        String planContent = (String) body.getOrDefault("plan_content", "{}");

        Long planId = learningPlanService.createInternal(courseId, studentId, title, planContent, "agent");
        log.info("内部创建学习计划: planId={}, studentId={}", planId, studentId);
        return Result.success(Map.of("plan_id", planId));
    }

    private Long getCurrentUserId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private Long toLong(Object obj) {
        if (obj instanceof Long) return (Long) obj;
        if (obj instanceof Integer) return ((Integer) obj).longValue();
        if (obj instanceof String) return Long.valueOf((String) obj);
        return null;
    }
}

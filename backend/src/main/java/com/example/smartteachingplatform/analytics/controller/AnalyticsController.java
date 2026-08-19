package com.example.smartteachingplatform.analytics.controller;

import com.example.smartteachingplatform.analytics.dto.*;
import com.example.smartteachingplatform.analytics.service.AnalyticsService;
import com.example.smartteachingplatform.common.response.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /** 仪表盘 — TEACHER */
    @GetMapping("/api/courses/{courseId}/dashboard")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<DashboardResponse> dashboard(@PathVariable Long courseId) {
        return Result.success(analyticsService.getDashboard(courseId));
    }

    /** 学习轨迹 — TEACHER / 本人 STUDENT */
    @GetMapping("/api/courses/{courseId}/students/{studentId}/trajectory")
    @PreAuthorize("hasAnyRole('TEACHER','STUDENT')")
    public Result<TrajectoryResponse> trajectory(@PathVariable Long courseId,
                                                  @PathVariable Long studentId) {
        return Result.success(analyticsService.getTrajectory(courseId, studentId));
    }

    /** 每日学情 — X-Internal-Token（Agent 内部） */
    @GetMapping("/api/analytics/daily")
    public Result<DailyStatsResponse> daily(@RequestParam(name = "course_id", required = false) Long courseId,
                                             @RequestParam(required = false) String date) {
        return Result.success(analyticsService.getDailyStats(courseId, date));
    }
}

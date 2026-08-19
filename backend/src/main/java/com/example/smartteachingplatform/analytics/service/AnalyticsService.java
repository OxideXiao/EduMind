package com.example.smartteachingplatform.analytics.service;

import com.example.smartteachingplatform.analytics.dto.*;

public interface AnalyticsService {

    DashboardResponse getDashboard(Long courseId);

    TrajectoryResponse getTrajectory(Long courseId, Long studentId);

    DailyStatsResponse getDailyStats(Long courseId, String date);
}

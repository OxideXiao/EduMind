package com.example.smartteachingplatform.agent.service;

import com.example.smartteachingplatform.agent.dto.*;

import java.util.List;
import java.util.Map;

public interface AgentService {

    /**
     * 生成学习计划：组装 mastery + memory → 调 Agent → 返回
     */
    LearningPlanResponse generateLearningPlan(Long userId, Long courseId);

    /**
     * 生成教学建议：取薄弱点 → 调 Agent → 落库 → 返回
     */
    TeachingSuggestionResponse getTeachingSuggestion(Long courseId, List<Long> weakNodeIds, Long teacherId);

    /**
     * 查询课程最新一条教学建议
     */
    TeachingSuggestionResponse getLatestSuggestion(Long courseId, Long teacherId);

    /**
     * 分页查询课程教学建议
     */
    Map<String, Object> listSuggestions(Long courseId, Long teacherId, int page, int pageSize);

    /**
     * 触发提醒：组装学情 → 调 Agent → 写通知
     */
    void triggerReminder(Long courseId, TriggerReminderRequest request);

    /**
     * 查询 Heartbeat 最新状态
     */
    HeartbeatStatusResponse getHeartbeatStatus();
}

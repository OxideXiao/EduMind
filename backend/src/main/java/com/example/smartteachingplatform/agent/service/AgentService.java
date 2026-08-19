package com.example.smartteachingplatform.agent.service;

import com.example.smartteachingplatform.agent.dto.*;

public interface AgentService {

    /**
     * 生成学习计划：组装 mastery + memory → 调 Agent → 返回
     */
    LearningPlanResponse generateLearningPlan(Long userId, Long courseId);

    /**
     * 生成教学建议：取薄弱点 → 调 Agent → 返回
     */
    TeachingSuggestionResponse getTeachingSuggestion(Long courseId,
                                                      java.util.List<Long> weakNodeIds);

    /**
     * 触发提醒：组装学情 → 调 Agent → 写通知
     */
    void triggerReminder(Long courseId, TriggerReminderRequest request);

    /**
     * 查询 Heartbeat 最新状态
     */
    HeartbeatStatusResponse getHeartbeatStatus();
}

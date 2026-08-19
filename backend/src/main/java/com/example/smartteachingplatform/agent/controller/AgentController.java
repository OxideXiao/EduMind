package com.example.smartteachingplatform.agent.controller;

import com.example.smartteachingplatform.agent.dto.*;
import com.example.smartteachingplatform.agent.service.AgentService;
import com.example.smartteachingplatform.common.response.Result;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;


    @PostMapping("/api/courses/{courseId}/agent/learning-plan")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<LearningPlanResponse> generateLearningPlan(@PathVariable Long courseId) {
        try {
            Long userId = getCurrentUserId();
            return Result.success(agentService.generateLearningPlan(userId, courseId));
        } catch (Exception e) {
            log.error("学习计划生成失败: courseId={}, {}", courseId, e.getMessage());
            return Result.error("计划生成失败，请稍后重试");
        }
    }

    @PostMapping("/api/courses/{courseId}/agent/teaching-suggestion")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<TeachingSuggestionResponse> getTeachingSuggestion(
            @PathVariable Long courseId,
            @RequestBody(required = false) TeachingSuggestionBody body) {
        try {
            List<Long> weakNodeIds = body != null ? body.getWeakNodeIds() : List.of();
            return Result.success(agentService.getTeachingSuggestion(courseId, weakNodeIds));
        } catch (Exception e) {
            log.error("教学建议生成失败: courseId={}, {}", courseId, e.getMessage());
            return Result.error("建议生成失败，请稍后重试");
        }
    }

    @PostMapping("/api/courses/{courseId}/agent/trigger-reminder")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Void> triggerReminder(@PathVariable Long courseId,
                                         @Valid @RequestBody TriggerReminderRequest request) {
        try {
            agentService.triggerReminder(courseId, request);
            return Result.success();
        } catch (Exception e) {
            log.error("提醒触发失败: courseId={}, {}", courseId, e.getMessage());
            return Result.error("提醒发送失败，请稍后重试");
        }
    }


    @GetMapping("/api/agent/heartbeat/status")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public Result<HeartbeatStatusResponse> getHeartbeatStatus() {
        return Result.success(agentService.getHeartbeatStatus());
    }


    private Long getCurrentUserId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @lombok.Data
    private static class TeachingSuggestionBody {
        private List<Long> weakNodeIds;
    }
}

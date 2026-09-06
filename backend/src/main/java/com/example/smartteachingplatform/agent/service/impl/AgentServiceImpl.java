package com.example.smartteachingplatform.agent.service.impl;

import com.example.smartteachingplatform.agent.dto.*;
import com.example.smartteachingplatform.agent.entity.TeachingSuggestion;
import com.example.smartteachingplatform.agent.mapper.TeachingSuggestionMapper;
import com.example.smartteachingplatform.agent.service.AgentService;
import com.example.smartteachingplatform.analytics.dto.DashboardResponse;
import com.example.smartteachingplatform.analytics.mapper.AnalyticsMapper;
import com.example.smartteachingplatform.analytics.service.AnalyticsService;
import com.example.smartteachingplatform.auth.entity.User;
import com.example.smartteachingplatform.auth.mapper.UserMapper;
import com.example.smartteachingplatform.common.exception.BusinessException;
import com.example.smartteachingplatform.course.entity.Course;
import com.example.smartteachingplatform.course.mapper.CourseMapper;
import com.example.smartteachingplatform.memory.service.MemoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgentServiceImpl implements AgentService {

    private final WebClient agentWebClient;
    private final MemoryService memoryService;
    private final UserMapper userMapper;
    private final CourseMapper courseMapper;
    private final AnalyticsService analyticsService;
    private final AnalyticsMapper analyticsMapper;
    private final TeachingSuggestionMapper teachingSuggestionMapper;
    private final ObjectMapper objectMapper;

    private static final Duration AGENT_TIMEOUT = Duration.ofSeconds(30);

    // ────────────── 学习计划 ──────────────

    @Override
    public LearningPlanResponse generateLearningPlan(Long userId, Long courseId) {
        User user = userMapper.findById(userId);
        String studentName = user != null ? user.getRealName() : "未知";
        String memoryJson = memoryService.get(userId, courseId);
        Course course = courseMapper.findById(courseId);
        String courseName = course != null ? course.getCourseName() : "";

        // 查询该学生各知识点的掌握度 (0-100 → 0-1)
        Map<String, Double> knowledgeMastery = new LinkedHashMap<>();
        List<Map<String, Object>> masteryRows = analyticsMapper.studentMasteryMap(courseId, userId);
        for (Map<String, Object> row : masteryRows) {
            String nodeName = (String) row.get("node_name");
            Object scoreObj = row.get("mastery_score");
            double score = 0;
            if (scoreObj instanceof BigDecimal) {
                score = ((BigDecimal) scoreObj).doubleValue();
            } else if (scoreObj instanceof Number) {
                score = ((Number) scoreObj).doubleValue();
            }
            knowledgeMastery.put(nodeName, BigDecimal.valueOf(score)
                    .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP).doubleValue());
        }

        Map<String, Object> requestBody = Map.of(
                "student_id", userId,
                "student_name", studentName,
                "course_id", courseId,
                "course_name", courseName,
                "memory_json", memoryJson,
                "knowledge_mastery", knowledgeMastery
        );

        log.info("请求 Agent 学习计划: userId={}, courseId={}, 知识点数={}",
                userId, courseId, knowledgeMastery.size());

        AgentApiResponse<Map<String, Object>> agentResp = agentWebClient
                .post()
                .uri("/api/agent/learning-plan")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<AgentApiResponse<Map<String, Object>>>() {})
                .timeout(AGENT_TIMEOUT)
                .onErrorResume(e -> {
                    log.error("Agent 学习计划调用失败: {}", e.getMessage());
                    AgentApiResponse<Map<String, Object>> fallback = new AgentApiResponse<>();
                    fallback.setSuccess(false);
                    fallback.setError("Agent 服务不可用: " + e.getMessage());
                    return reactor.core.publisher.Mono.just(fallback);
                })
                .block();

        if (agentResp == null || !agentResp.isSuccess()) {
            String err = agentResp != null ? agentResp.getError() : "无响应";
            throw new RuntimeException("计划生成失败: " + err);
        }

        return buildPlanResponse(agentResp.getData());
    }

    @SuppressWarnings("unchecked")
    private LearningPlanResponse buildPlanResponse(Map<String, Object> data) {
        LearningPlanResponse resp = new LearningPlanResponse();
        resp.setSummary((String) data.getOrDefault("summary", ""));
        resp.setShortTerm((Map<String, Object>) data.get("short_term"));
        resp.setMidTerm((Map<String, Object>) data.get("mid_term"));
        resp.setMotivation((String) data.getOrDefault("motivation", ""));
        resp.setGeneratedAt(LocalDateTime.now());
        return resp;
    }

    // ────────────── 教学建议 ──────────────

    @Override
    public TeachingSuggestionResponse getTeachingSuggestion(Long courseId,
                                                             List<Long> weakNodeIds,
                                                             Long teacherId)
    {
        assertCourseTeacher(courseId, teacherId);

        Course course = courseMapper.findById(courseId);
        String courseName = course != null ? course.getCourseName() : "";

        // 查询真实的学情数据
        DashboardResponse dashboard = analyticsService.getDashboard(courseId);

        // 全班各知识点的平均掌握度 (0-100 → 0-1)
        Map<String, Double> classAvgMastery = new LinkedHashMap<>();
        List<Map<String, Object>> avgRows = analyticsMapper.courseAvgMastery(courseId);
        for (Map<String, Object> row : avgRows) {
            String nodeName = (String) row.get("node_name");
            Object scoreObj = row.get("avg_score");
            double score = 0;
            if (scoreObj instanceof BigDecimal) {
                score = ((BigDecimal) scoreObj).doubleValue();
            } else if (scoreObj instanceof Number) {
                score = ((Number) scoreObj).doubleValue();
            }
            classAvgMastery.put(nodeName, BigDecimal.valueOf(score)
                    .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP).doubleValue());
        }

        // 薄弱知识点：优先用前端传的 nodeId，否则从 dashboard 取
        List<String> weakPoints;
        List<Long> resolvedWeakNodeIds;
        if (weakNodeIds != null && !weakNodeIds.isEmpty()) {
            weakPoints = weakNodeIds.stream().map(String::valueOf).collect(Collectors.toList());
            resolvedWeakNodeIds = weakNodeIds;
        } else {
            resolvedWeakNodeIds = dashboard.getWeakKnowledgePoints().stream()
                    .map(DashboardResponse.WeakNode::getNodeId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            weakPoints = dashboard.getWeakKnowledgePoints().stream()
                    .map(DashboardResponse.WeakNode::getName)
                    .collect(Collectors.toList());
        }

        int riskCount = dashboard.getRiskStudentCount();

        Map<String, Object> requestBody = Map.of(
                "teacher_id", teacherId,
                "course_id", courseId,
                "course_name", courseName,
                "class_avg_mastery", classAvgMastery,
                "weak_knowledge_points", weakPoints,
                "at_risk_student_count", riskCount
        );

        log.info("请求 Agent 教学建议: courseId={}, 知识点数={}, 薄弱点={}, 风险人数={}",
                courseId, classAvgMastery.size(), weakPoints, riskCount);

        AgentApiResponse<Map<String, Object>> agentResp = agentWebClient
                .post()
                .uri("/api/agent/teaching-suggestion")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<AgentApiResponse<Map<String, Object>>>() {})
                .timeout(AGENT_TIMEOUT)
                .onErrorResume(e -> {
                    log.error("Agent 教学建议调用失败: {}", e.getMessage());
                    AgentApiResponse<Map<String, Object>> fallback = new AgentApiResponse<>();
                    fallback.setSuccess(false);
                    fallback.setError("Agent 服务不可用: " + e.getMessage());
                    return reactor.core.publisher.Mono.just(fallback);
                })
                .block();

        if (agentResp == null || !agentResp.isSuccess()) {
            String err = agentResp != null ? agentResp.getError() : "无响应";
            throw new RuntimeException("教学建议生成失败: " + err);
        }

        TeachingSuggestionResponse resp = buildSuggestionResponse(agentResp.getData());

        TeachingSuggestion entity = new TeachingSuggestion();
        entity.setCourseId(courseId);
        entity.setTeacherId(teacherId);
        entity.setProblem(resp.getProblem());
        try {
            entity.setSuggestions(objectMapper.writeValueAsString(resp.getSuggestions()));
            entity.setWeakNodeIds(objectMapper.writeValueAsString(resolvedWeakNodeIds));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("教学建议序列化失败", e);
        }
        entity.setPriority(resp.getPriority());
        teachingSuggestionMapper.insert(entity);

        resp.setId(entity.getId());
        resp.setWeakNodeIds(resolvedWeakNodeIds);
        return resp;
    }

    @SuppressWarnings("unchecked")
    private TeachingSuggestionResponse buildSuggestionResponse(Map<String, Object> data) {
        TeachingSuggestionResponse resp = new TeachingSuggestionResponse();
        resp.setProblem((String) data.getOrDefault("summary",
                data.getOrDefault("problem", "")));
        Object suggestionsObj = data.getOrDefault("teaching_suggestions",
                data.getOrDefault("suggestions", List.of()));
        if (suggestionsObj instanceof List) {
            resp.setSuggestions((List<String>) suggestionsObj);
        } else {
            resp.setSuggestions(List.of());
        }
        resp.setPriority((String) data.getOrDefault("priority", "NORMAL"));
        resp.setGeneratedAt(LocalDateTime.now());
        return resp;
    }

    // ────────────── 教学建议查询 ──────────────

    @Override
    public TeachingSuggestionResponse getLatestSuggestion(Long courseId, Long teacherId) {
        assertCourseTeacher(courseId, teacherId);
        TeachingSuggestion latest = teachingSuggestionMapper.findLatestByCourseId(courseId);
        if (latest == null) {
            throw new BusinessException(404, "暂无教学建议");
        }
        return toResponse(latest);
    }

    @Override
    public Map<String, Object> listSuggestions(Long courseId, Long teacherId, int page, int pageSize) {
        assertCourseTeacher(courseId, teacherId);
        int offset = (page - 1) * pageSize;
        List<TeachingSuggestion> rows = teachingSuggestionMapper.findPage(courseId, offset, pageSize);
        long total = teachingSuggestionMapper.countByCourseId(courseId);

        List<TeachingSuggestionResponse> items = rows.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("total", total);
        result.put("page", page);
        result.put("pageSize", pageSize);
        return result;
    }

    private void assertCourseTeacher(Long courseId, Long teacherId) {
        Long ownerId = courseMapper.findTeacherIdByCourseId(courseId);
        if (ownerId == null) {
            throw new BusinessException(404, "课程不存在");
        }
        if (!ownerId.equals(teacherId)) {
            throw new BusinessException(403, "仅本课程教师可操作");
        }
    }

    private TeachingSuggestionResponse toResponse(TeachingSuggestion e) {
        TeachingSuggestionResponse resp = new TeachingSuggestionResponse();
        resp.setId(e.getId());
        resp.setProblem(e.getProblem());
        resp.setSuggestions(parseStringList(e.getSuggestions()));
        resp.setWeakNodeIds(parseLongList(e.getWeakNodeIds()));
        resp.setPriority(e.getPriority());
        resp.setGeneratedAt(e.getCreatedAt());
        return resp;
    }

    private List<String> parseStringList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private List<Long> parseLongList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<Long>>() {});
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    // ────────────── 触发提醒 ──────────────

    @Override
    public void triggerReminder(Long courseId, TriggerReminderRequest request) {
        User user = userMapper.findById(request.getStudentId());
        String studentName = user != null ? user.getRealName() : "未知";
        String memoryJson = memoryService.get(request.getStudentId(), courseId);

        // 查询该学生的真实学情数据
        double completionRate = analyticsMapper.studentCompletionRate(courseId, request.getStudentId());
        int activeDays = analyticsMapper.studentActiveDays(courseId, request.getStudentId());
        double quizAvg = analyticsMapper.studentQuizAvg(courseId, request.getStudentId());
        boolean atRisk = (activeDays == 0) || (quizAvg < 40);

        // 查询薄弱知识点 (<60 分)
        List<Map<String, Object>> masteryRows = analyticsMapper.studentMasteryMap(courseId, request.getStudentId());
        List<String> weakPoints = masteryRows.stream()
                .filter(row -> {
                    Object scoreObj = row.get("mastery_score");
                    double score = 0;
                    if (scoreObj instanceof BigDecimal) score = ((BigDecimal) scoreObj).doubleValue();
                    else if (scoreObj instanceof Number) score = ((Number) scoreObj).doubleValue();
                    return score < 60;
                })
                .map(row -> (String) row.get("node_name"))
                .collect(Collectors.toList());

        Map<String, Object> requestBody = Map.of(
                "student_id", request.getStudentId(),
                "student_name", studentName,
                "completion_rate", completionRate,
                "active_days", activeDays,
                "at_risk", atRisk,
                "weak_points", weakPoints,
                "memory_json", memoryJson
        );

        log.info("请求 Agent 提醒: studentId={}, courseId={}, completionRate={}, activeDays={}, weakPoints={}",
                request.getStudentId(), courseId, completionRate, activeDays, weakPoints);

        AgentApiResponse<Map<String, Object>> agentResp = agentWebClient
                .post()
                .uri("/api/agent/reminder")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<AgentApiResponse<Map<String, Object>>>() {})
                .timeout(AGENT_TIMEOUT)
                .onErrorResume(e -> {
                    log.error("Agent 提醒调用失败: {}", e.getMessage());
                    AgentApiResponse<Map<String, Object>> fallback = new AgentApiResponse<>();
                    fallback.setSuccess(false);
                    fallback.setError("Agent 服务不可用: " + e.getMessage());
                    return reactor.core.publisher.Mono.just(fallback);
                })
                .block();

        if (agentResp == null || !agentResp.isSuccess()) {
            log.warn("提醒生成失败，Agent 返回错误");
            return;
        }

        // TODO: 将 Agent 返回的提醒内容写入 notifications 表
        log.info("Agent 提醒生成成功: studentId={}, title={}",
                request.getStudentId(),
                ((Map<String, Object>) agentResp.getData()).getOrDefault("title", ""));
    }

    // ────────────── Heartbeat 状态 ──────────────

    @Override
    public HeartbeatStatusResponse getHeartbeatStatus() {
        // TODO: 从 heartbeat_logs 表查询最新记录，目前返回空状态
        HeartbeatStatusResponse resp = new HeartbeatStatusResponse();
        resp.setStatus("UNKNOWN");
        resp.setTotalStudents(0);
        resp.setRemindedCount(0);
        return resp;
    }
}

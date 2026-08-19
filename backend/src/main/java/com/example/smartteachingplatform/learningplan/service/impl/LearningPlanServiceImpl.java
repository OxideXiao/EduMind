package com.example.smartteachingplatform.learningplan.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.smartteachingplatform.learningplan.entity.LearningPlan;
import com.example.smartteachingplatform.learningplan.mapper.LearningPlanMapper;
import com.example.smartteachingplatform.learningplan.service.LearningPlanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class LearningPlanServiceImpl implements LearningPlanService {

    private final LearningPlanMapper learningPlanMapper;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Map<String, Object> getLatest(Long courseId, Long studentId) {
        LearningPlan plan = learningPlanMapper.findLatestByCourseAndStudent(courseId, studentId);
        if (plan == null) {
            return Map.of("planId", 0, "planContent", Map.of(), "generatedAt", "");
        }
        // 解析 plan_content JSON 字符串为嵌套对象
        Object planContent;
        try {
            planContent = objectMapper.readValue(
                    plan.getPlanContent() != null ? plan.getPlanContent() : "{}",
                    new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.warn("解析 plan_content 失败: {}", e.getMessage());
            planContent = Map.of();
        }
        return Map.of(
                "planId", plan.getId(),
                "planContent", planContent,
                "generatedAt", plan.getCreatedAt() != null ? plan.getCreatedAt().toString() : ""
        );
    }

    @Override
    public Long createInternal(Long courseId, Long studentId, String title, String planContent, String generatedBy) {
        LearningPlan plan = new LearningPlan();
        plan.setCourseId(courseId);
        plan.setStudentId(studentId);
        plan.setTitle(title != null ? title : "学习计划");
        plan.setPlanContent(planContent);
        plan.setGeneratedBy(generatedBy != null ? generatedBy : "agent");
        plan.setStatus("active");
        learningPlanMapper.insert(plan);
        return plan.getId();
    }
}

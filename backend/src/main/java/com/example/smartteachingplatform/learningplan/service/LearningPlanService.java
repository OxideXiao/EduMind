package com.example.smartteachingplatform.learningplan.service;

import java.util.Map;

public interface LearningPlanService {

    /** 获取学生最新学习计划 */
    Map<String, Object> getLatest(Long courseId, Long studentId);

    /** Agent 内部创建学习计划 */
    Long createInternal(Long courseId, Long studentId, String title, String planContent, String generatedBy);
}

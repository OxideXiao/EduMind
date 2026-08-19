package com.example.smartteachingplatform.graph.service;

import java.util.Map;

public interface KnowledgeGraphService {
    /** 获取课程图谱（JWT 角色决定视图，?role 仅可降级切换） */
    Map<String, Object> getGraph(Long courseId, Long userId, String userRole, String viewRole);
    /** 教师下钻查看特定学生图谱 */
    Map<String, Object> getStudentGraph(Long courseId, Long studentId, Long userId, String userRole);
    /** 获取某知识点下所有学生的掌握度列表 */
    Map<String, Object> getNodeStudents(Long courseId, Long nodeId);
}

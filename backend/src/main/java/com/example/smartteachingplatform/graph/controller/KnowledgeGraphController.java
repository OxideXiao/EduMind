package com.example.smartteachingplatform.graph.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.common.util.SecurityUtils;
import com.example.smartteachingplatform.graph.service.KnowledgeGraphService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class KnowledgeGraphController {

    private final KnowledgeGraphService knowledgeGraphService;

    @GetMapping("/{courseId}/graph")
    @PreAuthorize("isAuthenticated()")
    public Result<Map<String, Object>> getGraph(@PathVariable Long courseId,
                           @RequestParam(required = false) String role) {
        return Result.success(knowledgeGraphService.getGraph(
                courseId, SecurityUtils.getUserId(), SecurityUtils.getUserRole(), role));
    }

    @GetMapping("/{courseId}/students/{studentId}/graph")
    @PreAuthorize("hasAnyRole('TEACHER','STUDENT')")
    public Result<Map<String, Object>> getStudentGraph(@PathVariable Long courseId,
                                  @PathVariable Long studentId) {
        return Result.success(knowledgeGraphService.getStudentGraph(
                courseId, studentId, SecurityUtils.getUserId(), SecurityUtils.getUserRole()));
    }

    /** 获取某知识点下所有学生的掌握度列表 — TEACHER */
    @GetMapping("/{courseId}/nodes/{nodeId}/students")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> getNodeStudents(@PathVariable Long courseId,
                                                        @PathVariable Long nodeId) {
        return Result.success(knowledgeGraphService.getNodeStudents(courseId, nodeId));
    }
}

package com.example.smartteachingplatform.mastery.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.common.util.SecurityUtils;
import com.example.smartteachingplatform.mastery.dto.AdjustRequest;
import com.example.smartteachingplatform.mastery.dto.AdjustResponse;
import com.example.smartteachingplatform.mastery.dto.NodeSummaryResponse;
import com.example.smartteachingplatform.mastery.service.MasteryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class MasteryController {

    private final MasteryService masteryService;

    @GetMapping("/api/courses/{courseId}/mastery/me")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<Map<String, Object>> getMyMastery(@PathVariable Long courseId) {
        return Result.success(masteryService.getMyMastery(courseId, SecurityUtils.getUserId()));
    }

    @GetMapping("/api/courses/{courseId}/mastery/students/{studentId}")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> getStudentMastery(@PathVariable Long courseId,
                                                         @PathVariable Long studentId) {
        return Result.success(masteryService.getStudentMastery(courseId, studentId, SecurityUtils.getUserId()));
    }

    @GetMapping("/api/courses/{courseId}/mastery/nodes/{nodeId}/summary")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<NodeSummaryResponse> getNodeSummary(@PathVariable Long courseId,
                                                      @PathVariable Long nodeId) {
        return Result.success(masteryService.getNodeSummary(courseId, nodeId, SecurityUtils.getUserId()));
    }

    @GetMapping("/api/courses/{courseId}/mastery/history")
    @PreAuthorize("hasAnyRole('TEACHER','STUDENT')")
    public Result<Map<String, Object>> getHistory(@PathVariable Long courseId,
                                                  @RequestParam Long studentId,
                                                  @RequestParam(required = false) Long nodeId,
                                                  @RequestParam(defaultValue = "1") int page,
                                                  @RequestParam(defaultValue = "20") int pageSize) {
        return Result.success(masteryService.getHistory(courseId, studentId, nodeId, page, pageSize,
                SecurityUtils.getUserId()));
    }

    @PostMapping("/api/courses/{courseId}/mastery/adjustments")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<AdjustResponse> adjust(@PathVariable Long courseId,
                                         @Valid @RequestBody AdjustRequest request) {
        return Result.success(masteryService.adjust(courseId, SecurityUtils.getUserId(), request));
    }
}

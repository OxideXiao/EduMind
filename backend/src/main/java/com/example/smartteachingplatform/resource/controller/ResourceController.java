package com.example.smartteachingplatform.resource.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.common.util.SecurityUtils;
import com.example.smartteachingplatform.resource.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @PostMapping("/{courseId}/resources")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> uploadResource(@PathVariable Long courseId,
                                 @RequestBody Map<String, Object> body) {
        return Result.success(resourceService.uploadResource(
                courseId, SecurityUtils.getUserId(), body));
    }

    @GetMapping("/{courseId}/nodes/{nodeId}/learning")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<Map<String, Object>> getLearning(@PathVariable Long courseId,
                              @PathVariable Long nodeId) {
        return Result.success(resourceService.getLearning(courseId, nodeId));
    }
}

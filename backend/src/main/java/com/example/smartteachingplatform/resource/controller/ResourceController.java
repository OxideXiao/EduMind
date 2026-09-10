package com.example.smartteachingplatform.resource.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.common.util.SecurityUtils;
import com.example.smartteachingplatform.resource.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import org.springframework.web.multipart.MultipartFile;
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

    @GetMapping("/{courseId}/resources")
    @PreAuthorize("isAuthenticated()")
    public Result<Map<String, Object>> listResources(@PathVariable Long courseId,
                                                     @RequestParam(defaultValue = "1") int page,
                                                     @RequestParam(defaultValue = "20") int pageSize) {
        return Result.success(resourceService.listResources(
                courseId, SecurityUtils.getUserId(), page, pageSize));
    }

    @PostMapping("/{courseId}/resources/upload")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> uploadFile(@PathVariable Long courseId,
                                                  @RequestPart("file") MultipartFile file,
                                                  @RequestParam(required = false) String name,
                                                  @RequestParam String resourceType,
                                                  @RequestParam(required = false) String description,
                                                  @RequestParam String nodeIds) {
        return Result.success(resourceService.uploadFile(
                courseId, SecurityUtils.getUserId(), file, name, resourceType, description, nodeIds));
    }
}

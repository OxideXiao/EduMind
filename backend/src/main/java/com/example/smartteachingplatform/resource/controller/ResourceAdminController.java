package com.example.smartteachingplatform.resource.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.common.util.SecurityUtils;
import com.example.smartteachingplatform.resource.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceAdminController {

    private final ResourceService resourceService;

    @PutMapping("/{resourceId}")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> updateResource(@PathVariable Long resourceId,
                                                      @RequestBody Map<String, Object> body) {
        return Result.success(resourceService.updateResource(
                resourceId, SecurityUtils.getUserId(), body));
    }

    @DeleteMapping("/{resourceId}")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Void> deleteResource(@PathVariable Long resourceId) {
        resourceService.deleteResource(resourceId, SecurityUtils.getUserId());
        return Result.success();
    }
}

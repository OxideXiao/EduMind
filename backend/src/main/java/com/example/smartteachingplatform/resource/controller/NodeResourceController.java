package com.example.smartteachingplatform.resource.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.common.util.SecurityUtils;
import com.example.smartteachingplatform.resource.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/nodes")
@RequiredArgsConstructor
public class NodeResourceController {

    private final ResourceService resourceService;

    @GetMapping("/{nodeId}/resources")
    @PreAuthorize("isAuthenticated()")
    public Result<Map<String, Object>> getNodeResources(@PathVariable Long nodeId) {
        return Result.success(resourceService.getNodeResources(
                nodeId, SecurityUtils.getUserId()));
    }
}

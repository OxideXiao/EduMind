package com.example.smartteachingplatform.graph.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.common.util.SecurityUtils;
import com.example.smartteachingplatform.graph.dto.NodeRequest;
import com.example.smartteachingplatform.graph.service.KnowledgeGraphService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/nodes")
@RequiredArgsConstructor
public class NodeController {

    private final KnowledgeGraphService knowledgeGraphService;

    @PutMapping("/{nodeId}")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> updateNode(@PathVariable Long nodeId,
                                                  @RequestBody NodeRequest request) {
        return Result.success(knowledgeGraphService.updateNode(
                nodeId, SecurityUtils.getUserId(), request));
    }

    @DeleteMapping("/{nodeId}")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Void> deleteNode(@PathVariable Long nodeId) {
        knowledgeGraphService.deleteNode(nodeId, SecurityUtils.getUserId());
        return Result.success();
    }
}

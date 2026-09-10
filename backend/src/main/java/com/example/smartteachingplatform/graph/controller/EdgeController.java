package com.example.smartteachingplatform.graph.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.common.util.SecurityUtils;
import com.example.smartteachingplatform.graph.service.KnowledgeGraphService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/edges")
@RequiredArgsConstructor
public class EdgeController {

    private final KnowledgeGraphService knowledgeGraphService;

    @DeleteMapping("/{edgeId}")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Void> deleteEdge(@PathVariable Long edgeId) {
        knowledgeGraphService.deleteEdge(edgeId, SecurityUtils.getUserId());
        return Result.success();
    }
}

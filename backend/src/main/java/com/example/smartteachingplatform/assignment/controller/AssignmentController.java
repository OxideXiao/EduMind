package com.example.smartteachingplatform.assignment.controller;

import com.example.smartteachingplatform.assignment.dto.AssignmentRequest;
import com.example.smartteachingplatform.assignment.service.AssignmentService;
import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.common.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping("/api/courses/{courseId}/assignments")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> create(@PathVariable Long courseId,
                                              @Valid @RequestBody AssignmentRequest req) {
        return Result.success(assignmentService.createAssignment(courseId, SecurityUtils.getUserId(), req));
    }

    @PutMapping("/api/assignments/{assignmentId}")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> update(@PathVariable Long assignmentId,
                                              @Valid @RequestBody AssignmentRequest req) {
        return Result.success(assignmentService.updateAssignment(assignmentId, SecurityUtils.getUserId(), req));
    }

    @GetMapping("/api/courses/{courseId}/assignments")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> list(@PathVariable Long courseId,
                                            @RequestParam(defaultValue = "1") int page,
                                            @RequestParam(defaultValue = "20") int pageSize) {
        return Result.success(assignmentService.listAssignments(courseId, SecurityUtils.getUserId(), page, pageSize));
    }
}

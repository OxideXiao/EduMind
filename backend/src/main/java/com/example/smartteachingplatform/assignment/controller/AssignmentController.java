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
import com.example.smartteachingplatform.assignment.dto.AssignmentDetailResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
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

    @PostMapping("/api/assignments/{assignmentId}/publish")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> publish(@PathVariable Long assignmentId) {
        return Result.success(assignmentService.publish(assignmentId, SecurityUtils.getUserId()));
    }

    @PostMapping("/api/assignments/{assignmentId}/close")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> close(@PathVariable Long assignmentId) {
        return Result.success(assignmentService.close(assignmentId, SecurityUtils.getUserId()));
    }

    @GetMapping("/api/student/assignments")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<Map<String, Object>> studentList(@RequestParam(defaultValue = "1") int page,
                                                   @RequestParam(defaultValue = "20") int pageSize) {
        return Result.success(assignmentService.listStudentAssignments(SecurityUtils.getUserId(), page, pageSize));
    }

    @GetMapping("/api/assignments/{assignmentId}")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<AssignmentDetailResponse> detail(@PathVariable Long assignmentId) {
        return Result.success(assignmentService.getDetail(assignmentId, SecurityUtils.getUserId()));
    }

    @GetMapping("/api/courses/{courseId}/assignments/mine")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<Map<String, Object>> myAssignments(@PathVariable Long courseId,
                                                     @RequestParam(defaultValue = "1") int page,
                                                     @RequestParam(defaultValue = "20") int pageSize) {
        return Result.success(assignmentService.listStudentAssignmentsByCourse(SecurityUtils.getUserId(), courseId, page, pageSize));
    }

    @PostMapping("/api/assignments/{assignmentId}/submissions")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<Map<String, Object>> submit(@PathVariable Long assignmentId,
                                              @RequestParam(value = "content", required = false) String content,
                                              @RequestParam(value = "files", required = false) List<MultipartFile> files)
    {
        return Result.success(assignmentService.submit(assignmentId, SecurityUtils.getUserId(), content, files));
    }
}

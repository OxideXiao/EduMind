package com.example.smartteachingplatform.course.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.common.util.SecurityUtils;
import com.example.smartteachingplatform.course.dto.PasswordResetResponse;
import com.example.smartteachingplatform.course.service.StudentImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/courses/{courseId}/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentImportService studentImportService;

    @PostMapping("/{studentId}/password-reset")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<PasswordResetResponse> resetPassword(
            @PathVariable Long courseId,
            @PathVariable Long studentId,
            @RequestBody(required = false) Map<String, String> body) {
        String passwordMode = body == null ? null : body.get("passwordMode");
        return Result.success(studentImportService.resetPassword(
                courseId, SecurityUtils.getUserId(), studentId, passwordMode));
    }
}

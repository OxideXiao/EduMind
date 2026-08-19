package com.example.smartteachingplatform.course.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.common.util.SecurityUtils;
import com.example.smartteachingplatform.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> createCourse(@RequestBody Map<String, String> body) {
        return Result.success(courseService.createCourse(
                SecurityUtils.getUserId(),
                body.get("name"),
                body.get("semester"),
                body.get("description")
        ));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public Result<List<Map<String, Object>>> listMyCourses() {
        return Result.success(courseService.listMyCourses(SecurityUtils.getUserId()));
    }

    @PostMapping("/{courseId}/join")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<Map<String, Object>> join(@PathVariable Long courseId,
                       @RequestBody Map<String, String> body) {
        return Result.success(courseService.joinByInviteCode(
                SecurityUtils.getUserId(), courseId, body.get("inviteCode")));
    }

    @GetMapping("/{courseId}/members")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> getMembers(@PathVariable Long courseId) {
        return Result.success(courseService.getMembers(courseId, SecurityUtils.getUserId()));
    }
}

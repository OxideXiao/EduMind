package com.example.smartteachingplatform.course.service;

import java.util.List;
import java.util.Map;

public interface CourseService {
    Map<String, Object> createCourse(Long teacherId, String name, String semester, String description);
    List<Map<String, Object>> listMyCourses(Long userId);
    Map<String, Object> joinByInviteCode(Long userId, Long courseId, String inviteCode);
    Map<String, Object> getMembers(Long courseId, Long userId);
}

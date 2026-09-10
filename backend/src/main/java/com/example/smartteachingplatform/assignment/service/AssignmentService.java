package com.example.smartteachingplatform.assignment.service;

import com.example.smartteachingplatform.assignment.dto.AssignmentRequest;

import java.util.Map;

public interface AssignmentService {

    Map<String, Object> createAssignment(Long courseId, Long teacherId, AssignmentRequest req);

    Map<String, Object> updateAssignment(Long assignmentId, Long teacherId, AssignmentRequest req);

    Map<String, Object> listAssignments(Long courseId, Long teacherId, int page, int pageSize);
}

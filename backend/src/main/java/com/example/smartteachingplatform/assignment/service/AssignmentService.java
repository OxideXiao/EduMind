package com.example.smartteachingplatform.assignment.service;

import com.example.smartteachingplatform.assignment.dto.AssignmentRequest;
import com.example.smartteachingplatform.assignment.dto.AssignmentDetailResponse;
import com.example.smartteachingplatform.assignment.dto.SubmissionItemResponse;
import com.example.smartteachingplatform.assignment.dto.GradeRequest;
import com.example.smartteachingplatform.assignment.dto.GradeResponse;
import java.util.Map;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface AssignmentService {

    Map<String, Object> createAssignment(Long courseId, Long teacherId, AssignmentRequest req);

    Map<String, Object> updateAssignment(Long assignmentId, Long teacherId, AssignmentRequest req);

    Map<String, Object> listAssignments(Long courseId, Long teacherId, int page, int pageSize);

    Map<String, Object> publish(Long assignmentId, Long teacherId);

    Map<String, Object> close(Long assignmentId, Long teacherId);

    Map<String, Object> listStudentAssignments(Long studentId, int page, int pageSize);

    Map<String, Object> listStudentAssignmentsByCourse(Long studentId, Long courseId, int page, int pageSize);

    AssignmentDetailResponse getDetail(Long assignmentId, Long studentId);

    Map<String, Object> submit(Long assignmentId, Long studentId, String content, List<MultipartFile> files);

    Map<String, Object> listSubmissions(Long assignmentId, Long teacherId, int page, int pageSize);

    SubmissionItemResponse getSubmission(Long assignmentId, Long submissionId, Long teacherId);

    GradeResponse grade(Long submissionId, Long teacherId, GradeRequest req);
}

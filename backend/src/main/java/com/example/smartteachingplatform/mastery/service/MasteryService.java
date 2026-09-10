package com.example.smartteachingplatform.mastery.service;

import com.example.smartteachingplatform.mastery.dto.AdjustRequest;
import com.example.smartteachingplatform.mastery.dto.AdjustResponse;
import com.example.smartteachingplatform.mastery.dto.NodeSummaryResponse;

import java.util.Map;

public interface MasteryService {

    Map<String, Object> getMyMastery(Long courseId, Long studentId);

    Map<String, Object> getStudentMastery(Long courseId, Long studentId, Long teacherId);

    NodeSummaryResponse getNodeSummary(Long courseId, Long nodeId, Long teacherId);

    Map<String, Object> getHistory(Long courseId, Long studentId, Long nodeId,
                                   int page, int pageSize, Long userId);

    AdjustResponse adjust(Long courseId, Long teacherId, AdjustRequest request);
}

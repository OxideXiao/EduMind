package com.example.smartteachingplatform.assignment.service.impl;

import com.example.smartteachingplatform.assignment.dto.AssignmentItemResponse;
import com.example.smartteachingplatform.assignment.dto.AssignmentRequest;
import com.example.smartteachingplatform.assignment.entity.Assignment;
import com.example.smartteachingplatform.assignment.mapper.AssignmentMapper;
import com.example.smartteachingplatform.assignment.service.AssignmentService;
import com.example.smartteachingplatform.common.exception.BusinessException;
import com.example.smartteachingplatform.course.mapper.CourseMapper;
import com.example.smartteachingplatform.graph.entity.KnowledgeNode;
import com.example.smartteachingplatform.graph.mapper.KnowledgeNodeMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentMapper assignmentMapper;
    private final CourseMapper courseMapper;
    private final KnowledgeNodeMapper knowledgeNodeMapper;

    @Override
    @Transactional
    public Map<String, Object> createAssignment(Long courseId, Long teacherId, AssignmentRequest req) {
        assertTeacher(courseId, teacherId);
        validateTime(req);

        Assignment a = new Assignment();
        a.setCourseId(courseId);
        a.setTitle(req.getTitle());
        a.setDescription(req.getDescription());
        a.setSubmissionType(normalizeType(req.getSubmissionType()));
        a.setStartTime(req.getStartTime());
        a.setEndTime(req.getEndTime());
        a.setTotalScore(resolveTotalScore(req.getTotalScore()));
        a.setStatus("draft");
        a.setCreatedBy(teacherId);
        assignmentMapper.insert(a);
        saveNodeBindings(a.getId(), req.getNodeIds(), courseId);

        log.info("作业创建成功: id={}, courseId={}", a.getId(), courseId);
        return Map.of("assignmentId", a.getId(), "status", a.getStatus());
    }

    @Override
    @Transactional
    public Map<String, Object> updateAssignment(Long assignmentId, Long teacherId, AssignmentRequest req) {
        Assignment a = assignmentMapper.findById(assignmentId);
        if (a == null) throw new BusinessException(404, "作业不存在");
        assertTeacher(a.getCourseId(), teacherId);
        validateTime(req);

        a.setTitle(req.getTitle());
        a.setDescription(req.getDescription());
        a.setSubmissionType(normalizeType(req.getSubmissionType()));
        a.setStartTime(req.getStartTime());
        a.setEndTime(req.getEndTime());
        a.setTotalScore(resolveTotalScore(req.getTotalScore()));
        assignmentMapper.update(a);

        // 全量替换节点关联
        assignmentMapper.deleteNodes(assignmentId);
        saveNodeBindings(assignmentId, req.getNodeIds(), a.getCourseId());

        log.info("作业编辑成功: id={}", assignmentId);
        return Map.of("assignmentId", assignmentId, "status", a.getStatus());
    }

    @Override
    public Map<String, Object> listAssignments(Long courseId, Long teacherId, int page, int pageSize) {
        assertTeacher(courseId, teacherId);
        int offset = (page - 1) * pageSize;
        List<Assignment> list = assignmentMapper.findPageByCourseId(courseId, offset, pageSize);
        long total = assignmentMapper.countByCourseId(courseId);

        List<AssignmentItemResponse> items = list.stream()
                .map(a -> toItem(a, assignmentMapper.findNodeIds(a.getId())))
                .collect(Collectors.toList());
        return buildPage(items, total, page, pageSize);
    }

    // ────────── 工具方法 ──────────

    private void assertTeacher(Long courseId, Long teacherId) {
        Long owner = courseMapper.findTeacherIdByCourseId(courseId);
        if (owner == null) throw new BusinessException(404, "课程不存在");
        if (!owner.equals(teacherId)) throw new BusinessException(403, "你不是该课程的教师");
    }

    private void saveNodeBindings(Long assignmentId, List<Long> nodeIds, Long courseId) {
        if (nodeIds == null || nodeIds.isEmpty()) return;
        for (Long nodeId : nodeIds) {
            KnowledgeNode node = knowledgeNodeMapper.findById(nodeId);
            if (node == null || !node.getCourseId().equals(courseId)) {
                throw new BusinessException(400, "知识点不存在或不属于该课程: " + nodeId);
            }
            assignmentMapper.bindNode(assignmentId, nodeId);
        }
    }

    private String normalizeType(String type) {
        String t = type.toUpperCase();
        if (!List.of("TEXT", "FILE", "TEXT_AND_FILE").contains(t)) {
            throw new BusinessException(400, "提交类型非法: " + type);
        }
        return t;
    }

    private BigDecimal resolveTotalScore(BigDecimal score) {
        if (score == null) return BigDecimal.valueOf(100);
        if (score.compareTo(BigDecimal.ZERO) < 0) throw new BusinessException(400, "满分不能为负");
        return score;
    }

    private void validateTime(AssignmentRequest req) {
        if (req.getStartTime() != null && req.getEndTime() != null
                && req.getEndTime().isBefore(req.getStartTime())) {
            throw new BusinessException(400, "截止时间不能早于开始时间");
        }
    }

    private AssignmentItemResponse toItem(Assignment a, List<Long> nodeIds) {
        AssignmentItemResponse item = new AssignmentItemResponse();
        item.setAssignmentId(a.getId());
        item.setTitle(a.getTitle());
        item.setDescription(a.getDescription());
        item.setSubmissionType(a.getSubmissionType());
        item.setNodeIds(nodeIds);
        item.setStartTime(a.getStartTime());
        item.setEndTime(a.getEndTime());
        item.setTotalScore(a.getTotalScore());
        item.setStatus(a.getStatus());
        item.setSubmissionCount(a.getSubmissionCount());
        return item;
    }

    private Map<String, Object> buildPage(List<?> items, long total, int page, int pageSize) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("items", items);
        data.put("total", total);
        data.put("page", page);
        data.put("pageSize", pageSize);
        return data;
    }
}

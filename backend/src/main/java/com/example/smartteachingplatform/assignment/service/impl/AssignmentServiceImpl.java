package com.example.smartteachingplatform.assignment.service.impl;

import com.example.smartteachingplatform.assignment.dto.AssignmentItemResponse;
import com.example.smartteachingplatform.assignment.dto.AssignmentRequest;
import com.example.smartteachingplatform.assignment.entity.Assignment;
import com.example.smartteachingplatform.assignment.mapper.AssignmentMapper;
import com.example.smartteachingplatform.assignment.service.AssignmentService;
import com.example.smartteachingplatform.common.exception.BusinessException;
import com.example.smartteachingplatform.course.entity.Course;
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
import com.example.smartteachingplatform.assignment.dto.AssignmentDetailResponse;
import com.example.smartteachingplatform.assignment.dto.MySubmissionDto;
import com.example.smartteachingplatform.assignment.entity.AssignmentSubmission;
import com.example.smartteachingplatform.assignment.mapper.AssignmentSubmissionMapper;
import com.example.smartteachingplatform.course.mapper.CourseMemberMapper;
import com.example.smartteachingplatform.assignment.entity.SubmissionFile;
import com.example.smartteachingplatform.common.storage.MinioStorageService;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import com.example.smartteachingplatform.assignment.dto.SubmissionItemResponse;
import com.example.smartteachingplatform.assignment.dto.SubmissionFileDto;
import com.example.smartteachingplatform.assignment.dto.GradeRequest;
import com.example.smartteachingplatform.assignment.dto.GradeResponse;
import com.example.smartteachingplatform.quiz.entity.KnowledgeMastery;
import java.math.RoundingMode;
import java.util.ArrayList;
@Slf4j
@Service
@RequiredArgsConstructor
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentMapper assignmentMapper;
    private final CourseMapper courseMapper;
    private final KnowledgeNodeMapper knowledgeNodeMapper;
    private final CourseMemberMapper courseMemberMapper;
    private final AssignmentSubmissionMapper submissionMapper;
    private final MinioStorageService minioStorageService;

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

    @Override
    @Transactional
    public Map<String, Object> publish(Long assignmentId, Long teacherId) {
        return changeStatus(assignmentId, teacherId, "published");
    }

    @Override
    @Transactional
    public Map<String, Object> close(Long assignmentId, Long teacherId) {
        return changeStatus(assignmentId, teacherId, "closed");
    }

    private Map<String, Object> changeStatus(Long assignmentId, Long teacherId, String target) {
        Assignment a = assignmentMapper.findById(assignmentId);
        if (a == null) throw new BusinessException(404, "作业不存在");
        assertTeacher(a.getCourseId(), teacherId);

        if ("published".equals(target) && "closed".equals(a.getStatus())) {
            throw new BusinessException(409, "作业已关闭，不能重新发布");
        }

        assignmentMapper.updateStatus(assignmentId, target);
        log.info("作业状态变更: id={}, {} -> {}", assignmentId, a.getStatus(), target);
        return Map.of("assignmentId", assignmentId, "status", target);
    }

    @Override
    public Map<String, Object> listStudentAssignments(Long studentId, int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        List<Assignment> list = assignmentMapper.findPublishedPageByStudent(studentId, offset, pageSize);
        long total = assignmentMapper.countPublishedByStudent(studentId);

        List<AssignmentDetailResponse> items = list.stream()
                .map(a -> toDetail(a, studentId))
                .collect(Collectors.toList());
        return buildPage(items, total, page, pageSize);
    }

    @Override
    public Map<String, Object> listStudentAssignmentsByCourse(Long studentId, Long courseId, int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        List<Assignment> list = assignmentMapper.findPublishedPageByStudentAndCourse(studentId, courseId, offset, pageSize);
        long total = assignmentMapper.countPublishedByStudentAndCourse(studentId, courseId);

        List<AssignmentDetailResponse> items = list.stream()
                .map(a -> toDetail(a, studentId))
                .collect(Collectors.toList());
        return buildPage(items, total, page, pageSize);
    }

    @Override
    public AssignmentDetailResponse getDetail(Long assignmentId, Long studentId) {
        Assignment a = assignmentMapper.findById(assignmentId);
        if (a == null) throw new BusinessException(404, "作业不存在");
        assertStudentInCourse(a.getCourseId(), studentId);
        if (!List.of("published", "closed").contains(a.getStatus())) {
            throw new BusinessException(404, "作业不存在");
        }
        AssignmentDetailResponse resp = toDetail(a, studentId);
        if (resp.getCourseName() == null) {
            Course course = courseMapper.findById(a.getCourseId());
            resp.setCourseName(course != null ? course.getCourseName() : null);
        }
        return resp;
    }

    @Override
    @Transactional
    public Map<String, Object> submit(Long assignmentId, Long studentId, String content, List<MultipartFile> files) {
        Assignment a = assignmentMapper.findById(assignmentId);
        if (a == null) throw new BusinessException(404, "作业不存在");
        assertStudentInCourse(a.getCourseId(), studentId);
        if (!"published".equals(a.getStatus())) throw new BusinessException(409, "作业未发布或已关闭");
        if (a.getEndTime() != null && LocalDateTime.now().isAfter(a.getEndTime())) {
            throw new BusinessException(409, "已过截止时间");
        }

        boolean hasContent = content != null && !content.isBlank();
        boolean hasFiles = files != null && !files.isEmpty();
        String type = a.getSubmissionType();
        if ("TEXT".equals(type) && !hasContent) throw new BusinessException(400, "该作业需填写文本内容");
        if ("FILE".equals(type) && !hasFiles) throw new BusinessException(400, "该作业需上传附件");
        if ("TEXT_AND_FILE".equals(type) && !hasContent && !hasFiles) throw new BusinessException(400,
                "需填写内容或上传附件");

        AssignmentSubmission existing = submissionMapper.findByAssignmentAndStudent(assignmentId, studentId);
        Long submissionId;
        if (existing != null) {
            submissionMapper.updateContent(existing.getId(), content);
            submissionMapper.deleteFiles(existing.getId());
            submissionId = existing.getId();
        } else {
            AssignmentSubmission s = new AssignmentSubmission();
            s.setAssignmentId(assignmentId);
            s.setStudentId(studentId);
            s.setContent(content);
            submissionMapper.insert(s);
            submissionId = s.getId();
        }

        if (hasFiles) {
            for (MultipartFile f : files) {
                if (f == null || f.isEmpty()) continue;
                String url = minioStorageService.upload(f);
                SubmissionFile sf = new SubmissionFile();
                sf.setSubmissionId(submissionId);
                sf.setFileName(f.getOriginalFilename());
                sf.setFileUrl(url);
                sf.setFileSize(f.getSize());
                submissionMapper.insertFile(sf);
            }
        }

        return Map.of("submissionId", submissionId, "status", "submitted", "submittedAt", LocalDateTime.now());
    }

    @Override
    public Map<String, Object> listSubmissions(Long assignmentId, Long teacherId, int page, int pageSize) {
        Assignment a = assignmentMapper.findById(assignmentId);
        if (a == null) throw new BusinessException(404, "作业不存在");
        assertTeacher(a.getCourseId(), teacherId);

        int offset = (page - 1) * pageSize;
        List<AssignmentSubmission> list = submissionMapper.findPageByAssignment(assignmentId, a.getCourseId(), offset, pageSize);
        long total = submissionMapper.countStudentsByCourse(a.getCourseId());

        List<SubmissionItemResponse> items = list.stream()
                .map(this::toSubmissionItem)
                .collect(Collectors.toList());
        return buildPage(items, total, page, pageSize);
    }

    @Override
    public SubmissionItemResponse getSubmission(Long assignmentId, Long submissionId, Long teacherId) {
        Assignment a = assignmentMapper.findById(assignmentId);
        if (a == null) throw new BusinessException(404, "作业不存在");
        assertTeacher(a.getCourseId(), teacherId);

        AssignmentSubmission sub = submissionMapper.findById(submissionId);
        if (sub == null || !sub.getAssignmentId().equals(assignmentId)) {
            throw new BusinessException(404, "提交记录不存在");
        }
        return toSubmissionItem(sub);
    }

    @Override
    @Transactional
    public GradeResponse grade(Long submissionId, Long teacherId, GradeRequest req) {
        AssignmentSubmission sub = submissionMapper.findById(submissionId);
        if (sub == null) throw new BusinessException(404, "提交记录不存在");
        Assignment a = assignmentMapper.findById(sub.getAssignmentId());
        if (a == null) throw new BusinessException(404, "作业不存在");
        assertTeacher(a.getCourseId(), teacherId);

        if (req.getScore() == null
                || req.getScore().compareTo(BigDecimal.ZERO) < 0
                || req.getScore().compareTo(a.getTotalScore()) > 0) {
            throw new BusinessException(400, "分数超出范围 0 ~ " + a.getTotalScore());
        }

        submissionMapper.grade(submissionId, req.getScore(), req.getFeedback());

        List<Long> nodeIds = assignmentMapper.findNodeIds(a.getId());
        BigDecimal rate = a.getTotalScore().compareTo(BigDecimal.ZERO) > 0
                ? req.getScore().divide(a.getTotalScore(), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        List<GradeResponse.MasteryUpdate> updates = new ArrayList<>();
        for (Long nodeId : nodeIds) {
            KnowledgeMastery old = submissionMapper.findMastery(a.getCourseId(), sub.getStudentId(), nodeId);
            BigDecimal oldScore = old != null ? old.getMasteryScore() : BigDecimal.ZERO;
            BigDecimal newScore = rate.multiply(BigDecimal.valueOf(0.6))
                    .add(oldScore.multiply(BigDecimal.valueOf(0.4)))
                    .setScale(2, RoundingMode.HALF_UP);
            if (newScore.compareTo(BigDecimal.valueOf(100)) > 0) newScore = BigDecimal.valueOf(100);

            KnowledgeMastery m = new KnowledgeMastery();
            m.setCourseId(a.getCourseId());
            m.setStudentId(sub.getStudentId());
            m.setKnowledgeNodeId(nodeId);
            m.setMasteryScore(newScore);
            m.setMasteryLevel(calcLevel(newScore));
            submissionMapper.upsertMastery(m);

            Long masteryId = submissionMapper.findMastery(a.getCourseId(), sub.getStudentId(), nodeId).getId();
            submissionMapper.insertMasteryHistory(masteryId, a.getCourseId(), sub.getStudentId(),
                    nodeId, oldScore, newScore, "assignment_grade");
            submissionMapper.insertLearningLog(a.getCourseId(), sub.getStudentId(), nodeId, submissionId);

            KnowledgeNode node = knowledgeNodeMapper.findById(nodeId);
            updates.add(buildUpdate(nodeId, node, oldScore, newScore));
        }

        GradeResponse resp = new GradeResponse();
        resp.setSubmissionId(submissionId);
        resp.setStatus("graded");
        resp.setScore(req.getScore());
        resp.setMasteryUpdates(updates);

        log.info("作业评分成功: submissionId={}, score={}", submissionId, req.getScore());
        return resp;
    }

    private SubmissionItemResponse toSubmissionItem(AssignmentSubmission s) {
        SubmissionItemResponse item = new SubmissionItemResponse();
        item.setSubmissionId(s.getId());
        item.setStudentId(s.getStudentId());
        item.setStudentName(s.getStudentName());
        item.setContent(s.getContent());
        item.setStatus(s.getId() == null ? "not_submitted" : s.getStatus());
        item.setScore(s.getScore());
        item.setFeedback(s.getFeedback());
        item.setSubmittedAt(s.getSubmittedAt());
        item.setGradedAt(s.getGradedAt());

        List<SubmissionFileDto> files = s.getId() == null ? List.of()
                : submissionMapper.findFiles(s.getId()).stream()
                .map(f -> {
                    SubmissionFileDto d = new SubmissionFileDto();
                    d.setFileId(f.getId());
                    d.setFileName(f.getFileName());
                    d.setFileUrl(f.getFileUrl());
                    d.setFileSize(f.getFileSize());
                    return d;
                }).collect(Collectors.toList());
        item.setFiles(files);
        return item;
    }

    private String calcLevel(BigDecimal score) {
        int s = score.intValue();
        if (s == 0) return "gray";
        if (s < 60) return "red";
        if (s < 80) return "yellow";
        return "green";
    }

    private GradeResponse.MasteryUpdate buildUpdate(Long nodeId, KnowledgeNode node,
                                                    BigDecimal oldScore, BigDecimal newScore) {
        GradeResponse.MasteryUpdate mu = new GradeResponse.MasteryUpdate();
        mu.setNodeId(nodeId);
        mu.setNodeName(node != null ? node.getNodeName() : "未知");
        mu.setOldScore(oldScore);
        mu.setNewScore(newScore);
        mu.setDelta(newScore.subtract(oldScore));
        return mu;
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

    private AssignmentDetailResponse toDetail(Assignment a, Long studentId) {
        AssignmentDetailResponse resp = new AssignmentDetailResponse();
        resp.setCourseId(a.getCourseId());
        resp.setCourseName(a.getCourseName());
        resp.setAssignmentId(a.getId());
        resp.setTitle(a.getTitle());
        resp.setDescription(a.getDescription());
        resp.setSubmissionType(a.getSubmissionType());
        resp.setNodeIds(assignmentMapper.findNodeIds(a.getId()));
        resp.setStartTime(a.getStartTime());
        resp.setEndTime(a.getEndTime());
        resp.setTotalScore(a.getTotalScore());
        resp.setStatus(a.getStatus());

        AssignmentSubmission sub = submissionMapper.findByAssignmentAndStudent(a.getId(), studentId);
        if (sub != null) {
            MySubmissionDto my = new MySubmissionDto();
            my.setSubmissionId(sub.getId());
            my.setStatus(sub.getStatus());
            my.setScore(sub.getScore());
            my.setFeedback(sub.getFeedback());
            my.setSubmittedAt(sub.getSubmittedAt());
            resp.setMySubmission(my);
        }
        return resp;
    }

    private void assertStudentInCourse(Long courseId, Long studentId) {
        if (courseMemberMapper.findByCourseIdAndUserId(courseId, studentId) == null) {
            throw new BusinessException(403, "未加入该课程");
        }
    }
}

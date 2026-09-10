package com.example.smartteachingplatform.quiz.service.impl;
import com.example.smartteachingplatform.common.exception.BusinessException;
import com.example.smartteachingplatform.course.mapper.CourseMapper;
import com.example.smartteachingplatform.quiz.dto.QuestionListResponse;
import com.example.smartteachingplatform.quiz.entity.Question;
import com.example.smartteachingplatform.quiz.entity.QuestionOption;
import com.example.smartteachingplatform.quiz.mapper.QuestionMapper;
import com.example.smartteachingplatform.quiz.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.example.smartteachingplatform.course.entity.Course;
import com.example.smartteachingplatform.graph.entity.KnowledgeNode;
import com.example.smartteachingplatform.graph.mapper.KnowledgeNodeMapper;
import com.example.smartteachingplatform.quiz.dto.QuestionCreateRequest;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService{
    private final QuestionMapper questionMapper;
    private final CourseMapper courseMapper;
    private final KnowledgeNodeMapper knowledgeNodeMapper;

    @Override
    public QuestionListResponse listQuestions(Long courseId, Long userId, int page, int pageSize) {
        // 鉴权：本课程教师
        Long teacherId = courseMapper.findTeacherIdByCourseId(courseId);
        if (teacherId == null) {
            throw new BusinessException(404, "课程不存在");
        }
        if (!teacherId.equals(userId)) {
            throw new BusinessException(403, "仅本课程教师可查看题库");
        }

        page = Math.max(page, 1);
        pageSize = Math.max(pageSize, 1);
        int offset = (page - 1) * pageSize;

        long total = questionMapper.countByCourseId(courseId);
        List<Question> questions = questionMapper.findPageByCourseId(courseId, pageSize, offset);

        List<Long> questionIds = questions.stream()
                .map(Question::getId)
                .collect(Collectors.toList());

        Map<Long, List<QuestionOption>> optionMap = questionIds.isEmpty()
                ? Collections.emptyMap()
                : questionMapper.findOptionsByQuestionIds(questionIds).stream()
                        .collect(Collectors.groupingBy(QuestionOption::getQuestionId));

        Map<Long, List<Long>> nodeMap = questionIds.isEmpty()
                ? Collections.emptyMap()
                : questionMapper.findNodeIdsByQuestionIds(questionIds).stream()
                        .collect(Collectors.groupingBy(
                                row -> ((Number) row.get("questionId")).longValue(),
                                Collectors.mapping(
                                        row -> ((Number) row.get("knowledgeNodeId")).longValue(),
                                        Collectors.toList()
                                )
                        ));

        List<QuestionListResponse.QuestionItem> items = questions.stream().map(q -> {
            QuestionListResponse.QuestionItem item = new QuestionListResponse.QuestionItem();
            item.setQuestionId(q.getId());
            item.setQuestionCode(q.getQuestionCode());
            item.setType(mapTypeToApi(q.getQuestionType()));
            item.setStem(q.getStem());
            item.setAnswer(q.getAnswer());
            item.setAnalysis(q.getAnalysis());
            item.setDifficulty(q.getDifficulty());
            item.setNodeIds(nodeMap.getOrDefault(q.getId(), Collections.emptyList()));

            List<QuestionListResponse.OptionItem> options = optionMap
                    .getOrDefault(q.getId(), Collections.emptyList()).stream()
                    .map(o -> {
                        QuestionListResponse.OptionItem oi = new QuestionListResponse.OptionItem();
                        oi.setLabel(o.getOptionLabel());
                        oi.setContent(o.getOptionContent());
                        oi.setIsCorrect(o.getIsCorrect() != null && o.getIsCorrect() == 1);
                        return oi;
                    })
                    .collect(Collectors.toList());
            item.setOptions(options);
            return item;
        }).collect(Collectors.toList());

        QuestionListResponse resp = new QuestionListResponse();
        resp.setItems(items);
        resp.setTotal(total);
        resp.setPage(page);
        resp.setPageSize(pageSize);
        return resp;
    }


    @Override
    @Transactional
    public Long createQuestion(Long courseId, Long userId, QuestionCreateRequest request) {
        Course course = courseMapper.findById(courseId);
        if (course == null) throw new BusinessException(404, "课程不存在");
        if (!course.getTeacherId().equals(userId)) throw new BusinessException(403, "仅本课程教师可创建题目");

        String questionCode = resolveQuestionCode(courseId, course.getCourseCode(), request.getQuestionCode(), null);

        Question q = new Question();
        q.setCourseId(courseId);
        q.setQuestionCode(questionCode);
        q.setQuestionType(mapQuestionType(request.getType()));
        q.setStem(request.getStem());
        q.setAnswer(request.getAnswer());
        q.setAnalysis(request.getAnalysis());
        q.setDifficulty(request.getDifficulty() != null ? request.getDifficulty() : 1);

        q.setKnowledgeNodeId(request.getNodeIds() != null && !request.getNodeIds().isEmpty()
                ? request.getNodeIds().get(0) : null);
        q.setCreatedBy(userId);
        questionMapper.insert(q);

        saveNodeBindings(q.getId(), request.getNodeIds());
        saveOptions(q.getId(), request.getOptions());
        return q.getId();
    }

    @Override
    @Transactional
    public Long updateQuestion(Long questionId, Long userId, QuestionCreateRequest request) {
        Question existing = questionMapper.findById(questionId);
        if (existing == null) throw new BusinessException(404, "题目不存在");

        Course course = courseMapper.findById(existing.getCourseId());
        if (course == null) throw new BusinessException(404, "课程不存在");
        if (!course.getTeacherId().equals(userId)) throw new BusinessException(403, "仅本课程教师可编辑题目");


        String questionCode = resolveQuestionCode(existing.getCourseId(), course.getCourseCode(),
                request.getQuestionCode(), questionId);

        Question q = new Question();
        q.setId(questionId);
        q.setQuestionCode(questionCode);
        q.setQuestionType(mapQuestionType(request.getType()));
        q.setStem(request.getStem());
        q.setAnswer(request.getAnswer());
        q.setAnalysis(request.getAnalysis());
        q.setDifficulty(request.getDifficulty() != null ? request.getDifficulty() : existing.getDifficulty());
        q.setKnowledgeNodeId(request.getNodeIds() != null && !request.getNodeIds().isEmpty()
                ? request.getNodeIds().get(0) : null);
        questionMapper.update(q);

        // 重建知识点关联
        questionMapper.deleteKnowledgeByQuestionId(questionId);
        saveNodeBindings(questionId, request.getNodeIds());
        // 重建选项
        questionMapper.deleteOptionsByQuestionId(questionId);
        saveOptions(questionId, request.getOptions());

        return questionId;
    }

    @Override
    @Transactional
    public void deleteQuestion(Long questionId, Long userId) {
        Question question = questionMapper.findById(questionId);
        if (question == null) throw new BusinessException(404, "题目不存在");

        Course course = courseMapper.findById(question.getCourseId());
        if (course == null) throw new BusinessException(404, "课程不存在");
        if (!course.getTeacherId().equals(userId)) throw new BusinessException(403, "仅本课程教师可删除题目");

        // 被测验引用 → 409
        if (questionMapper.countQuizReferences(questionId) > 0) {
            throw new BusinessException(409, "题目已被测验引用，无法删除");
        }

        // 先删子表关联，再删主表（保证不留孤儿数据）
        questionMapper.deleteKnowledgeByQuestionId(questionId);
        questionMapper.deleteOptionsByQuestionId(questionId);
        questionMapper.deleteById(questionId);
    }

    @Override
    public void bindNode(Long questionId, Long nodeId, Long userId) {
        Question question = questionMapper.findById(questionId);
        if (question == null) throw new BusinessException(404, "题目不存在");
        assertTeacher(question.getCourseId(), userId);

        KnowledgeNode node = knowledgeNodeMapper.findById(nodeId);
        if (node == null || !node.getCourseId().equals(question.getCourseId())) {
            throw new BusinessException(400, "知识点节点不存在或不属于本课程");
        }
        questionMapper.bindNodeIfAbsent(questionId, nodeId);

        // 维护主节点冗余：题目还没有主节点时，把该节点设为主节点
        if (question.getKnowledgeNodeId() == null) {
            questionMapper.updateKnowledgeNodeId(questionId, nodeId);
        }
    }

    @Override
    public void unbindNode(Long questionId, Long nodeId, Long userId) {
        Question question = questionMapper.findById(questionId);
        if (question == null) throw new BusinessException(404, "题目不存在");
        assertTeacher(question.getCourseId(), userId);

        questionMapper.unbindNode(questionId, nodeId);

        // 维护主节点冗余：解绑的是主节点时，重设为剩余的第一个节点
        if (nodeId.equals(question.getKnowledgeNodeId())) {
            questionMapper.updateKnowledgeNodeId(questionId,
                    questionMapper.findFirstNodeIdByQuestionId(questionId));
        }
    }

    private void assertTeacher(Long courseId, Long userId) {
        Course course = courseMapper.findById(courseId);
        if (course == null) throw new BusinessException(404, "课程不存在");
        if (!course.getTeacherId().equals(userId)) throw new BusinessException(403, "仅本课程教师可操作");
    }

    // ────────── 私有工具 ──────────

    private void saveNodeBindings(Long questionId, List<Long> nodeIds) {
        if (nodeIds == null) return;
        for (Long nodeId : nodeIds) {
            questionMapper.bindKnowledgeNode(questionId, nodeId);
        }
    }

    private void saveOptions(Long questionId, List<QuestionCreateRequest.OptionItem> options) {
        if (options == null) return;
        for (QuestionCreateRequest.OptionItem opt : options) {
            QuestionOption o = new QuestionOption();
            o.setQuestionId(questionId);
            o.setOptionLabel(opt.getLabel());
            o.setOptionContent(opt.getContent());
            o.setIsCorrect(Boolean.TRUE.equals(opt.getIsCorrect()) ? 1 : 0);
            questionMapper.insertOption(o);
        }
    }


    private String resolveQuestionCode(Long courseId, String courseCode, String inputCode, Long excludeId) {
        if (inputCode != null && !inputCode.isBlank()) {
            int cnt = excludeId == null
                    ? questionMapper.countByCourseIdAndCode(courseId, inputCode)
                    : questionMapper.countByCourseIdAndCodeExclude(courseId, inputCode, excludeId);
            if (cnt > 0) throw new BusinessException(400, "题号已存在");
            return inputCode;
        }
        return generateQuestionCode(courseId, courseCode);
    }

    private String generateQuestionCode(Long courseId, String courseCode) {
        String prefix = "Q-" + (courseCode == null || courseCode.isBlank()
                ? "C" + courseId
                : courseCode.toUpperCase());
        int maxSeq = 0;
        for (String code : questionMapper.findQuestionCodesByCourseId(courseId)) {
            if (code == null || !code.startsWith(prefix + "-")) continue;
            String tail = code.substring(code.lastIndexOf('-') + 1);
            try {
                maxSeq = Math.max(maxSeq, Integer.parseInt(tail));
            } catch (NumberFormatException ignored) { }
        }
        return String.format("%s-%03d", prefix, maxSeq + 1);
    }

    private String mapQuestionType(String type) {
        if (type == null) return "single";
        return switch (type.toUpperCase()) {
            case "SINGLE_CHOICE" -> "single";
            case "MULTIPLE_CHOICE" -> "multiple";
            case "TRUE_FALSE" -> "judge";
            case "FILL_BLANK" -> "blank";
            case "SHORT_ANSWER" -> "short_answer";
            default -> type.toLowerCase();
        };
    }

    /** DB 题型 → API 题型 */
    private String mapTypeToApi(String dbType) {
        if (dbType == null) return "SINGLE_CHOICE";
        return switch (dbType) {
            case "single" -> "SINGLE_CHOICE";
            case "multiple" -> "MULTIPLE_CHOICE";
            case "judge" -> "TRUE_FALSE";
            case "blank" -> "FILL_BLANK";
            case "short_answer" -> "SHORT_ANSWER";
            default -> dbType.toUpperCase();
        };
    }
}

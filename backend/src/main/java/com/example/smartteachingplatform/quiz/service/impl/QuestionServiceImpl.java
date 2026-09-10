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

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService{
    private final QuestionMapper questionMapper;
    private final CourseMapper courseMapper;

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

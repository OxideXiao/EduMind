package com.example.smartteachingplatform.quiz.service;

import com.example.smartteachingplatform.quiz.dto.QuestionListResponse;
import com.example.smartteachingplatform.quiz.dto.QuestionCreateRequest;

public interface QuestionService {
    /** 查询课程题库 */
    QuestionListResponse listQuestions(Long courseId, Long userId, int page, int pageSize);

    /** 创建题目 */
    Long createQuestion(Long courseId, Long userId, QuestionCreateRequest request);

    /** 编辑题目 */
    Long updateQuestion(Long questionId, Long userId, QuestionCreateRequest request);

    /** 删除题目 */
    void deleteQuestion(Long questionId, Long userId);

    /** 绑定题目到节点 */
    void bindNode(Long questionId, Long nodeId, Long userId);

    /** 解绑题目与节点 */
    void unbindNode(Long questionId, Long nodeId, Long userId);
}

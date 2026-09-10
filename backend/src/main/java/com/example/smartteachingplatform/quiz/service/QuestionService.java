package com.example.smartteachingplatform.quiz.service;

import com.example.smartteachingplatform.quiz.dto.QuestionListResponse;

public interface QuestionService {
    /** 查询课程题库 */
    QuestionListResponse listQuestions(Long courseId, Long userId, int page, int pageSize);
}

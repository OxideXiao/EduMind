package com.example.smartteachingplatform.quiz.service;

import com.example.smartteachingplatform.quiz.dto.*;

public interface QuizService {

    /** 创建题目 */
    Long createQuestion(Long courseId, Long teacherId, QuestionCreateRequest request);

    /** 创建测验（组卷） */
    Long createQuiz(Long courseId, Long teacherId, QuizCreateRequest request);

    /** 获取测验详情（不含答案） */
    QuizDetailResponse getQuizDetail(Long quizId);

    /** 提交测验 */
    SubmitResultResponse submitQuiz(Long quizId, Long studentId, SubmitRequest request);
}

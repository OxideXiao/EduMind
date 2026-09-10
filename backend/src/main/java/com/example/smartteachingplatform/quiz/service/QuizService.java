package com.example.smartteachingplatform.quiz.service;

import com.example.smartteachingplatform.quiz.dto.*;

import java.util.Map;

public interface QuizService {

    /** 创建题目 */
    Long createQuestion(Long courseId, Long teacherId, QuestionCreateRequest request);

    /** 创建测验（组卷） */
    Long createQuiz(Long courseId, Long teacherId, QuizCreateRequest request);

    /** 获取测验详情*/
    QuizDetailResponse getQuizDetail(Long quizId, Long userId);

    /** 提交测验 */
    SubmitResultResponse submitQuiz(Long quizId, Long studentId, SubmitRequest request);

    Map<String, Object> listQuizzes(Long courseId, Long userId, int page, int pageSize);

    Long updateQuiz(Long quizId, Long teacherId, QuizCreateRequest request);

    void deleteQuiz(Long quizId, Long teacherId);

    String publishQuiz(Long quizId, Long teacherId);

    String closeQuiz(Long quizId, Long teacherId);

    SubmissionDetailResponse getSubmissionDetail(Long submissionId, Long userId);
}

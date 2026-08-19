package com.example.smartteachingplatform.quiz.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.quiz.dto.*;
import com.example.smartteachingplatform.quiz.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    /** 创建题目 — TEACHER */
    @PostMapping("/api/courses/{courseId}/questions")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> createQuestion(@PathVariable Long courseId,
                                                       @Valid @RequestBody QuestionCreateRequest request) {
        try {
            Long teacherId = getCurrentUserId();
            Long questionId = quizService.createQuestion(courseId, teacherId, request);
            return Result.success(Map.of("questionId", questionId));
        } catch (Exception e) {
            log.error("创建题目失败: {}", e.getMessage());
            return Result.error("创建题目失败: " + e.getMessage());
        }
    }

    /** 创建测验 — TEACHER */
    @PostMapping("/api/courses/{courseId}/quizzes")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> createQuiz(@PathVariable Long courseId,
                                                   @Valid @RequestBody QuizCreateRequest request) {
        try {
            Long teacherId = getCurrentUserId();
            Long quizId = quizService.createQuiz(courseId, teacherId, request);
            return Result.success(Map.of("quizId", quizId));
        } catch (Exception e) {
            log.error("创建测验失败: {}", e.getMessage());
            return Result.error("创建测验失败: " + e.getMessage());
        }
    }

    /** 获取测验详情（不含答案） — STUDENT */
    @GetMapping("/api/quizzes/{quizId}")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<QuizDetailResponse> getQuiz(@PathVariable Long quizId) {
        try {
            return Result.success(quizService.getQuizDetail(quizId));
        } catch (Exception e) {
            log.error("获取测验失败: {}", e.getMessage());
            return Result.error("测验不存在");
        }
    }

    /** 提交测验 — STUDENT */
    @PostMapping("/api/quizzes/{quizId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<SubmitResultResponse> submitQuiz(@PathVariable Long quizId,
                                                    @Valid @RequestBody SubmitRequest request) {
        try {
            Long studentId = getCurrentUserId();
            return Result.success(quizService.submitQuiz(quizId, studentId, request));
        } catch (Exception e) {
            log.error("提交测验失败: quizId={}, {}", quizId, e.getMessage());
            return Result.error("提交失败: " + e.getMessage());
        }
    }

    private Long getCurrentUserId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}

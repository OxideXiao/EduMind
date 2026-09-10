package com.example.smartteachingplatform.quiz.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.common.util.SecurityUtils;
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
        Long quizId = quizService.createQuiz(courseId, SecurityUtils.getUserId(), request);
        return Result.success(Map.of("quizId", quizId, "status", "draft"));
    }

    @PutMapping("/api/quizzes/{quizId}")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> updateQuiz(@PathVariable Long quizId,
                                                  @Valid @RequestBody QuizCreateRequest request) {
        Long id = quizService.updateQuiz(quizId, SecurityUtils.getUserId(), request);
        return Result.success(Map.of("quizId", id, "status", "draft"));
    }

    @DeleteMapping("/api/quizzes/{quizId}")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Void> deleteQuiz(@PathVariable Long quizId) {
        quizService.deleteQuiz(quizId, SecurityUtils.getUserId());
        return Result.success(null);
    }

    @PostMapping("/api/quizzes/{quizId}/publish")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> publishQuiz(@PathVariable Long quizId) {
        String status = quizService.publishQuiz(quizId, SecurityUtils.getUserId());
        return Result.success(Map.of("quizId", quizId, "status", status));
    }

    @PostMapping("/api/quizzes/{quizId}/close")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> closeQuiz(@PathVariable Long quizId) {
        String status = quizService.closeQuiz(quizId, SecurityUtils.getUserId());
        return Result.success(Map.of("quizId", quizId, "status", status));
    }

    /** 获取测验详情（不含答案） — STUDENT */
    @GetMapping("/api/quizzes/{quizId}")
    @PreAuthorize("hasAnyRole('TEACHER','STUDENT')")
    public Result<QuizDetailResponse> getQuiz(@PathVariable Long quizId) {
        return Result.success(quizService.getQuizDetail(quizId, SecurityUtils.getUserId()));
    }

    /** 提交测验 — STUDENT */
    @PostMapping({"/api/quizzes/{quizId}/attempts", "/api/quizzes/{quizId}/submit"})
    @PreAuthorize("hasRole('STUDENT')")
    public Result<SubmitResultResponse> submitQuiz(@PathVariable Long quizId,
                                                   @Valid @RequestBody SubmitRequest request) {
        return Result.success(quizService.submitQuiz(quizId, SecurityUtils.getUserId(), request));
    }

    @GetMapping("/api/courses/{courseId}/quizzes")
    @PreAuthorize("hasAnyRole('TEACHER','STUDENT')")
    public Result<Map<String, Object>> listQuizzes(@PathVariable Long courseId,
                                                   @RequestParam(defaultValue = "1") int page,
                                                   @RequestParam(defaultValue = "20") int pageSize) {
        return Result.success(quizService.listQuizzes(courseId, SecurityUtils.getUserId(), page, pageSize));
    }

    @GetMapping("/api/quiz-submissions/{submissionId}")
    @PreAuthorize("hasAnyRole('TEACHER','STUDENT')")
    public Result<SubmissionDetailResponse> getSubmission(@PathVariable Long submissionId) {
        return Result.success(quizService.getSubmissionDetail(submissionId, SecurityUtils.getUserId()));
    }

    private Long getCurrentUserId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}

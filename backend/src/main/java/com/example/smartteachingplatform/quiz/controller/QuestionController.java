package com.example.smartteachingplatform.quiz.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.common.util.SecurityUtils;
import com.example.smartteachingplatform.quiz.dto.QuestionListResponse;
import com.example.smartteachingplatform.quiz.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.example.smartteachingplatform.quiz.dto.QuestionCreateRequest;
import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    /** 查询课程题库 — TEACHER（本课程） */
    @GetMapping("/api/courses/{courseId}/questions")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<QuestionListResponse> listQuestions(@PathVariable Long courseId,
                                                      @RequestParam(defaultValue = "1") int page,
                                                      @RequestParam(defaultValue = "20") int pageSize) {
        return Result.success(questionService.listQuestions(courseId, SecurityUtils.getUserId(), page, pageSize));
    }

    /** 创建题目 — TEACHER（本课程） */
    @PostMapping("/api/courses/{courseId}/questions")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> createQuestion(@PathVariable Long courseId,
                                                      @Valid @RequestBody QuestionCreateRequest request) {
        Long questionId = questionService.createQuestion(courseId, SecurityUtils.getUserId(), request);
        return Result.success(Map.of("questionId", questionId));
    }

    /** 编辑题目 — TEACHER（本课程） */
    @PutMapping("/api/questions/{questionId}")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Map<String, Object>> updateQuestion(@PathVariable Long questionId,
                                                      @Valid @RequestBody QuestionCreateRequest request) {
        Long id = questionService.updateQuestion(questionId, SecurityUtils.getUserId(), request);
        return Result.success(Map.of("questionId", id));
    }

    /** 删除题目 — TEACHER（本课程） */
    @DeleteMapping("/api/questions/{questionId}")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Void> deleteQuestion(@PathVariable Long questionId) {
        questionService.deleteQuestion(questionId, SecurityUtils.getUserId());
        return Result.success();
    }
}

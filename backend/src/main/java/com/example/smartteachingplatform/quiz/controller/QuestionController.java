package com.example.smartteachingplatform.quiz.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.common.util.SecurityUtils;
import com.example.smartteachingplatform.quiz.dto.QuestionListResponse;
import com.example.smartteachingplatform.quiz.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
}

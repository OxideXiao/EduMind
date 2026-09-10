package com.example.smartteachingplatform.quiz.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.common.util.SecurityUtils;
import com.example.smartteachingplatform.quiz.dto.QuestionImportCommitResponse;
import com.example.smartteachingplatform.quiz.dto.QuestionImportPreviewResponse;
import com.example.smartteachingplatform.quiz.dto.QuestionListResponse;
import com.example.smartteachingplatform.quiz.service.QuestionImportService;
import com.example.smartteachingplatform.quiz.service.QuestionService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.example.smartteachingplatform.quiz.dto.QuestionCreateRequest;
import jakarta.validation.Valid;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;
    private final QuestionImportService questionImportService;

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

    /** 绑定题目到节点 */
    @PostMapping("/api/questions/{questionId}/nodes/{nodeId}")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Void> bindNode(@PathVariable Long questionId, @PathVariable Long nodeId) {
        questionService.bindNode(questionId, nodeId, SecurityUtils.getUserId());
        return Result.success();
    }

    /** 解绑题目与节点 */
    @DeleteMapping("/api/questions/{questionId}/nodes/{nodeId}")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<Void> unbindNode(@PathVariable Long questionId, @PathVariable Long nodeId) {
        questionService.unbindNode(questionId, nodeId, SecurityUtils.getUserId());
        return Result.success();
    }

    /** 题库模板下载 */
    @GetMapping("/api/courses/{courseId}/questions/imports/template")
    @PreAuthorize("hasRole('TEACHER')")
    public void downloadTemplate(@PathVariable Long courseId, HttpServletResponse response) throws IOException {
        questionImportService.downloadTemplate(courseId, SecurityUtils.getUserId(), response);
    }

    /** 导入预览 */
    @PostMapping("/api/courses/{courseId}/questions/imports/preview")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<QuestionImportPreviewResponse> preview(@PathVariable Long courseId,
                                                         @RequestParam("file") MultipartFile file,
                                                         @RequestParam(value = "targetNodeId", required = false) Long targetNodeId) throws IOException {
        return Result.success(questionImportService.preview(courseId, SecurityUtils.getUserId(), file, targetNodeId));
    }

    /** 导入提交 */
    @PostMapping("/api/courses/{courseId}/questions/imports/{importToken}/commit")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<QuestionImportCommitResponse> commit(@PathVariable Long courseId,
                                                       @PathVariable String importToken) {
        return Result.success(questionImportService.commit(courseId, importToken, SecurityUtils.getUserId()));
    }
}

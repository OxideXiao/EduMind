package com.example.smartteachingplatform.graph.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.common.util.SecurityUtils;
import com.example.smartteachingplatform.graph.dto.KnowledgeImportCommitResponse;
import com.example.smartteachingplatform.graph.dto.KnowledgeImportPreviewResponse;
import com.example.smartteachingplatform.graph.service.KnowledgeImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/courses/{courseId}/knowledge-imports")
@RequiredArgsConstructor
public class KnowledgeImportController {

    private final KnowledgeImportService knowledgeImportService;

    @GetMapping("/template")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<byte[]> downloadTemplate(@PathVariable Long courseId) {
        byte[] bytes = knowledgeImportService.buildTemplate(courseId, SecurityUtils.getUserId());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=knowledge_import_template.xlsx")
                .body(bytes);
    }

    @PostMapping("/preview")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<KnowledgeImportPreviewResponse> preview(
            @PathVariable Long courseId,
            @RequestParam("file") MultipartFile file) {
        return Result.success(knowledgeImportService.preview(
                courseId, SecurityUtils.getUserId(), file));
    }

    @PostMapping("/{importToken}/commit")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<KnowledgeImportCommitResponse> commit(
            @PathVariable Long courseId,
            @PathVariable String importToken) {
        return Result.success(knowledgeImportService.commit(
                courseId, SecurityUtils.getUserId(), importToken));
    }
}

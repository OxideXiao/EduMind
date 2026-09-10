package com.example.smartteachingplatform.course.controller;
import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.common.util.SecurityUtils;
import com.example.smartteachingplatform.course.dto.StudentImportCommitResponse;
import com.example.smartteachingplatform.course.dto.StudentImportPreviewResponse;
import com.example.smartteachingplatform.course.service.StudentImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/courses/{courseId}/student-imports")
@RequiredArgsConstructor
public class StudentImportController {
    private final StudentImportService studentImportService;

    @GetMapping("/template")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<byte[]> downloadTemplate(@PathVariable Long courseId){
        byte[] bytes = studentImportService.buildTemplate(courseId, SecurityUtils.getUserId());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=student_import_template.xlsx")
                .body(bytes);
    }

    @PostMapping("/preview")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<StudentImportPreviewResponse> preview(
            @PathVariable Long courseId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("passwordMode") String passwordMode,
            @RequestParam(value = "defaultPassword", required = false) String defaultPassword) {
        return Result.success(studentImportService.preview(
                courseId, SecurityUtils.getUserId(), file, passwordMode, defaultPassword));
    }

    @PostMapping("/{importToken}/commit")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<StudentImportCommitResponse> commit(
            @PathVariable Long courseId,
            @PathVariable String importToken,
            @RequestBody Map<String, String> body) {
        return Result.success(studentImportService.commit(
                courseId, SecurityUtils.getUserId(), importToken, body.get("duplicatePolicy")));
    }
}

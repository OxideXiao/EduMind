package com.example.smartteachingplatform.course.controller;

import com.example.smartteachingplatform.common.util.SecurityUtils;
import com.example.smartteachingplatform.course.service.StudentImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/credential-exports")
@RequiredArgsConstructor
public class CredentialExportController {

    private final StudentImportService studentImportService;

    @GetMapping("/{token}/download")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<byte[]> download(@PathVariable String token) {
        byte[] bytes = studentImportService.buildCredentialExport(token, SecurityUtils.getUserId());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=student_credentials.xlsx")
                .body(bytes);
    }
}

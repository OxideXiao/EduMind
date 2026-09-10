package com.example.smartteachingplatform.quiz.service;

import com.example.smartteachingplatform.quiz.dto.QuestionImportCommitResponse;
import com.example.smartteachingplatform.quiz.dto.QuestionImportPreviewResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface QuestionImportService {

    /** 下载题库导入模板 */
    void downloadTemplate(Long courseId, Long userId, HttpServletResponse response) throws IOException;

    /** 预览：解析 + 校验，生成 importToken */
    QuestionImportPreviewResponse preview(Long courseId, Long userId, MultipartFile file,
                                          Long targetNodeId) throws IOException;

    /** 提交：按 importToken 落库 */
    QuestionImportCommitResponse commit(Long courseId, String importToken, Long userId);
}

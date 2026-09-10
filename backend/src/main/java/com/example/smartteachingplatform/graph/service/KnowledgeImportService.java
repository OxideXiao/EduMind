package com.example.smartteachingplatform.graph.service;

import com.example.smartteachingplatform.graph.dto.KnowledgeImportPreviewResponse;
import org.springframework.web.multipart.MultipartFile;

public interface KnowledgeImportService {
    /**
     * 生成知识图谱导入模板（nodes + edges 两个 Sheet），供教师下载。
     *
     * @param courseId  课程 ID
     * @param teacherId 当前登录教师 ID
     * @return xlsx 文件字节
     */
    byte[] buildTemplate(Long courseId, Long teacherId);

    /**
     * 预览知识图谱导入文件，逐行校验节点和边并生成 importToken。
     *
     * @param courseId  课程 ID
     * @param teacherId 当前登录教师 ID
     * @param file      上传文件（xlsx，含 nodes、edges 两个 Sheet）
     * @return 预览结果
     */
    KnowledgeImportPreviewResponse preview(Long courseId, Long teacherId, MultipartFile file);
}

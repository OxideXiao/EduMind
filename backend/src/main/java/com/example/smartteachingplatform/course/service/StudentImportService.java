package com.example.smartteachingplatform.course.service;

import com.example.smartteachingplatform.course.dto.StudentImportPreviewResponse;
import org.springframework.web.multipart.MultipartFile;

public interface StudentImportService {

    /**
     * 生成学生名单导入模板（仅表头），供教师下载。
     *
     * @param courseId  课程 ID
     * @param teacherId 当前登录教师 ID
     * @return xlsx 文件字节
     */
    byte[] buildTemplate(Long courseId, Long teacherId);

    /**
     * 预览学生名单导入文件，逐行校验并生成 importToken。
     *
     * @param courseId        课程 ID
     * @param teacherId       当前登录教师 ID
     * @param file            上传文件（xlsx/xls/csv）
     * @param passwordMode    密码模式（RANDOM/UNIFORM）
     * @param defaultPassword UNIFORM 模式下的统一初始密码
     * @return 预览结果
     */
    StudentImportPreviewResponse preview(Long courseId, Long teacherId,
                                         MultipartFile file,
                                         String passwordMode, String defaultPassword);
}

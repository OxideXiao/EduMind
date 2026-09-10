package com.example.smartteachingplatform.course.service;

import com.example.smartteachingplatform.course.dto.PasswordResetResponse;
import com.example.smartteachingplatform.course.dto.StudentImportCommitResponse;
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

    /**
     * 确认导入：按 importToken 批量创建学生账号并加入课程。
     *
     * @param courseId        课程 ID
     * @param teacherId       当前登录教师 ID
     * @param importToken     预览阶段返回的令牌
     * @param duplicatePolicy 重复处理策略（仅支持 SKIP）
     * @return 导入结果（含账号凭证下载令牌）
     */
    StudentImportCommitResponse commit(Long courseId, Long teacherId,
                                       String importToken, String duplicatePolicy);

    /**
     * 下载账号凭证（一次性），返回 xlsx 字节。
     *
     * @param token     凭证令牌
     * @param teacherId 当前登录教师 ID
     * @return xlsx 文件字节
     */
    byte[] buildCredentialExport(String token, Long teacherId);

    /**
     * 重置学生密码（RANDOM），返回账号凭证下载令牌。
     *
     * @param courseId     课程 ID
     * @param teacherId    当前登录教师 ID
     * @param studentId    学生用户 ID
     * @param passwordMode 密码模式（仅支持 RANDOM）
     * @return 凭证下载令牌
     */
    PasswordResetResponse resetPassword(Long courseId, Long teacherId,
                                        Long studentId, String passwordMode);
}

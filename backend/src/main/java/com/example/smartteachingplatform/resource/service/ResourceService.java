package com.example.smartteachingplatform.resource.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

public interface ResourceService {
    /** 上传/创建教学资源 */
    Map<String, Object> uploadResource(Long courseId, Long teacherId, Map<String, Object> body);
    /** 获取知识节点的学习资源+测验列表 */
    Map<String, Object> getLearning(Long courseId, Long nodeId);

    Map<String, Object> listResources(Long courseId, Long userId, int page, int pageSize);

    Map<String, Object> getNodeResources(Long nodeId, Long userId);

    Map<String, Object> uploadFile(Long courseId, Long teacherId, MultipartFile file,
                                   String name, String resourceType, String description,
                                   String nodeIds);

    Map<String, Object> updateResource(Long resourceId, Long teacherId, Map<String, Object> body);

    void deleteResource(Long resourceId, Long teacherId);
}

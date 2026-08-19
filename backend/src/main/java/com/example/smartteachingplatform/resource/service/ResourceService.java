package com.example.smartteachingplatform.resource.service;

import java.util.Map;

public interface ResourceService {
    /** 上传/创建教学资源 */
    Map<String, Object> uploadResource(Long courseId, Long teacherId, Map<String, Object> body);
    /** 获取知识节点的学习资源+测验列表 */
    Map<String, Object> getLearning(Long courseId, Long nodeId);
}

package com.example.smartteachingplatform.resource.service.impl;

import com.example.smartteachingplatform.common.exception.BusinessException;
import com.example.smartteachingplatform.graph.entity.KnowledgeNode;
import com.example.smartteachingplatform.graph.mapper.KnowledgeNodeMapper;
import com.example.smartteachingplatform.resource.entity.Resource;
import com.example.smartteachingplatform.resource.mapper.ResourceMapper;
import com.example.smartteachingplatform.resource.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.smartteachingplatform.course.mapper.CourseMapper;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.example.smartteachingplatform.course.entity.CourseMember;
import com.example.smartteachingplatform.course.mapper.CourseMemberMapper;
import com.example.smartteachingplatform.common.storage.MinioStorageService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.multipart.MultipartFile;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {

    private final ResourceMapper resourceMapper;
    private final KnowledgeNodeMapper knowledgeNodeMapper;
    private final CourseMemberMapper courseMemberMapper;
    private final CourseMapper courseMapper;
    private final MinioStorageService minioStorageService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public Map<String, Object> uploadResource(Long courseId, Long teacherId, Map<String, Object> body) {
        // 本课程教师校验
        Long ownerId = courseMapper.findTeacherIdByCourseId(courseId);
        if (ownerId == null) {
            throw new BusinessException(404, "课程不存在");
        }
        if (!teacherId.equals(ownerId)) {
            throw new BusinessException(403, "你不是该课程的教师");
        }

        Resource resource = new Resource();
        resource.setCourseId(courseId);
        resource.setUploaderId(teacherId);
        resource.setResourceName((String) body.get("name"));
        resource.setResourceType(((String) body.get("resourceType")).toLowerCase());
        resource.setFileUrl((String) body.get("url"));
        resource.setDescription((String) body.get("description"));

        resourceMapper.insert(resource);

        // 绑定多个知识点
        Object nodeIdsObj = body.get("nodeIds");
        if (nodeIdsObj instanceof List<?> list) {
            for (Object item : list) {
                long nodeId = item instanceof Number ? ((Number) item).longValue()
                        : Long.parseLong(item.toString());
                resourceMapper.bindKnowledgeNode(resource.getId(), nodeId);
            }
        }

        return Map.of("resourceId", resource.getId());
    }

    @Override
    public Map<String, Object> getLearning(Long courseId, Long nodeId) {
        KnowledgeNode node = knowledgeNodeMapper.findById(nodeId);
        if (node == null || !node.getCourseId().equals(courseId)) {
            throw new BusinessException(404, "知识点不存在");
        }

        List<Resource> resources = resourceMapper.findByKnowledgeNodeId(courseId, nodeId);
        List<Map<String, Object>> quizRows = resourceMapper.findQuizzesByKnowledgeNodeId(courseId, nodeId);

        Map<String, Object> nodeMap = new LinkedHashMap<>();
        nodeMap.put("id", node.getId());
        nodeMap.put("name", node.getNodeName());
        nodeMap.put("description", node.getNodeDesc());

        List<Map<String, Object>> resourceList = resources.stream()
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", r.getId());
                    m.put("name", r.getResourceName());
                    m.put("type", r.getResourceType().toUpperCase());
                    m.put("url", r.getFileUrl());
                    return m;
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> quizList = quizRows.stream()
                .map(q -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("quizId", q.get("quiz_id"));
                    m.put("name", q.get("quiz_name"));
                    m.put("deadline", q.get("deadline"));
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("node", nodeMap);
        data.put("resources", resourceList);
        data.put("quizzes", quizList);

        return data;
    }

    @Override
    public Map<String, Object> listResources(Long courseId, Long userId, int page, int pageSize) {
        CourseMember member = courseMemberMapper.findByCourseIdAndUserId(courseId, userId);
        if (member == null) {
            throw new BusinessException(403, "你不是该课程的成员");
        }
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        int total = resourceMapper.countByCourseId(courseId);
        int offset = (page - 1) * pageSize;
        List<Resource> resources = resourceMapper.findResourcesByCourseId(courseId, offset, pageSize);

        // 批量查每个资源关联的节点 id
        List<Long> ids = resources.stream().map(Resource::getId).collect(Collectors.toList());
        Map<Long, List<Long>> nodeIdsMap = new HashMap<>();
        if (!ids.isEmpty()) {
            for (Map<String, Object> row : resourceMapper.findNodeIdsByResourceIds(ids)) {
                Long rid = ((Number) row.get("resource_id")).longValue();
                Long nid = ((Number) row.get("knowledge_node_id")).longValue();
                nodeIdsMap.computeIfAbsent(rid, k -> new ArrayList<>()).add(nid);
            }
        }

        List<Map<String, Object>> items = resources.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("name", r.getResourceName());
            m.put("resourceType", r.getResourceType());
            m.put("type", r.getResourceType().toUpperCase());
            m.put("url", r.getFileUrl());
            m.put("description", r.getDescription());
            m.put("nodeIds", nodeIdsMap.getOrDefault(r.getId(), Collections.emptyList()));
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("total", total);
        result.put("page", page);
        result.put("pageSize", pageSize);
        return result;
    }

    @Override
    public Map<String, Object> getNodeResources(Long nodeId, Long userId) {
        KnowledgeNode node = knowledgeNodeMapper.findById(nodeId);
        if (node == null) {
            throw new BusinessException(404, "知识点不存在");
        }
        Long courseId = node.getCourseId();

        CourseMember member = courseMemberMapper.findByCourseIdAndUserId(courseId, userId);
        if (member == null) {
            throw new BusinessException(403, "你不是该课程的成员");
        }

        List<Resource> resources = resourceMapper.findByKnowledgeNodeId(courseId, nodeId);

        // 批量查每个资源关联的节点 id
        List<Long> ids = resources.stream().map(Resource::getId).collect(Collectors.toList());
        Map<Long, List<Long>> nodeIdsMap = new HashMap<>();
        if (!ids.isEmpty()) {
            for (Map<String, Object> row : resourceMapper.findNodeIdsByResourceIds(ids)) {
                Long rid = ((Number) row.get("resource_id")).longValue();
                Long nid = ((Number) row.get("knowledge_node_id")).longValue();
                nodeIdsMap.computeIfAbsent(rid, k -> new ArrayList<>()).add(nid);
            }
        }

        Map<String, Object> nodeMap = new LinkedHashMap<>();
        nodeMap.put("id", node.getId());
        nodeMap.put("name", node.getNodeName());
        nodeMap.put("description", node.getNodeDesc());

        List<Map<String, Object>> resourceList = resources.stream()
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", r.getId());
                    m.put("name", r.getResourceName());
                    m.put("type", r.getResourceType().toUpperCase());
                    m.put("resourceType", r.getResourceType());
                    m.put("url", r.getFileUrl());
                    m.put("description", r.getDescription());
                    m.put("nodeIds", nodeIdsMap.getOrDefault(r.getId(), Collections.emptyList()));
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("node", nodeMap);
        data.put("resources", resourceList);
        return data;
    }

    @Override
    @Transactional
    public Map<String, Object> uploadFile (Long courseId, Long teacherId, MultipartFile file,
                                           String name, String resourceType, String description,
                                           String nodeIdsStr)
    {
        Long ownerId = courseMapper.findTeacherIdByCourseId(courseId);
        if (ownerId == null) {
            throw new BusinessException(404, "课程不存在");
        }
        if (!teacherId.equals(ownerId)) {
            throw new BusinessException(403, "你不是该课程的教师");
        }

        String url = minioStorageService.upload(file);
        String resourceName = (name == null || name.isBlank()) ? file.getOriginalFilename() : name;

        Resource resource = new Resource();
        resource.setCourseId(courseId);
        resource.setUploaderId(teacherId);
        resource.setResourceName(resourceName);
        resource.setResourceType(resourceType.toLowerCase());
        resource.setFileUrl(url);
        resource.setFileSize(file.getSize());
        resource.setDescription(description);

        resourceMapper.insert(resource);

        List<Long> nodeIds = parseNodeIds(nodeIdsStr);
        for (Long nodeId : nodeIds) {
            resourceMapper.bindKnowledgeNode(resource.getId(), nodeId);
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("resourceId", resource.getId());
        data.put("name", resource.getResourceName());
        data.put("resourceType", resource.getResourceType());
        data.put("type", resource.getResourceType().toUpperCase());
        data.put("url", resource.getFileUrl());
        data.put("nodeIds", nodeIds);
        return data;
    }

    @Override
    @Transactional
    public Map<String, Object> updateResource(Long resourceId, Long teacherId, Map<String, Object> body) {
        Resource resource = resourceMapper.findById(resourceId);
        if (resource == null) {
            throw new BusinessException(404, "资料不存在");
        }
        Long ownerId = courseMapper.findTeacherIdByCourseId(resource.getCourseId());
        if (ownerId == null) {
            throw new BusinessException(404, "课程不存在");
        }
        if (!teacherId.equals(ownerId)) {
            throw new BusinessException(403, "你不是该课程的教师");
        }

        resource.setResourceName((String) body.get("name"));
        resource.setResourceType(((String) body.get("resourceType")).toLowerCase());
        resource.setFileUrl((String) body.get("url"));
        resource.setDescription((String) body.get("description"));
        resourceMapper.update(resource);

        // 重建节点关联
        resourceMapper.deleteBindingsByResourceId(resourceId);
        Object nodeIdsObj = body.get("nodeIds");
        if (nodeIdsObj instanceof List<?> list) {
            for (Object item : list) {
                long nodeId = item instanceof Number ? ((Number) item).longValue()
                        : Long.parseLong(item.toString());
                resourceMapper.bindKnowledgeNode(resourceId, nodeId);
            }
        }

        return Map.of("resourceId", resourceId);
    }

    @Override
    @Transactional
    public void deleteResource(Long resourceId, Long teacherId) {
        Resource resource = resourceMapper.findById(resourceId);
        if (resource == null) {
            throw new BusinessException(404, "资料不存在");
        }
        Long ownerId = courseMapper.findTeacherIdByCourseId(resource.getCourseId());
        if (ownerId == null) {
            throw new BusinessException(404, "课程不存在");
        }
        if (!teacherId.equals(ownerId)) {
            throw new BusinessException(403, "你不是该课程的教师");
        }

        resourceMapper.deleteBindingsByResourceId(resourceId);
        resourceMapper.deleteById(resourceId);
    }

    private List<Long> parseNodeIds(String nodeIdsStr) {
        if (nodeIdsStr == null || nodeIdsStr.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(nodeIdsStr, new TypeReference<List<Long>>() {});
        } catch (Exception e) {
            throw new BusinessException(400, "nodeIds 格式错误");
        }
    }
}

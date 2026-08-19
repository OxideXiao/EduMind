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

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {

    private final ResourceMapper resourceMapper;
    private final KnowledgeNodeMapper knowledgeNodeMapper;

    @Override
    @Transactional
    public Map<String, Object> uploadResource(Long courseId, Long teacherId, Map<String, Object> body) {
        Resource resource = new Resource();
        resource.setCourseId(courseId);
        resource.setUploaderId(teacherId);
        resource.setResourceName((String) body.get("name"));
        resource.setResourceType(((String) body.get("type")).toLowerCase());
        resource.setFileUrl((String) body.get("url"));

        Object fileSize = body.get("fileSize");
        if (fileSize instanceof Number) {
            resource.setFileSize(((Number) fileSize).longValue());
        }
        Object duration = body.get("duration");
        if (duration instanceof Number) {
            resource.setDuration(((Number) duration).intValue());
        }
        resource.setDescription((String) body.get("description"));

        resourceMapper.insert(resource);

        Object nodeId = body.get("nodeId");
        if (nodeId != null) {
            long kid = nodeId instanceof Number ? ((Number) nodeId).longValue()
                                                 : Long.parseLong(nodeId.toString());
            resourceMapper.bindKnowledgeNode(resource.getId(), kid);
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
}

package com.example.smartteachingplatform.graph.service.impl;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.ExcelWriter;
import com.example.smartteachingplatform.common.exception.BusinessException;
import com.example.smartteachingplatform.course.mapper.CourseMapper;
import com.example.smartteachingplatform.graph.dto.KnowledgeImportPreviewResponse;
import com.example.smartteachingplatform.graph.mapper.KnowledgeNodeMapper;
import com.example.smartteachingplatform.graph.service.KnowledgeImportService;
import com.example.smartteachingplatform.graph.service.impl.KnowledgeImportSessionStore.ImportSession;
import com.example.smartteachingplatform.graph.service.impl.KnowledgeImportSessionStore.ImportedEdge;
import com.example.smartteachingplatform.graph.service.impl.KnowledgeImportSessionStore.ImportedNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KnowledgeImportServiceImpl implements KnowledgeImportService {
    private final CourseMapper courseMapper;
    private final KnowledgeNodeMapper knowledgeNodeMapper; // findByCode 查节点编码
    private final KnowledgeImportSessionStore sessionStore; // 缓存预览结果

    @Override
    public byte[] buildTemplate(Long courseId, Long teacherId) {
        // 鉴权：复用 CourseMapper.findTeacherIdByCourseId（404/403）
        Long ownerId = courseMapper.findTeacherIdByCourseId(courseId);
        if (ownerId == null) throw new BusinessException(404, "课程不存在");
        if (!ownerId.equals(teacherId)) throw new BusinessException(403, "仅本课程教师可操作");

        // 两个 Sheet 的表头（仅表头，无数据行）
        List<List<String>> nodesHead = Arrays.asList(
                Collections.singletonList("nodeCode"),
                Collections.singletonList("name"),
                Collections.singletonList("description"),
                Collections.singletonList("parentCode"),
                Collections.singletonList("orderNo"));
        List<List<String>> edgesHead = Arrays.asList(
                Collections.singletonList("fromCode"),
                Collections.singletonList("toCode"),
                Collections.singletonList("relationType"));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ExcelWriter writer = EasyExcel.write(out).build();
        writer.write(Collections.emptyList(),
                EasyExcel.writerSheet("nodes").head(nodesHead).build());
        writer.write(Collections.emptyList(),
                EasyExcel.writerSheet("edges").head(edgesHead).build());
        writer.finish();
        return out.toByteArray();
    }

    @Override
    public KnowledgeImportPreviewResponse preview(Long courseId, Long teacherId, MultipartFile file) {
        assertCourseTeacher(courseId, teacherId);

        List<Map<Integer, String>> nodesRaw;
        List<Map<Integer, String>> edgesRaw;
        try {
            nodesRaw = EasyExcel.read(file.getInputStream()).sheet(0).headRowNumber(0).doReadSync();
            edgesRaw = EasyExcel.read(file.getInputStream()).sheet(1).headRowNumber(0).doReadSync();
        } catch (Exception e) {
            throw new BusinessException(400, "文件解析失败，请确认包含 nodes、edges 两个 Sheet");
        }
        if (nodesRaw.isEmpty() || edgesRaw.isEmpty()) {
            throw new BusinessException(400, "缺少 nodes 或 edges Sheet");
        }

        Map<String, Integer> nodeCol = headerIndex(nodesRaw.get(0));
        Map<String, Integer> edgeCol = headerIndex(edgesRaw.get(0));

        KnowledgeImportPreviewResponse resp = new KnowledgeImportPreviewResponse();
        List<KnowledgeImportPreviewResponse.Issue> warnings = new ArrayList<>();
        List<KnowledgeImportPreviewResponse.Issue> errors = new ArrayList<>();
        List<ImportedNode> importedNodes = new ArrayList<>();
        List<ImportedEdge> importedEdges = new ArrayList<>();
        Set<String> seenCodes = new HashSet<>();      // 文件内 nodeCode 去重
        Set<String> fileCodes = new HashSet<>();      // 文件内所有 nodeCode
        Set<Integer> errorNodeRows = new HashSet<>();
        Set<Integer> errorEdgeRows = new HashSet<>();
        Map<String, Boolean> dbCodeCache = new HashMap<>();

        // ===== 校验 nodes =====
        for (int i = 1; i < nodesRaw.size(); i++) {
            Map<Integer, String> r = nodesRaw.get(i);
            int row = i + 1;
            String code = nvl(r.get(nodeCol.get("nodeCode")));
            String name = nvl(r.get(nodeCol.get("name")));
            String parent = nvl(r.get(nodeCol.get("parentCode")));
            String desc = nvl(r.get(nodeCol.get("description")));
            String orderNo = nvl(r.get(nodeCol.get("orderNo")));

            if (code.isEmpty()) {
                errors.add(issue(row, "nodeCode", "nodeCode 不能为空"));
                errorNodeRows.add(row);
                continue;
            }
            if (name.isEmpty()) {
                errors.add(issue(row, "name", "name 不能为空"));
                errorNodeRows.add(row);
            }
            if (!seenCodes.add(code)) {
                errors.add(issue(row, "nodeCode", "nodeCode 在文件内重复"));
                errorNodeRows.add(row);
                continue;
            }
            if (knowledgeNodeMapper.findByCode(courseId, code) != null) {
                warnings.add(issue(row, "nodeCode", "编码已存在，将覆盖"));
            }
            fileCodes.add(code);

            ImportedNode n = new ImportedNode();
            n.setRow(row);
            n.setNodeCode(code);
            n.setName(name);
            n.setDescription(desc.isEmpty() ? null : desc);
            n.setParentCode(parent.isEmpty() ? null : parent);
            n.setOrderNo(orderNo.isEmpty() ? 0 : Integer.parseInt(orderNo));
            importedNodes.add(n);
        }

        // ===== 校验 edges =====
        for (int i = 1; i < edgesRaw.size(); i++) {
            Map<Integer, String> r = edgesRaw.get(i);
            int row = i + 1;
            String from = nvl(r.get(edgeCol.get("fromCode")));
            String to = nvl(r.get(edgeCol.get("toCode")));
            String rel = nvl(r.get(edgeCol.get("relationType")));

            if (from.isEmpty()) {
                errors.add(issue(row, "fromCode", "fromCode 不能为空"));
                errorEdgeRows.add(row);
            }
            if (to.isEmpty()) {
                errors.add(issue(row, "toCode", "toCode 不能为空"));
                errorEdgeRows.add(row);
            }
            if (!"prerequisite".equals(rel) && !"dependency".equals(rel) && !"related".equals(rel)) {
                errors.add(issue(row, "relationType", "relationType 只能是 prerequisite/dependency/related"));
                errorEdgeRows.add(row);
            }

            ImportedEdge e = new ImportedEdge();
            e.setRow(row);
            e.setFromCode(from);
            e.setToCode(to);
            e.setRelationType(rel);
            importedEdges.add(e);
        }

        // ===== 存在性校验（parentCode / fromCode / toCode）=====
        for (ImportedNode n : importedNodes) {
            if (n.getParentCode() != null && !codeExists(courseId, n.getParentCode(), fileCodes, dbCodeCache)) {
                errors.add(issue(n.getRow(), "parentCode", "父节点不存在"));
                errorNodeRows.add(n.getRow());
            }
        }
        for (ImportedEdge e : importedEdges) {
            if (!e.getFromCode().isEmpty() && !codeExists(courseId, e.getFromCode(), fileCodes, dbCodeCache)) {
                errors.add(issue(e.getRow(), "fromCode", "fromCode 引用的节点不存在"));
                errorEdgeRows.add(e.getRow());
            }
            if (!e.getToCode().isEmpty() && !codeExists(courseId, e.getToCode(), fileCodes, dbCodeCache)) {
                errors.add(issue(e.getRow(), "toCode", "toCode 引用的节点不存在"));
                errorEdgeRows.add(e.getRow());
            }
        }

        // ===== 统计 =====
        resp.setTotalNodes(nodesRaw.size() - 1);
        resp.setTotalEdges(edgesRaw.size() - 1);
        resp.setValidNodes(resp.getTotalNodes() - errorNodeRows.size());
        resp.setValidEdges(resp.getTotalEdges() - errorEdgeRows.size());
        resp.setWarnings(warnings);
        resp.setErrors(errors);

        // ===== 缓存（只缓存无 error 的节点/边，供 §5.2 提交）=====
        List<ImportedNode> validNodeList = importedNodes.stream()
                .filter(n -> !errorNodeRows.contains(n.getRow())).collect(Collectors.toList());
        List<ImportedEdge> validEdgeList = importedEdges.stream()
                .filter(e -> !errorEdgeRows.contains(e.getRow())).collect(Collectors.toList());

        String token = "imp_" + UUID.randomUUID().toString().replace("-", "");
        ImportSession session = new ImportSession();
        session.setToken(token);
        session.setCourseId(courseId);
        session.setTeacherId(teacherId);
        session.setNodes(validNodeList);
        session.setEdges(validEdgeList);
        session.setCreatedAt(LocalDateTime.now());
        sessionStore.put(token, session);

        resp.setImportToken(token);
        return resp;
    }

    // ===== 辅助方法 =====
    private void assertCourseTeacher(Long courseId, Long teacherId) {
        Long ownerId = courseMapper.findTeacherIdByCourseId(courseId);
        if (ownerId == null) {
            throw new BusinessException(404, "课程不存在");
        }
        if (!ownerId.equals(teacherId)) {
            throw new BusinessException(403, "仅本课程教师可操作");
        }
    }

    private Map<String, Integer> headerIndex(Map<Integer, String> headerRow) {
        Map<String, Integer> map = new HashMap<>();
        for (Map.Entry<Integer, String> e : headerRow.entrySet()) {
            map.put(nvl(e.getValue()), e.getKey());
        }
        return map;
    }

    private boolean codeExists(Long courseId, String code, Set<String> fileCodes,
                               Map<String, Boolean> dbCodeCache) {
        if (fileCodes.contains(code)) return true;
        return dbCodeCache.computeIfAbsent(code,
                c -> knowledgeNodeMapper.findByCode(courseId, c) != null);
    }

    private KnowledgeImportPreviewResponse.Issue issue(int row, String field, String message) {
        KnowledgeImportPreviewResponse.Issue is = new KnowledgeImportPreviewResponse.Issue();
        is.setRow(row);
        is.setField(field);
        is.setMessage(message);
        return is;
    }

    private static String nvl(String s) {
        return s == null ? "" : s.trim();
    }
}

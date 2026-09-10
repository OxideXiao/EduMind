package com.example.smartteachingplatform.quiz.service.impl;

import com.alibaba.excel.EasyExcel;
import com.example.smartteachingplatform.common.exception.BusinessException;
import com.example.smartteachingplatform.course.entity.Course;
import com.example.smartteachingplatform.course.mapper.CourseMapper;
import com.example.smartteachingplatform.graph.entity.KnowledgeNode;
import com.example.smartteachingplatform.graph.mapper.KnowledgeNodeMapper;
import com.example.smartteachingplatform.quiz.dto.*;
import com.example.smartteachingplatform.quiz.entity.Question;
import com.example.smartteachingplatform.quiz.mapper.QuestionMapper;
import com.example.smartteachingplatform.quiz.service.QuestionImportService;
import com.example.smartteachingplatform.quiz.service.QuestionService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionImportServiceImpl implements QuestionImportService {

    private static final Set<String> VALID_TYPES = Set.of(
            "SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK", "SHORT_ANSWER");
    private static final Set<String> OPTION_TYPES = Set.of("SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE");

    private final QuestionMapper questionMapper;
    private final CourseMapper courseMapper;
    private final KnowledgeNodeMapper knowledgeNodeMapper;
    private final QuestionService questionService;
    private final ImportTokenStore tokenStore;

    // ────────── 模板下载 ──────────

    @Override
    public void downloadTemplate(Long courseId, Long userId, HttpServletResponse response) throws IOException {
        assertTeacher(courseId, userId);

        List<QuestionImportRow> sample = List.of(buildSampleRow());

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("utf-8");
        String fileName = URLEncoder.encode("题库导入模板.xlsx", StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        response.setHeader("Content-disposition", "attachment;filename*=utf-8''" + fileName);

        EasyExcel.write(response.getOutputStream(), QuestionImportRow.class)
                .sheet("题库")
                .doWrite(sample);
    }

    private QuestionImportRow buildSampleRow() {
        QuestionImportRow r = new QuestionImportRow();
        r.setQuestionCode("Q-IOC-001");
        r.setType("SINGLE_CHOICE");
        r.setStem("以下哪个是 Spring 核心特性？");
        r.setOptions("A.控制反转|B.垃圾回收");
        r.setAnswer("A");
        r.setAnalysis("IoC 是 Spring 核心");
        r.setDifficulty(2);
        return r;
    }

    // ────────── 预览 ──────────

    @Override
    public QuestionImportPreviewResponse preview(Long courseId, Long userId, MultipartFile file,
                                                 Long targetNodeId) throws IOException {
        assertTeacher(courseId, userId);

        // 节点下导入：校验目标节点属于本课程
        if (targetNodeId != null) {
            KnowledgeNode node = knowledgeNodeMapper.findById(targetNodeId);
            if (node == null || !node.getCourseId().equals(courseId)) {
                throw new BusinessException(400, "目标知识点节点不存在");
            }
        }

        List<QuestionImportRow> rawRows;
        try (var in = file.getInputStream()) {
            rawRows = EasyExcel.read(in).head(QuestionImportRow.class).sheet().doReadSync();
        }

        List<ImportTokenStore.ParsedRow> parsed = new ArrayList<>();
        int valid = 0, warning = 0, error = 0;

        for (int i = 0; i < rawRows.size(); i++) {
            QuestionImportRow raw = rawRows.get(i);
            int rowNumber = i + 2;   // 第 1 行是表头，数据从第 2 行开始
            List<String> messages = new ArrayList<>();
            String status = validateAndBuild(courseId, raw, messages);

            if ("VALID".equals(status)) valid++;
            else if ("WARNING".equals(status)) warning++;
            else error++;

            ImportTokenStore.ParsedRow pr = new ImportTokenStore.ParsedRow();
            pr.setRowNumber(rowNumber);
            pr.setStatus(status);
            pr.setMessages(messages);
            if (!"ERROR".equals(status)) {
                pr.setRequest(toRequest(raw));
            }
            parsed.add(pr);
        }

        String token = "imp_" + UUID.randomUUID().toString().replace("-", "");

        ImportTokenStore.Session session = new ImportTokenStore.Session();
        session.setCourseId(courseId);
        session.setTargetNodeId(targetNodeId);
        session.setRows(parsed);
        tokenStore.put(token, session);

        QuestionImportPreviewResponse resp = new QuestionImportPreviewResponse();
        resp.setImportToken(token);
        resp.setTotal(rawRows.size());
        resp.setValid(valid);
        resp.setWarningCount(warning);
        resp.setErrorCount(error);
        resp.setRows(parsed.stream().map(p -> {
            QuestionImportPreviewResponse.RowResult rr = new QuestionImportPreviewResponse.RowResult();
            rr.setRow(p.getRowNumber());
            rr.setStatus(p.getStatus());
            rr.setMessages(p.getMessages());
            return rr;
        }).collect(Collectors.toList()));
        return resp;
    }

    // ────────── 提交 ──────────

    @Override
    public QuestionImportCommitResponse commit(Long courseId, String importToken, Long userId) {
        assertTeacher(courseId, userId);

        ImportTokenStore.Session session = tokenStore.remove(importToken);
        if (session == null) throw new BusinessException(400, "导入令牌无效或已使用");

        int created = 0, updated = 0;
        List<QuestionImportCommitResponse.FailedRow> failed = new ArrayList<>();

        for (ImportTokenStore.ParsedRow pr : session.getRows()) {
            if ("ERROR".equals(pr.getStatus())) continue;

            try {
                QuestionCreateRequest req = pr.getRequest();
                // 节点下导入 → 全绑 targetNodeId；整课程导入 → 不绑
                req.setNodeIds(session.getTargetNodeId() != null
                        ? List.of(session.getTargetNodeId())
                        : null);

                Question existing = req.getQuestionCode() != null && !req.getQuestionCode().isBlank()
                        ? questionMapper.findByCourseIdAndCode(courseId, req.getQuestionCode())
                        : null;

                if (existing != null) {
                    questionService.updateQuestion(existing.getId(), userId, req);
                    updated++;
                } else {
                    questionService.createQuestion(courseId, userId, req);
                    created++;
                }
            } catch (Exception e) {
                QuestionImportCommitResponse.FailedRow fr = new QuestionImportCommitResponse.FailedRow();
                fr.setRow(pr.getRowNumber());
                fr.setReason(e.getMessage());
                failed.add(fr);
            }
        }

        QuestionImportCommitResponse resp = new QuestionImportCommitResponse();
        resp.setCreated(created);
        resp.setUpdated(updated);
        resp.setFailedRows(failed);
        return resp;
    }

    // ────────── 校验与转换 ──────────

    private String validateAndBuild(Long courseId, QuestionImportRow raw, List<String> messages) {
        boolean hasError = false, hasWarning = false;

        String type = raw.getType() == null ? null : raw.getType().trim().toUpperCase();
        if (type == null || !VALID_TYPES.contains(type)) {
            messages.add("题型不合法，应为 SINGLE_CHOICE/MULTIPLE_CHOICE/TRUE_FALSE/FILL_BLANK/SHORT_ANSWER");
            hasError = true;
        }
        if (raw.getStem() == null || raw.getStem().isBlank()) {
            messages.add("题干为空");
            hasError = true;
        }
        if (OPTION_TYPES.contains(type) && (raw.getOptions() == null || raw.getOptions().isBlank())) {
            messages.add("选择题必须有选项");
            hasError = true;
        } else if (OPTION_TYPES.contains(type)) {
            // 检测选项标签重复（否则 commit 时触发 uk_question_options_label 唯一约束）
            List<QuestionCreateRequest.OptionItem> opts = parseOptions(raw.getOptions(), raw.getAnswer());
            if (opts != null) {
                Set<String> labels = new HashSet<>();
                for (QuestionCreateRequest.OptionItem o : opts) {
                    if (o.getLabel() == null || !labels.add(o.getLabel().toUpperCase())) {
                        messages.add("选项标签重复或为空：" + o.getLabel());
                        hasError = true;
                        break;
                    }
                }
            }
        }
        if (raw.getDifficulty() != null && (raw.getDifficulty() < 1 || raw.getDifficulty() > 5)) {
            messages.add("难度须为 1-5");
            hasWarning = true;
        }
        if (raw.getQuestionCode() != null && !raw.getQuestionCode().isBlank()
                && questionMapper.findByCourseIdAndCode(courseId, raw.getQuestionCode()) != null) {
            messages.add("题号已存在，导入时将更新该题");
            hasWarning = true;
        }

        if (hasError) return "ERROR";
        if (hasWarning) return "WARNING";
        return "VALID";
    }

    private QuestionCreateRequest toRequest(QuestionImportRow raw) {
        QuestionCreateRequest req = new QuestionCreateRequest();
        req.setQuestionCode(blankToNull(raw.getQuestionCode()));
        req.setType(raw.getType());
        req.setStem(raw.getStem());
        req.setAnswer(raw.getAnswer());
        req.setAnalysis(raw.getAnalysis());
        req.setDifficulty(raw.getDifficulty());
        req.setOptions(parseOptions(raw.getOptions(), raw.getAnswer()));
        return req;
    }

    /** 选项合并列解析："A.控制反转|B.垃圾回收" → List<OptionItem>，并按答案标记 isCorrect */
    private List<QuestionCreateRequest.OptionItem> parseOptions(String optionsStr, String answer) {
        if (optionsStr == null || optionsStr.isBlank()) return null;
        Set<String> correctLabels = answer == null ? Collections.emptySet()
                : Arrays.stream(answer.split("[|,\\s]+"))
                        .map(String::trim).filter(s -> !s.isEmpty())
                        .map(String::toUpperCase).collect(Collectors.toSet());

        List<QuestionCreateRequest.OptionItem> list = new ArrayList<>();
        for (String part : optionsStr.split("\\|")) {
            String s = part.trim();
            if (s.isEmpty()) continue;
            int dot = s.indexOf('.');
            if (dot <= 0) continue;
            QuestionCreateRequest.OptionItem item = new QuestionCreateRequest.OptionItem();
            item.setLabel(s.substring(0, dot).trim());
            item.setContent(s.substring(dot + 1).trim());
            item.setIsCorrect(correctLabels.contains(item.getLabel().toUpperCase()));
            list.add(item);
        }
        return list.isEmpty() ? null : list;
    }

    private void assertTeacher(Long courseId, Long userId) {
        Course course = courseMapper.findById(courseId);
        if (course == null) throw new BusinessException(404, "课程不存在");
        if (!course.getTeacherId().equals(userId)) throw new BusinessException(403, "仅本课程教师可导入题库");
    }

    private String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}

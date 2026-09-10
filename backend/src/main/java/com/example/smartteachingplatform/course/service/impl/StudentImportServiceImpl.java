package com.example.smartteachingplatform.course.service.impl;

import com.alibaba.excel.EasyExcel;
import com.example.smartteachingplatform.auth.entity.User;
import com.example.smartteachingplatform.auth.mapper.UserMapper;
import com.example.smartteachingplatform.common.exception.BusinessException;
import com.example.smartteachingplatform.course.dto.PasswordResetResponse;
import com.example.smartteachingplatform.course.dto.StudentImportCommitResponse;
import com.example.smartteachingplatform.course.dto.StudentImportPreviewResponse;
import com.example.smartteachingplatform.course.entity.CourseMember;
import com.example.smartteachingplatform.course.mapper.CourseMapper;
import com.example.smartteachingplatform.course.mapper.CourseMemberMapper;
import com.example.smartteachingplatform.course.service.StudentImportService;
import com.example.smartteachingplatform.course.service.impl.CredentialExportStore.CredentialExport;
import com.example.smartteachingplatform.course.service.impl.CredentialExportStore.CredentialRow;
import com.example.smartteachingplatform.course.service.impl.StudentImportSessionStore.ImportSession;
import com.example.smartteachingplatform.course.service.impl.StudentImportSessionStore.ImportedRow;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
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
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentImportServiceImpl implements StudentImportService {

    private static final List<String> HEADERS =
            Arrays.asList("studentNo", "realName", "email", "phone", "className");

    private static final String SHEET_NAME = "学生名单";

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+$");
    private static final Pattern PHONE_PATTERN =
            Pattern.compile("^1\\d{10}$");

    private static final String PASSWORD_CHARS =
            "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final int PASSWORD_LENGTH = 8;

    private final CourseMapper courseMapper;
    private final CourseMemberMapper courseMemberMapper;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final StudentImportSessionStore sessionStore;
    private final CredentialExportStore credentialExportStore;

    @Override
    public byte[] buildTemplate(Long courseId, Long teacherId) {
        assertCourseTeacher(courseId, teacherId);

        List<List<String>> head = HEADERS.stream()
                .map(Collections::singletonList)
                .collect(Collectors.toList());

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        EasyExcel.write(out)
                .head(head)
                .sheet(SHEET_NAME)
                .doWrite(Collections.emptyList());

        return out.toByteArray();
    }

    @Override
    public StudentImportPreviewResponse preview(Long courseId, Long teacherId,
                                                MultipartFile file,
                                                String passwordMode, String defaultPassword) {
        assertCourseTeacher(courseId, teacherId);

        if (!"RANDOM".equals(passwordMode) && !"UNIFORM".equals(passwordMode)) {
            throw new BusinessException(400, "passwordMode 只能是 RANDOM 或 UNIFORM");
        }
        if ("UNIFORM".equals(passwordMode) && (defaultPassword == null || defaultPassword.isBlank())) {
            throw new BusinessException(400, "UNIFORM 模式下 defaultPassword 必填");
        }

        String ext = extractExtension(file.getOriginalFilename());
        List<Map<String, String>> dataRows;
        try {
            if ("csv".equalsIgnoreCase(ext)) {
                dataRows = parseCsv(file);
            } else if ("xlsx".equalsIgnoreCase(ext) || "xls".equalsIgnoreCase(ext)) {
                dataRows = parseExcel(file);
            } else {
                throw new BusinessException(400, "仅支持 xlsx、xls、csv 文件");
            }
        } catch (BusinessException e) {
            throw e;
        } catch (IOException e) {
            throw new BusinessException(400, "文件解析失败：" + e.getMessage());
        }

        StudentImportPreviewResponse resp = new StudentImportPreviewResponse();
        List<StudentImportPreviewResponse.RowResult> rowResults = new ArrayList<>();
        List<ImportedRow> toImport = new ArrayList<>();
        Set<String> seenStudentNo = new HashSet<>();

        int idx = 0;
        for (Map<String, String> r : dataRows) {
            int rowNum = idx + 2;
            idx++;
            String studentNo = r.getOrDefault("studentNo", "");
            String realName = r.getOrDefault("realName", "");
            String email = r.getOrDefault("email", "");
            String phone = r.getOrDefault("phone", "");
            String className = r.getOrDefault("className", "");

            List<String> messages = new ArrayList<>();
            if (studentNo.isEmpty()) {
                messages.add("学号为空");
            }
            if (realName.isEmpty()) {
                messages.add("姓名为空");
            }
            if (!email.isEmpty() && !EMAIL_PATTERN.matcher(email).matches()) {
                messages.add("邮箱格式不正确");
            }
            if (!phone.isEmpty() && !PHONE_PATTERN.matcher(phone).matches()) {
                messages.add("手机号格式不正确");
            }

            String status;
            if (!messages.isEmpty()) {
                status = "ERROR";
            } else if (!seenStudentNo.add(studentNo)) {
                status = "WARNING";
                messages.add("学号在文件内重复，提交时将跳过");
            } else {
                status = "VALID";
            }

            StudentImportPreviewResponse.RowResult rr = new StudentImportPreviewResponse.RowResult();
            rr.setRow(rowNum);
            rr.setStudentNo(studentNo);
            rr.setRealName(realName);
            rr.setStatus(status);
            rr.setMessages(messages);
            rowResults.add(rr);

            if ("VALID".equals(status)) {
                ImportedRow ir = new ImportedRow();
                ir.setRow(rowNum);
                ir.setStudentNo(studentNo);
                ir.setRealName(realName);
                ir.setEmail(email);
                ir.setPhone(phone);
                ir.setClassName(className);
                toImport.add(ir);
            }
        }

        int errorCount = 0;
        int warningCount = 0;
        for (StudentImportPreviewResponse.RowResult rr : rowResults) {
            if ("ERROR".equals(rr.getStatus())) {
                errorCount++;
            } else if ("WARNING".equals(rr.getStatus())) {
                warningCount++;
            }
        }
        resp.setTotal(rowResults.size());
        resp.setValid(rowResults.size() - errorCount - warningCount);
        resp.setWarningCount(warningCount);
        resp.setErrorCount(errorCount);
        resp.setRows(rowResults);

        String token = "imp_" + UUID.randomUUID().toString().replace("-", "");
        ImportSession session = new ImportSession();
        session.setToken(token);
        session.setCourseId(courseId);
        session.setTeacherId(teacherId);
        session.setPasswordMode(passwordMode);
        session.setDefaultPassword(defaultPassword);
        session.setRows(toImport);
        session.setCreatedAt(LocalDateTime.now());
        sessionStore.put(token, session);

        resp.setImportToken(token);
        return resp;
    }

    @Override
    public StudentImportCommitResponse commit(Long courseId, Long teacherId,
                                              String importToken, String duplicatePolicy) {
        assertCourseTeacher(courseId, teacherId);
        if (!"SKIP".equals(duplicatePolicy)) {
            throw new BusinessException(400, "duplicatePolicy 仅支持 SKIP");
        }

        ImportSession session = sessionStore.get(importToken);
        if (session == null) {
            throw new BusinessException(400, "importToken 无效或已过期");
        }
        if (!session.getCourseId().equals(courseId)) {
            throw new BusinessException(400, "importToken 与课程不匹配");
        }

        StudentImportCommitResponse resp = new StudentImportCommitResponse();
        List<StudentImportCommitResponse.FailedRow> failedRows = new ArrayList<>();
        List<CredentialRow> credentialRows = new ArrayList<>();
        int created = 0;
        int skipped = 0;

        for (ImportedRow r : session.getRows()) {
            try {
                if (userMapper.findByUserNo(r.getStudentNo()) != null) {
                    skipped++;
                    continue;
                }
                if (!r.getEmail().isEmpty() && userMapper.findByEmail(r.getEmail()) != null) {
                    skipped++;
                    continue;
                }

                String username = r.getEmail().isEmpty()
                        ? r.getStudentNo()
                        : r.getEmail().split("@")[0];
                String initialPassword = "RANDOM".equals(session.getPasswordMode())
                        ? randomPassword()
                        : session.getDefaultPassword();

                User user = new User();
                user.setUsername(username);
                user.setUserNo(r.getStudentNo());
                user.setRealName(r.getRealName());
                user.setEmail(r.getEmail().isEmpty() ? null : r.getEmail());
                user.setPhone(r.getPhone().isEmpty() ? null : r.getPhone());
                user.setPasswordHash(passwordEncoder.encode(initialPassword));
                userMapper.insertImportedStudent(user);
                userMapper.insertUserRole(user.getId(), "student");

                CourseMember member = new CourseMember();
                member.setCourseId(courseId);
                member.setUserId(user.getId());
                member.setMemberRole("student");
                courseMemberMapper.insert(member);

                created++;

                CredentialRow cr = new CredentialRow();
                cr.setStudentNo(r.getStudentNo());
                cr.setRealName(r.getRealName());
                cr.setUsername(username);
                cr.setInitialPassword(initialPassword);
                credentialRows.add(cr);
            } catch (Exception e) {
                StudentImportCommitResponse.FailedRow fr = new StudentImportCommitResponse.FailedRow();
                fr.setRow(r.getRow());
                fr.setStudentNo(r.getStudentNo());
                fr.setReason("创建失败：" + e.getMessage());
                failedRows.add(fr);
            }
        }

        String credToken = "cred_" + UUID.randomUUID().toString().replace("-", "");
        CredentialExport export = new CredentialExport();
        export.setToken(credToken);
        export.setTeacherId(teacherId);
        export.setRows(credentialRows);
        export.setCreatedAt(LocalDateTime.now());
        credentialExportStore.put(credToken, export);

        sessionStore.remove(importToken);

        resp.setCreated(created);
        resp.setJoined(created);
        resp.setSkipped(skipped);
        resp.setFailedRows(failedRows);
        resp.setCredentialExportToken(credToken);
        return resp;
    }

    @Override
    public byte[] buildCredentialExport(String token, Long teacherId) {
        CredentialExport export = credentialExportStore.get(token);
        if (export == null) {
            throw new BusinessException(404, "凭证不存在或已过期");
        }
        if (!export.getTeacherId().equals(teacherId)) {
            throw new BusinessException(403, "仅凭证生成者可下载");
        }

        List<List<String>> head = Arrays.asList(
                Collections.singletonList("studentNo"),
                Collections.singletonList("realName"),
                Collections.singletonList("username"),
                Collections.singletonList("initialPassword"));

        List<List<String>> data = export.getRows().stream()
                .map(r -> Arrays.asList(r.getStudentNo(), r.getRealName(),
                        r.getUsername(), r.getInitialPassword()))
                .collect(Collectors.toList());

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        EasyExcel.write(out).head(head).sheet("账号凭证").doWrite(data);

        credentialExportStore.remove(token);

        return out.toByteArray();
    }

    @Override
    public PasswordResetResponse resetPassword(Long courseId, Long teacherId,
                                               Long studentId, String passwordMode) {
        assertCourseTeacher(courseId, teacherId);

        if (!"RANDOM".equals(passwordMode)) {
            throw new BusinessException(400, "passwordMode 仅支持 RANDOM");
        }

        CourseMember member = courseMemberMapper.findByCourseIdAndUserId(courseId, studentId);
        if (member == null || !"student".equals(member.getMemberRole())) {
            throw new BusinessException(404, "学生不在本课程中");
        }

        User student = userMapper.findById(studentId);
        if (student == null) {
            throw new BusinessException(404, "学生不存在");
        }

        String newPassword = randomPassword();
        userMapper.resetPassword(studentId, passwordEncoder.encode(newPassword));

        CredentialRow cr = new CredentialRow();
        cr.setStudentNo(student.getUserNo());
        cr.setRealName(student.getRealName());
        cr.setUsername(student.getUsername());
        cr.setInitialPassword(newPassword);

        String credToken = "cred_" + UUID.randomUUID().toString().replace("-", "");
        CredentialExport export = new CredentialExport();
        export.setToken(credToken);
        export.setTeacherId(teacherId);
        export.setRows(Collections.singletonList(cr));
        export.setCreatedAt(LocalDateTime.now());
        credentialExportStore.put(credToken, export);

        PasswordResetResponse resp = new PasswordResetResponse();
        resp.setCredentialExportToken(credToken);
        return resp;
    }

    private String randomPassword() {
        SecureRandom rnd = new SecureRandom();
        StringBuilder sb = new StringBuilder(PASSWORD_LENGTH);
        for (int i = 0; i < PASSWORD_LENGTH; i++) {
            sb.append(PASSWORD_CHARS.charAt(rnd.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }

    private List<Map<String, String>> parseExcel(MultipartFile file) throws IOException {
        List<Map<Integer, String>> all = EasyExcel.read(file.getInputStream())
                .headRowNumber(0)
                .sheet().doReadSync();
        if (all.isEmpty()) {
            throw new BusinessException(400, "文件为空");
        }
        Map<Integer, String> header = all.get(0);
        Map<String, Integer> colIndex = new HashMap<>();
        for (Map.Entry<Integer, String> e : header.entrySet()) {
            colIndex.put(nvl(e.getValue()), e.getKey());
        }
        if (!colIndex.containsKey("studentNo") || !colIndex.containsKey("realName")) {
            throw new BusinessException(400, "缺少必填列表头：studentNo、realName");
        }
        List<Map<String, String>> rows = new ArrayList<>();
        for (int i = 1; i < all.size(); i++) {
            Map<Integer, String> rowMap = all.get(i);
            Map<String, String> row = new HashMap<>();
            for (String col : HEADERS) {
                Integer colIdx = colIndex.get(col);
                row.put(col, colIdx == null ? "" : nvl(rowMap.get(colIdx)));
            }
            rows.add(row);
        }
        return rows;
    }

    private List<Map<String, String>> parseCsv(MultipartFile file) throws IOException {
        try (Reader reader = new BufferedReader(new InputStreamReader(
                file.getInputStream(), StandardCharsets.UTF_8))) {
            CSVParser parser = CSVFormat.DEFAULT.builder()
                    .setHeader()
                    .setSkipHeaderRecord(true)
                    .setIgnoreEmptyLines(true)
                    .build()
                    .parse(reader);
            List<Map<String, String>> rows = new ArrayList<>();
            for (CSVRecord rec : parser) {
                Map<String, String> row = new HashMap<>();
                for (String col : HEADERS) {
                    row.put(col, rec.isMapped(col) ? nvl(rec.get(col)) : "");
                }
                rows.add(row);
            }
            return rows;
        }
    }

    private void assertCourseTeacher(Long courseId, Long teacherId) {
        Long ownerId = courseMapper.findTeacherIdByCourseId(courseId);
        if (ownerId == null) {
            throw new BusinessException(404, "课程不存在");
        }
        if (!ownerId.equals(teacherId)) {
            throw new BusinessException(403, "仅本课程教师可操作");
        }
    }

    private static String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1);
    }

    private static String nvl(String s) {
        return s == null ? "" : s.trim();
    }
}

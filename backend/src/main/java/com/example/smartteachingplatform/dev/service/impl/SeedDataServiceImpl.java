package com.example.smartteachingplatform.dev.service.impl;

import com.example.smartteachingplatform.course.entity.Course;
import com.example.smartteachingplatform.course.entity.CourseMember;
import com.example.smartteachingplatform.course.mapper.CourseMapper;
import com.example.smartteachingplatform.course.mapper.CourseMemberMapper;
import com.example.smartteachingplatform.dev.service.SeedDataService;
import com.example.smartteachingplatform.graph.entity.KnowledgeEdge;
import com.example.smartteachingplatform.graph.entity.KnowledgeNode;
import com.example.smartteachingplatform.graph.mapper.KnowledgeEdgeMapper;
import com.example.smartteachingplatform.graph.mapper.KnowledgeNodeMapper;
import com.example.smartteachingplatform.memory.mapper.StudentMemoryMapper;
import com.example.smartteachingplatform.notification.entity.Notification;
import com.example.smartteachingplatform.notification.mapper.NotificationMapper;
import com.example.smartteachingplatform.resource.entity.Resource;
import com.example.smartteachingplatform.resource.mapper.ResourceMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@Profile("dev")
@RequiredArgsConstructor
public class SeedDataServiceImpl implements SeedDataService {

    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    private final CourseMapper courseMapper;
    private final CourseMemberMapper courseMemberMapper;
    private final KnowledgeNodeMapper nodeMapper;
    private final KnowledgeEdgeMapper edgeMapper;
    private final ResourceMapper resourceMapper;
    private final StudentMemoryMapper memoryMapper;
    private final NotificationMapper notificationMapper;
    private final WebClient agentWebClient;

    // 用户 ID 常量
    private static final long TEACHER_ID = 2L;
    private static final long STUDENT1_ID = 101L;
    private static final long STUDENT2_ID = 102L;
    private static final long STUDENT3_ID = 103L;
    private static final long COURSE_ID = 1L;

    // 插入节点后构建的 name → id 映射
    private Map<String, Long> nodeNameToId;

    @Override
    @Transactional
    public Map<String, Object> seed() {
        log.info("========== Seed 数据开始写入 ==========");

        // ── 1. 幂等清理 ──
        cleanup();

        // ── 2. 写入用户 ──
        seedUsers();

        // ── 3. 写入课程 + 成员 ──
        seedCourse();

        // ── 4. 写入 35 个知识节点 ──
        seedNodes();

        // ── 5. 写入边关系 ──
        seedEdges();

        // ── 6. 写入资源 ──
        seedResources();

        // ── 7. 写入测验体系 ──
        seedQuizzes();

        // ── 8. 写入掌握度 ──
        seedMastery();

        // ── 9. 写入学生记忆 ──
        seedMemory();

        // ── 10. 写入学习日志 ──
        seedLogs();

        // ── 11. 写入通知 ──
        seedNotifications();

        log.info("========== Seed 数据写入完成 ==========");

        // 从数据库查询实际注册信息返回
        String teacherEmail = jdbc.queryForObject(
                "SELECT email FROM users WHERE id = ?", String.class, TEACHER_ID);
        List<String> studentEmails = jdbc.queryForList(
                "SELECT email FROM users WHERE id IN (?,?,?) ORDER BY id",
                String.class, STUDENT1_ID, STUDENT2_ID, STUDENT3_ID);
        String inviteCode = jdbc.queryForObject(
                "SELECT invite_code FROM courses WHERE id = ?", String.class, COURSE_ID);

        return Map.of(
                "courseId", COURSE_ID,
                "teacherEmail", teacherEmail != null ? teacherEmail : "",
                "studentEmails", studentEmails,
                "inviteCode", inviteCode != null ? inviteCode : ""
        );
    }

    @Override
    public Map<String, Object> runHeartbeat(Long courseId) {
        log.info("手动触发 Heartbeat，courseId={}", courseId);
        try {
            String uri = "/api/agent/heartbeat";
            if (courseId != null) {
                uri += "?course_id=" + courseId;
            }
            String result = agentWebClient
                    .post()
                    .uri(uri)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(120))
                    .onErrorResume(e -> {
                        log.error("手动 Heartbeat 调用失败: {}", e.getMessage());
                        return Mono.just("{\"error\": \"" + e.getMessage() + "\"}");
                    })
                    .block();
            log.info("手动 Heartbeat 完成: {}", result);
            return Map.of("status", "completed", "courseId", courseId, "result", result);
        } catch (Exception e) {
            log.error("手动 Heartbeat 异常: {}", e.getMessage());
            return Map.of("status", "failed", "courseId", courseId, "error", e.getMessage());
        }
    }

    // ================================================================
    // 私有方法
    // ================================================================

    /** 清理 course_id=1 的旧数据（子表→主表顺序） */
    private void cleanup() {
        log.info("清理旧种子数据...");
        jdbc.update("DELETE FROM quiz_answers       WHERE submission_id IN (SELECT id FROM quiz_submissions WHERE quiz_id IN (SELECT id FROM quizzes WHERE course_id=?))", COURSE_ID);
        jdbc.update("DELETE FROM quiz_submissions   WHERE quiz_id IN (SELECT id FROM quizzes WHERE course_id=?)", COURSE_ID);
        jdbc.update("DELETE FROM quiz_questions     WHERE quiz_id IN (SELECT id FROM quizzes WHERE course_id=?)", COURSE_ID);
        jdbc.update("DELETE FROM quizzes            WHERE course_id=?", COURSE_ID);
        jdbc.update("DELETE FROM question_options   WHERE question_id IN (SELECT id FROM questions WHERE course_id=?)", COURSE_ID);
        jdbc.update("DELETE FROM questions          WHERE course_id=?", COURSE_ID);
        jdbc.update("DELETE FROM resource_knowledge WHERE resource_id IN (SELECT id FROM resources WHERE course_id=?)", COURSE_ID);
        resourcesTableCleanup();
        jdbc.update("DELETE FROM learning_logs      WHERE course_id=?", COURSE_ID);
        jdbc.update("DELETE FROM mastery_history    WHERE course_id=?", COURSE_ID);
        jdbc.update("DELETE FROM knowledge_mastery  WHERE course_id=?", COURSE_ID);
        jdbc.update("DELETE FROM learning_plan_tasks WHERE plan_id IN (SELECT id FROM learning_plans WHERE course_id=?)", COURSE_ID);
        jdbc.update("DELETE FROM learning_plans     WHERE course_id=?", COURSE_ID);
        jdbc.update("DELETE FROM risk_events        WHERE course_id=?", COURSE_ID);
        notificationMapper.deleteByCourseId(COURSE_ID);
        memoryMapper.deleteByCourseId(COURSE_ID);
        edgeMapper.deleteByCourseId(COURSE_ID);
        nodeMapper.deleteByCourseId(COURSE_ID);
        jdbc.update("DELETE FROM course_members     WHERE course_id=?", COURSE_ID);
        jdbc.update("DELETE FROM course_invites     WHERE course_id=?", COURSE_ID);
        jdbc.update("DELETE FROM courses            WHERE id=?", COURSE_ID);
    }

    /** 清理 resources 表（使用 Mapper 不存在的 DELETE 操作，用 JdbcTemplate） */
    private void resourcesTableCleanup() {
        jdbc.update("DELETE FROM resources WHERE course_id=?", COURSE_ID);
    }

    // ── 读取 JSON 工具 ──
    private <T> T readJson(String path, TypeReference<T> typeRef) {
        try {
            ClassPathResource resource = new ClassPathResource("seed/" + path);
            try (InputStream is = resource.getInputStream()) {
                return objectMapper.readValue(is, objectMapper.getTypeFactory().constructType(typeRef));
            }
        } catch (Exception e) {
            throw new RuntimeException("读取种子文件失败: " + path, e);
        }
    }

    // ── 2. 写入用户 ──
    private void seedUsers() {
        log.info("写入演示用户...");
        List<Map<String, Object>> users = readJson("demo_users.json", new TypeReference<List<Map<String, Object>>>() {});

        for (Map<String, Object> u : users) {
            long id = ((Number) u.get("id")).longValue();
            String username = (String) u.get("username");
            String realName = (String) u.get("realName");
            String email = (String) u.get("email");
            String password = (String) u.get("password");
            String roleCode = (String) u.get("roleCode");
            String passwordHash = passwordEncoder.encode(password);

            // ON CONFLICT DO NOTHING 幂等
            jdbc.update("INSERT INTO users (id, username, password_hash, real_name, email, status, created_at, updated_at) " +
                    "VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW()) " +
                    "ON CONFLICT (id) DO NOTHING",
                    id, username, passwordHash, realName, email);

            // 写入角色关联
            jdbc.update("INSERT INTO user_roles (user_id, role_id) " +
                    "SELECT ?, id FROM roles WHERE role_code = ? " +
                    "ON CONFLICT DO NOTHING", id, roleCode);
        }
        // 确保序列不冲突
        jdbc.queryForObject("SELECT setval('users_id_seq', GREATEST(?, (SELECT COALESCE(MAX(id),1) FROM users)))", Long.class, 103L);
    }

    // ── 3. 写入课程 + 成员 ──
    private void seedCourse() {
        log.info("写入课程与成员...");
        Map<String, Object> data = readJson("demo_course.json", new TypeReference<Map<String, Object> >() {});

        @SuppressWarnings("unchecked")
        Map<String, Object> c = (Map<String, Object>) data.get("course");

        Course course = new Course();
        course.setId(COURSE_ID);
        course.setCourseName((String) c.get("courseName"));
        course.setSemester((String) c.get("semester"));
        course.setDescription((String) c.get("description"));
        course.setTeacherId(((Number) c.get("teacherId")).longValue());
        course.setInviteCode((String) c.get("inviteCode"));

        // 用 JdbcTemplate 直接 insert（支持指定 id）
        jdbc.update("INSERT INTO courses (id, course_name, semester, description, teacher_id, invite_code, status, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), NOW()) " +
                "ON CONFLICT (id) DO NOTHING",
                course.getId(), course.getCourseName(), course.getSemester(),
                course.getDescription(), course.getTeacherId(), course.getInviteCode());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> members = (List<Map<String, Object>>) data.get("members");
        for (Map<String, Object> m : members) {
            jdbc.update("INSERT INTO course_members (course_id, user_id, member_role, joined_at, status) " +
                    "VALUES (?, ?, ?, NOW(), 'active') " +
                    "ON CONFLICT (course_id, user_id) DO NOTHING",
                    COURSE_ID,
                    ((Number) m.get("userId")).longValue(),
                    m.get("memberRole"));
        }
    }

    // ── 4. 写入 35 个节点 ──
    private void seedNodes() {
        log.info("写入知识节点...");
        nodeNameToId = new LinkedHashMap<>();

        List<Map<String, Object>> nodes = readJson("demo_nodes.json", new TypeReference<List<Map<String, Object>>>() {});

        for (Map<String, Object> n : nodes) {
            KnowledgeNode node = new KnowledgeNode();
            node.setCourseId(COURSE_ID);
            node.setNodeName((String) n.get("nodeName"));
            node.setNodeDesc((String) n.get("nodeDesc"));
            node.setDifficulty((Integer) n.get("difficulty"));
            node.setSortOrder((Integer) n.get("sortOrder"));
            node.setXPosition(BigDecimal.valueOf(((Number) n.get("x")).doubleValue()));
            node.setYPosition(BigDecimal.valueOf(((Number) n.get("y")).doubleValue()));
            node.setStatus("active");

            nodeMapper.insert(node);
            nodeNameToId.put(node.getNodeName(), node.getId());
        }

        log.info("节点写入完成，共 {} 个，nameToId 映射已构建", nodeNameToId.size());
    }

    // ── 5. 写入边关系 ──
    private void seedEdges() {
        log.info("写入边关系...");
        List<Map<String, Object>> relations = readJson("demo_relations.json", new TypeReference<List<Map<String, Object>>>() {});
        int count = 0;

        for (Map<String, Object> r : relations) {
            String from = (String) r.get("fromNodeName");
            String to = (String) r.get("toNodeName");
            String type = (String) r.get("relationType");

            Long fromId = nodeNameToId.get(from);
            Long toId = nodeNameToId.get(to);

            if (fromId == null || toId == null) {
                log.warn("边关系找不到节点: {} → {} (跳过)", from, to);
                continue;
            }

            KnowledgeEdge edge = new KnowledgeEdge();
            edge.setCourseId(COURSE_ID);
            edge.setSourceNodeId(fromId);
            edge.setTargetNodeId(toId);
            edge.setRelationType(type);
            edge.setWeight(BigDecimal.ONE);

            edgeMapper.insert(edge);
            count++;
        }

        log.info("边关系写入完成，共 {} 条", count);
    }

    // ── 6. 写入资源 ──
    private void seedResources() {
        log.info("写入教学资源...");
        List<Map<String, Object>> resources = readJson("demo_resources.json", new TypeReference<List<Map<String, Object>>>() {});

        for (Map<String, Object> r : resources) {
            String nodeKey = (String) r.get("nodeKey");
            Long nodeId = nodeNameToId.get(nodeKey);
            if (nodeId == null) {
                log.warn("资源绑定的节点不存在: {} (跳过)", nodeKey);
                continue;
            }

            Resource res = new Resource();
            res.setCourseId(COURSE_ID);
            res.setUploaderId(TEACHER_ID);
            res.setResourceName((String) r.get("resourceName"));
            res.setResourceType((String) r.get("resourceType"));
            res.setFileUrl((String) r.get("fileUrl"));
            res.setDescription((String) r.get("description"));

            resourceMapper.insert(res);
            resourceMapper.bindKnowledgeNode(res.getId(), nodeId);
        }
    }

    // ── 7. 写入测验体系 ──
    private void seedQuizzes() {
        log.info("写入测验、题目与提交记录...");
        Map<String, Object> data = readJson("demo_quizzes.json", new TypeReference<Map<String, Object> >() {});

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> quizzes = (List<Map<String, Object>>) data.get("quizzes");

        List<Long> quizIds = new ArrayList<>();

        for (int qi = 0; qi < quizzes.size(); qi++) {
            @SuppressWarnings("unchecked")
            Map<String, Object> quiz = quizzes.get(qi);
            String title = (String) quiz.get("title");

            // 插入测验（每题 10 分）
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) quiz.get("questions");
            java.math.BigDecimal totalScore = java.math.BigDecimal.valueOf(questions.size() * 10);
            jdbc.update("INSERT INTO quizzes (course_id, title, total_score, created_by, status, created_at, updated_at) " +
                    "VALUES (?, ?, ?, ?, 'published', NOW(), NOW())", COURSE_ID, title, totalScore, TEACHER_ID);
            Long quizId = jdbc.queryForObject("SELECT currval('quizzes_id_seq')", Long.class);
            quizIds.add(quizId);

            // 插入题目 + 选项 + 绑定测验
            int sortOrder = 0;
            for (Map<String, Object> q : questions) {
                String stem = (String) q.get("stem");
                String type = (String) q.get("type");
                int difficulty = (Integer) q.get("difficulty");
                String nodeKey = (String) q.get("nodeKey");
                String answer = (String) q.get("answer");
                String analysis = (String) q.get("analysis");

                Long nodeId = nodeNameToId.get(nodeKey);

                // 插入题目
                jdbc.update("INSERT INTO questions (course_id, knowledge_node_id, question_type, stem, answer, analysis, difficulty, created_by, created_at, updated_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())", COURSE_ID, nodeId, type, stem, answer, analysis, difficulty, TEACHER_ID);
                Long questionId = jdbc.queryForObject("SELECT currval('questions_id_seq')", Long.class);

                // 插入选项
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> options = (List<Map<String, Object>>) q.get("options");
                for (Map<String, Object> opt : options) {
                    jdbc.update("INSERT INTO question_options (question_id, option_label, option_content, is_correct) " +
                            "VALUES (?, ?, ?, ?)", questionId, opt.get("label"), opt.get("content"),
                            Boolean.TRUE.equals(opt.get("isCorrect")) ? 1 : 0);
                }

                // 绑定测验-题目
                jdbc.update("INSERT INTO quiz_questions (quiz_id, question_id, score, sort_order) " +
                        "VALUES (?, ?, 10.00, ?)", quizId, questionId, sortOrder++);
            }
        }

        // 写入提交记录
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> submissions = (List<Map<String, Object>>) data.get("submissions");
        for (Map<String, Object> sub : submissions) {
            int quizIndex = (Integer) sub.get("quizIndex");
            long studentId = ((Number) sub.get("studentId")).longValue();
            double totalScore = ((Number) sub.get("totalScore")).doubleValue();
            double correctRate = ((Number) sub.get("correctRate")).doubleValue();

            Long quizId = quizIds.get(quizIndex);

            jdbc.update("INSERT INTO quiz_submissions (quiz_id, student_id, attempt_no, submit_time, total_score, correct_rate, status) " +
                    "VALUES (?, ?, 1, NOW() - INTERVAL '1 day', ?, ?, 'submitted')", quizId, studentId, totalScore, correctRate);
        }
    }

    // ── 8. 写入掌握度 ──
    private void seedMastery() {
        log.info("写入掌握度数据...");
        Map<String, Object> data = readJson("demo_mastery.json", new TypeReference<Map<String, Object> >() {});

        @SuppressWarnings("unchecked")
        Map<String, Map<String, Integer>> students = (Map<String, Map<String, Integer>>) data.get("students");

        int count = 0;
        for (Map.Entry<String, Map<String, Integer>> entry : students.entrySet()) {
            long studentId = Long.parseLong(entry.getKey());

            for (Map.Entry<String, Integer> nodeEntry : entry.getValue().entrySet()) {
                String nodeName = nodeEntry.getKey();
                int score = nodeEntry.getValue();

                Long nodeId = nodeNameToId.get(nodeName);
                if (nodeId == null) {
                    log.warn("掌握度找不到节点: {}", nodeName);
                    continue;
                }

                String level;
                if (score >= 80) level = "green";
                else if (score >= 60) level = "yellow";
                else if (score > 0) level = "red";
                else level = "gray";

                jdbc.update("INSERT INTO knowledge_mastery (course_id, student_id, knowledge_node_id, mastery_score, mastery_level, risk_flag, updated_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, NOW()) " +
                        "ON CONFLICT (course_id, student_id, knowledge_node_id) DO UPDATE SET mastery_score = EXCLUDED.mastery_score, mastery_level = EXCLUDED.mastery_level",
                        COURSE_ID, studentId, nodeId, BigDecimal.valueOf(score), level, score < 40 ? 1 : 0);
                count++;
            }
        }

        log.info("掌握度写入完成，共 {} 条", count);
    }

    // ── 9. 写入学生记忆 ──
    private void seedMemory() {
        log.info("写入学生记忆...");
        List<Map<String, Object>> memories = readJson("demo_memory.json", new TypeReference<List<Map<String, Object>>>() {});

        for (Map<String, Object> mem : memories) {
            long studentId = ((Number) mem.get("studentId")).longValue();
            String json;
            try {
                json = objectMapper.writeValueAsString(mem.get("memoryJson"));
            } catch (Exception e) {
                log.warn("序列化记忆 JSON 失败: {}", e.getMessage());
                continue;
            }
            memoryMapper.upsert(studentId, COURSE_ID, json);
        }
    }

    // ── 10. 写入学习日志 ──
    private void seedLogs() {
        log.info("写入学习日志...");
        List<Map<String, Object>> logs = readJson("demo_logs.json", new TypeReference<List<Map<String, Object>>>() {});

        for (Map<String, Object> logEntry : logs) {
            long studentId = ((Number) logEntry.get("studentId")).longValue();
            String actionType = (String) logEntry.get("actionType");
            int daysAgo = (Integer) logEntry.get("daysAgo");
            String nodeKey = (String) logEntry.get("nodeKey");

            Long nodeId = nodeKey != null ? nodeNameToId.get(nodeKey) : null;

            jdbc.update("INSERT INTO learning_logs (course_id, student_id, knowledge_node_id, action_type, duration_seconds, created_at) " +
                    "VALUES (?, ?, ?, ?, ?, NOW() - (? || ' days')::INTERVAL)",
                    COURSE_ID, studentId, nodeId, actionType, 600, String.valueOf(daysAgo));
        }
    }

    // ── 11. 写入通知 ──
    private void seedNotifications() {
        log.info("写入通知...");

        Notification n1 = new Notification();
        n1.setReceiverId(STUDENT3_ID);
        n1.setCourseId(COURSE_ID);
        n1.setNotificationType("warning");
        n1.setTitle("学习预警");
        n1.setContent("你在「动态规划」「二叉树遍历」「贪心算法」等多项知识点上掌握度偏低，请尽快开始学习！系统建议从最基础的二叉树开始补课。");
        n1.setIsRead(0);
        notificationMapper.insert(n1);

        Notification n2 = new Notification();
        n2.setReceiverId(STUDENT3_ID);
        n2.setCourseId(COURSE_ID);
        n2.setNotificationType("reminder");
        n2.setTitle("连续未登录提醒");
        n2.setContent("你已经连续5天未登录，建议每天至少登录学习一次，保持良好的学习节奏。");
        n2.setIsRead(0);
        notificationMapper.insert(n2);
    }
}

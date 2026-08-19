# 后端模块详细设计（Module Design）

| 项目 | 内容 |
|------|------|
| 文档版本 | v2.0 |
| 状态 | **全部模块已实现** |
| 负责人 | Dev 3、Dev 4 |
| 上级文档 | architecture.md §5 |
| 接口契约 | api-spec.md |
| Agent 协作 | design/agent-module.md §8 |

---

## 1. 包结构总览

```
com.example.smartteachingplatform
├── SmartTeachingPlatformApplication.java    ← @SpringBootApplication + @MapperScan + @EnableScheduling
│
├── common/                                  # 公共基础设施
│   ├── config/       SecurityConfig / WebClientConfig
│   ├── security/     JwtTokenProvider / JwtAuthFilter / JwtAuthEntryPoint
│   │                 InternalTokenAuthenticationFilter / CustomUserDetails / CustomUserDetailsService
│   ├── exception/    GlobalExceptionHandler / BusinessException / ErrorCode
│   ├── response/     Result / PageResult
│   └── util/         SecurityUtils / InviteCodeGenerator
│
├── auth/             # 注册、登录、JWT
├── course/           # 课程 CRUD、邀请码、成员管理
├── graph/            # 知识图谱（学生/教师视图）
├── resource/         # 教学资源上传
├── quiz/             # 题库、组卷、提交、评分、掌握度更新
├── mastery/          # 掌握度（内部服务层，无独立端点）
├── analytics/        # 学情仪表盘、学习轨迹、每日数据
├── notification/     # 通知 CRUD + 内部创建
├── memory/           # 学生记忆（Agent 读写）
├── agent/            # Agent 代理层（Spring → Agent Service）
├── learningplan/     # 学习计划查询 + 内部创建
├── scheduler/        # @Scheduled 定时任务
└── dev/              # 开发辅助（Seed 数据 / 手动 Heartbeat）
```

---

## 2. 模块职责与接口映射

### 2.1 auth — 认证模块

| 类 | 职责 |
|----|------|
| `entity/User.java` | 映射 `users` 表 |
| `mapper/UserMapper.java` | @Select/@Insert 查插用户、角色关联 |
| `service/AuthService.java` | 接口 |
| `service/impl/AuthServiceImpl.java` | 注册（BCrypt + JWT）、登录、个人信息 |
| `controller/AuthController.java` | REST 端点 |

| 端点 | 方法 | 权限 |
|------|------|------|
| `/api/auth/register` | POST | 公开 |
| `/api/auth/login` | POST | 公开 |
| `/api/auth/me` | GET | 已登录 |

**关键实现细节**：
- 注册时自动分配角色（`user_roles` 表插入）
- JWT 中携带 userId + role，过期 3 天
- 密码 BCrypt 加密

---

### 2.2 course — 课程与成员

| 类 | 职责 |
|----|------|
| `entity/Course.java` | 映射 `courses` 表 |
| `entity/CourseMember.java` | 映射 `course_members` 表 |
| `mapper/CourseMapper.java` | 课程 CRUD + JOIN 查询 |
| `mapper/CourseMemberMapper.java` | 成员增删查 |
| `service/CourseServiceImpl.java` | 创建课程、加入课程、成员列表 |
| `controller/CourseController.java` | REST 端点 |

| 端点 | 方法 | 权限 |
|------|------|------|
| `/api/courses` | POST | TEACHER |
| `/api/courses` | GET | 已登录（返回我的课程列表） |
| `/api/courses/{courseId}/join` | POST | STUDENT |
| `/api/courses/{courseId}/members` | GET | TEACHER（本课程） |

**关键实现细节**：
- `createCourse`：@Transactional 插入课程 + 教师作为 member
- 邀请码生成：SecureRandom 6 位字符（排除 0/O/1/I），DB 唯一性校验
- `joinByInviteCode`：验证邀请码匹配，防重复加入
- `getMembers`：服务层校验请求者为本课程教师（防越权）

---

### 2.3 graph — 知识图谱

| 类 | 职责 |
|----|------|
| `entity/KnowledgeNode.java` | 映射 `knowledge_nodes` 表 |
| `entity/KnowledgeEdge.java` | 映射 `knowledge_edges` 表 |
| `mapper/KnowledgeNodeMapper.java` | 节点查询、插入 |
| `mapper/KnowledgeEdgeMapper.java` | 边查询、插入 |
| `controller/KnowledgeGraphController.java` | REST 端点 |
| `service/KnowledgeGraphService.java` | 接口 |
| `service/impl/KnowledgeGraphServiceImpl.java` | 图谱组装逻辑 |

| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/courses/{courseId}/graph` | GET | 课程成员 | `?role=student\|teacher` |
| `/api/courses/{courseId}/students/{studentId}/graph` | GET | TEACHER（下钻）/ STUDENT（仅本人） | 个人掌握度视图 |

**接口约定（来自 api-spec.md §4）**：

| 字段 | 学生视图 | 教师视图 |
|------|----------|----------|
| `masteryScore` | 当前学生该节点掌握度 0–100 | 全班平均掌握度 0–100 |
| `masteryLevel` | GREEN / YELLOW / RED / GRAY | 同左 |
| `isRecommended` | 推荐下一节点 | false |
| `isWeakTop` | false | 是否 Top5 薄弱 |

**masteryLevel 规则**：GRAY=0, RED=1–59, YELLOW=60–79, GREEN=≥80

**数据来源**：`knowledge_nodes` + `knowledge_edges` + `knowledge_mastery`（聚合）

---

### 2.4 resource — 教学资源

| 类 | 职责 |
|----|------|
| `entity/Resource.java` | 映射 `resources` 表 |
| `mapper/ResourceMapper.java` | 资源 CRUD + 知识点绑定 |
| `controller/ResourceController.java` | REST 端点 |
| `service/ResourceService.java` | 接口 |
| `service/impl/ResourceServiceImpl.java` | 上传逻辑 |

| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/courses/{courseId}/resources` | POST | TEACHER | 上传资源（MinIO） |
| `/api/courses/{courseId}/nodes/{nodeId}/learning` | GET | STUDENT | 获取节点资源+测验列表 |

**数据来源**：`resources` + `resource_knowledge`（绑定知识点）

---

### 2.5 quiz — 题库与测验

| 类 | 职责 |
|----|------|
| `entity/Question.java` | 映射 `questions` 表 |
| `entity/QuestionOption.java` | 映射 `question_options` 表 |
| `entity/Quiz.java` | 映射 `quizzes` 表 |
| `entity/QuizSubmission.java` | 映射 `quiz_submissions` 表 |
| `entity/QuizAnswer.java` | 映射 `quiz_answers` 表 |
| `entity/KnowledgeMastery.java` | 映射 `knowledge_mastery` 表 |
| `mapper/QuestionMapper.java` | 题目 + 选项 CRUD |
| `mapper/QuizMapper.java` | 测验 CRUD + 组卷 |
| `mapper/SubmissionMapper.java` | 提交、答案、掌握度、学习日志写入 |
| `controller/QuizController.java` | REST 端点 |
| `service/QuizService.java` | 接口 |
| `service/impl/QuizServiceImpl.java` | 组卷、提交、自动评分、掌握度更新 |
| `dto/QuestionCreateRequest.java` | 创建题目请求 |
| `dto/QuizCreateRequest.java` | 创建测验请求 |
| `dto/QuizDetailResponse.java` | 测验详情（不含答案） |
| `dto/SubmitRequest.java` | 提交答案请求 |
| `dto/SubmitResultResponse.java` | 提交结果 + 掌握度变化 |

| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/courses/{courseId}/questions` | POST | TEACHER | 创建题目（含选项） |
| `/api/courses/{courseId}/quizzes` | POST | TEACHER | 创建测验（组卷） |
| `/api/quizzes/{quizId}` | GET | STUDENT | 获取测验（不含答案） |
| `/api/quizzes/{quizId}/submit` | POST | STUDENT | 提交答案 |

**提交副作用**（api-spec §5）：
1. 逐题自动评分（single/multiple/judge/blank）
2. 写入 `quiz_submissions` + `quiz_answers`
3. 更新 `knowledge_mastery`（公式：`新分×0.6 + 历史均分×0.4`）
4. 写入 `mastery_history` 变更记录
5. 写入 `learning_logs`（action_type=finish_quiz）
6. 若某节点 delta ≤ -15，异步调用 Agent `POST /api/agent/reminder`

**数据来源**：`questions` + `question_options` + `quizzes` + `quiz_questions` + `quiz_submissions` + `quiz_answers`

---

### 2.6 mastery — 掌握度

掌握度作为**内部服务层**，计算与持久化逻辑集成在 quiz 模块的 `SubmissionMapper` 和 `QuizServiceImpl` 中，不提供独立 REST 端点。掌握度数据通过以下接口对外暴露：

| 接口 | 提供形式 |
|------|---------|
| `GET /api/courses/{courseId}/graph` | 图谱节点中的 `masteryScore` / `masteryLevel` |
| `POST /api/quizzes/{quizId}/submit` | 返回 `masteryUpdates` 数组 |
| `GET /api/analytics/daily` | `knowledge_mastery` 字段（0–1 浮点） |

**数据来源**：`knowledge_mastery` + `mastery_history`

**计算规则**：
- Spring/前端用 **0–100** 整数
- 调 Agent 时转换为 **0–1** 浮点：`ratio = score / 100`
- 更新公式：`新 mastery = 本次得分 × 0.6 + 历史 mastery × 0.4`

---

### 2.7 analytics — 学情分析

| 类 | 职责 |
|----|------|
| `controller/AnalyticsController.java` | REST 端点 |
| `service/AnalyticsService.java` | 接口 |
| `service/impl/AnalyticsServiceImpl.java` | 聚合查询 |
| `mapper/AnalyticsMapper.java` | 仪表盘 + 轨迹 + daily 查询 |
| `dto/DashboardResponse.java` | 仪表盘响应 |
| `dto/TrajectoryResponse.java` | 学习轨迹响应 |
| `dto/DailyStatsResponse.java` | 每日学情响应 |

| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/courses/{courseId}/dashboard` | GET | TEACHER | 仪表盘 |
| `/api/courses/{courseId}/students/{studentId}/trajectory` | GET | TEACHER / 本人 | 学习轨迹 |
| `/api/analytics/daily` | GET | X-Internal-Token | Agent 每日数据 |

**dashboard 指标计算**（api-spec §6）：

| 指标 | 公式 |
|------|------|
| 完成率 | 已完成≥1次测验人数 / 选课学生数 |
| 活跃度 | 近7天有 learning_logs 记录的学生比例 |
| 风险学生 | 超3天无学习记录 OR 课程平均掌握度<40 |

**数据来源**：`knowledge_mastery` + `course_members` + `learning_logs` + `quiz_submissions`

---

### 2.8 notification — 通知

| 类 | 职责 |
|----|------|
| `entity/Notification.java` | 映射 `notifications` 表 |
| `controller/NotificationController.java` | REST 端点 |
| `service/NotificationService.java` | 接口 |
| `service/impl/NotificationServiceImpl.java` | 列表、已读、内部创建 |
| `mapper/NotificationMapper.java` | 查询 + 写入 |
| `dto/NotificationResponse.java` | 通知响应 |

| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/notifications` | GET | 已登录 | `?isRead=false&page=1&size=20`，返回 `unreadCount` + `items` |
| `/api/notifications/{notificationId}/read` | PATCH | 已登录 | 标记已读 |
| `/api/notifications/read-all` | PATCH | 已登录 | 全部已读 |
| `/api/notifications` | POST | X-Internal-Token | Agent 内部创建通知 |

**type 枚举**（API）：REMINDER / PLAN / SYSTEM / ADVICE
**DB 存储**：reminder / report / warning / suggestion（自动映射）

**数据来源**：`notifications` 表

---

### 2.9 memory — 学生记忆

| 类 | 职责 |
|----|------|
| `entity/StudentMemory.java` | 映射 `student_memory` 表 |
| `controller/MemoryController.java` | REST 端点 |
| `service/MemoryService.java` | 接口 |
| `service/impl/MemoryServiceImpl.java` | 记忆读写 |
| `mapper/StudentMemoryMapper.java` | upsert + 查询 |
| `dto/MemorySetRequest.java` | PUT 请求体 |
| `dto/MemoryGetResponse.java` | GET 响应体 |

| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/students/{studentId}/memory` | GET | X-Internal-Token | `?course_id=` 必填 |
| `/api/students/{studentId}/memory` | PUT | X-Internal-Token | `?course_id=` 必填 |

**数据来源**：`student_memory` 表

**安全**：通过 `InternalTokenAuthenticationFilter` 校验 X-Internal-Token + IP 白名单，前端不可直接调用。

---

### 2.10 agent — Agent 代理层

| 类 | 职责 |
|----|------|
| `controller/AgentController.java` | REST 端点 |
| `service/AgentService.java` | 接口 |
| `service/impl/AgentServiceImpl.java` | WebClient 调用 Agent Service |
| `dto/AgentApiResponse.java` | Agent 通用响应包装 |
| `dto/LearningPlanResponse.java` | 学习计划响应 |
| `dto/TeachingSuggestionResponse.java` | 教学建议响应 |
| `dto/TriggerReminderRequest.java` | 提醒触发请求 |
| `dto/HeartbeatStatusResponse.java` | Heartbeat 状态响应 |

| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/courses/{courseId}/agent/learning-plan` | POST | STUDENT | 组装 mastery+memory → 调 Agent → 返回 |
| `/api/courses/{courseId}/agent/teaching-suggestion` | POST | TEACHER | 取薄弱点 → 调 Agent → 返回建议 |
| `/api/courses/{courseId}/agent/trigger-reminder` | POST | TEACHER | 调 Agent reminder → 写通知 |
| `/api/agent/heartbeat/status` | GET | TEACHER / ADMIN | Heartbeat 状态 |

**Agent Service 调用（api-spec §10）**：

| Spring → Agent | 说明 |
|----------------|------|
| `GET /health` | 健康检查 |
| `POST /api/agent/heartbeat` | 执行完整 Heartbeat |
| `POST /api/agent/learning-plan` | 生成学习计划 |
| `POST /api/agent/reminder` | 生成提醒通知 |
| `POST /api/agent/memory-update` | 更新学生记忆 |
| `POST /api/agent/teaching-suggestion` | 教学建议 |

**超时**：Agent 代理接口 30s 超时；失败返回友好错误信息。

**数据转换**：Spring 层负责 mastery 0–100 ↔ 0–1 转换。

---

### 2.11 learning-plan — 学习计划

| 类 | 职责 |
|----|------|
| `entity/LearningPlan.java` | 映射 `learning_plans` 表 |
| `controller/LearningPlanController.java` | REST 端点 |
| `service/LearningPlanService.java` | 接口 |
| `service/impl/LearningPlanServiceImpl.java` | 查询最新 + 内部创建 |
| `mapper/LearningPlanMapper.java` | 查询 + 插入 |

| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/courses/{courseId}/learning-plans/latest` | GET | STUDENT（本人） | 最新学习计划 |
| `/api/learning-plans` | POST | X-Internal-Token | Agent 内部创建学习计划 |

**数据来源**：`learning_plans` 表

---

### 2.12 scheduler — 定时任务

| 文件 | 触发 | 说明 |
|------|------|------|
| `task/HeartbeatTask.java` | `@Scheduled(cron="0 0 22 * * ?")` 每天 22:00 | 通过 WebClient 调用 Agent `POST /api/agent/heartbeat` |

**配置**：`@EnableScheduling` 已在启动类启用。

---

### 2.13 dev — 开发辅助

| 类 | 职责 |
|----|------|
| `controller/SeedDataController.java` | REST 端点 |
| `service/SeedDataService.java` | 接口 |
| `service/impl/SeedDataServiceImpl.java` | Seed 写入 + 手动 Heartbeat |

| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/dev/seed` | POST | `@Profile("dev")` + permitAll | 写入 Demo 全套数据 |
| `/api/dev/heartbeat/run` | POST | `@Profile("dev")` + permitAll | 手动触发 Agent Heartbeat `?courseId=` |

Seed 数据包括：4 个用户、1 门课程、35 个知识节点、28 条边、资源、3 套测验、105 条掌握度记录、学生记忆、学习日志、通知。

---

## 3. 依赖注入规范

- **全项目统一使用构造器注入**：`@RequiredArgsConstructor` + `private final` 字段
- **不使用 `@Autowired` 字段注入**
- MyBatis Mapper 接口用 `@Mapper` 注解，无需 `@Repository`

```java
@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {
    private final CourseMapper courseMapper;
    private final CourseMemberMapper courseMemberMapper;
}
```

---

## 4. 安全架构

### 4.1 JWT 认证链路

```
请求 → JwtAuthenticationFilter → SecurityContext → Controller
         ↓ 提取 token                ↓ auth.getPrincipal() = userId
         ↓ 验证签名/过期             ↓ auth.getAuthorities() = [ROLE_TEACHER]
```

### 4.2 角色权限

| 注解 | 适用接口 |
|------|----------|
| `@PreAuthorize("hasRole('TEACHER')")` | 创建课程、发布资源、创建题目/测验、查看成员、教学建议、触发提醒 |
| `@PreAuthorize("hasRole('STUDENT')")` | 加入课程、提交测验、获取学习内容、学习计划 |
| `@PreAuthorize("isAuthenticated()")` | `GET /api/auth/me`、`GET /api/courses`、通知列表、图谱 |
| `@PreAuthorize("hasAnyRole('TEACHER','STUDENT')")` | 学生图谱下钻、学习轨迹 |
| `@PreAuthorize("hasAnyRole('TEACHER','ADMIN')")` | Heartbeat 状态 |

### 4.3 内部接口隔离（Agent ↔ Spring）

通过 `InternalTokenAuthenticationFilter` 实现双重校验：

```
请求 → InternalTokenAuthenticationFilter       → SecurityConfig
         ├─ IP 白名单（allowed-ips）            └─ /api/students/** .authenticated()
         ├─ X-Internal-Token 校验
         └─ 通过 → 设 ROLE_INTERNAL
```

受保护的内部接口路径：
- `/api/students/**`（memory GET/PUT）
- `POST /api/notifications`（Agent 创建通知）
- `POST /api/learning-plans`（Agent 保存学习计划）
- `GET /api/analytics/daily`（Agent 读取每日学情）

---

## 5. 数据库映射策略

### 5.1 MyBatis 注解 SQL

- 全部使用注解方式（`@Select` / `@Insert` / `@Update` / `@Delete`），不写 XML
- 关联查询用 `@Results` + `@Result` 映射
- 插入后返回自增 ID 用 `@Options(useGeneratedKeys = true, keyProperty = "id")`
- PostgreSQL UPSERT 使用 `ON CONFLICT ... DO UPDATE`

### 5.2 表对应关系

| 模块 | 表名 | 说明 |
|------|------|------|
| auth | `users`, `roles`, `user_roles` | 用户、角色、关联 |
| course | `courses`, `course_members`, `course_invites` | 课程、成员、邀请码 |
| graph | `knowledge_nodes`, `knowledge_edges` | 知识节点、边 |
| resource | `resources`, `resource_knowledge` | 资源、资源-节点绑定 |
| quiz | `questions`, `question_options`, `quizzes`, `quiz_questions`, `quiz_submissions`, `quiz_answers` | 题目、选项、测验、组卷、提交、答案 |
| mastery | `knowledge_mastery`, `mastery_history` | 掌握度、变化历史 |
| analytics | `learning_logs`, `risk_events` | 学习日志、风险事件 |
| notification | `notifications` | 通知 |
| memory | `student_memory` | Agent 学生记忆（JSON） |
| ai_memory | `ai_memories` | AI 多类型记忆 |
| learning_plan | `learning_plans`, `learning_plan_tasks` | 学习计划、任务分解 |
| agent | `agent_events`, `agent_jobs`, `agent_outputs` | 事件、任务、输出 |
| scheduler | `weekly_reports` | 周报（Agent 输出） |
| ai | `ai_conversations` | AI 对话历史 |

完整 DDL 见 `src/main/resources/db/schema.sql`。

---

## 6. 配置项说明

| 配置 | 键 | 默认值 |
|------|-----|--------|
| PostgreSQL | `spring.datasource.*` | `localhost:5432/teaching_ops` |
| JWT 密钥 | `jwt.secret` | 环境变量 `JWT_SECRET`，默认 ≥32 字符 |
| JWT 过期 | `jwt.expiration` | `259200000`（3 天） |
| 文件上传 | `spring.servlet.multipart.*` | 单文件 50MB，请求 100MB |
| MinIO | `minio.*` | `localhost:9000`，bucket `resources` |
| Agent 地址 | `agent.service.base-url` | `http://localhost:8000` |
| Agent Token | `agent.service.internal-token` | 环境变量 `AGENT_INTERNAL_TOKEN` |
| Agent IP 白名单 | `agent.service.allowed-ips` | 逗号分隔，默认 `127.0.0.1,::1` |
| 服务端口 | `server.port` | `8080` |
| 默认 Profile | `spring.profiles.active` | `dev` |

---

## 7. 技术栈版本

| 依赖 | 版本 |
|------|------|
| Spring Boot | 3.5.15 |
| Java | 21 |
| MyBatis Spring Boot Starter | 3.0.5 |
| PostgreSQL JDBC | 42.7.3 |
| jjwt | 0.12.6 |
| MinIO Client | 8.5.10 |
| Lombok | (provided) |

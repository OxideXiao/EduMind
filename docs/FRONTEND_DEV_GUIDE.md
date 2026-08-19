# 前端开发对照手册 v1.0

> 本文档整合 PRD、api-spec、frontend-routes、demo-seed-spec 四份文档，标注每个 API 的来源、实现状态、Mock 数据文件。

---

## 一、API 总表（仅前端可调的 Spring :8080 接口）

### 1. 认证（§2）— 来源：[api-spec.md](api-spec.md) §2

| 方法 | 路径 | 权限 | Request | Response | 前端状态 | Mock |
|------|------|------|---------|----------|---------|------|
| POST | `/api/auth/register` | 公开 | `{name, email, password, role}` | `{userId, token}` | ✅ 已接入 | [mock/auth.ts](../frontend/src/mock/auth.ts) |
| POST | `/api/auth/login` | 公开 | `{email, password}` | `{userId, name, role, token}` | ✅ 已接入 | 同上 |
| GET | `/api/auth/me` | 已登录 | — | `{userId, name, email, role}` | ✅ 已接入 | [mock/auth.ts](../frontend/src/mock/auth.ts) |

### 2. 课程与成员（§3）— 来源：[api-spec.md](api-spec.md) §3

| 方法 | 路径 | 权限 | Request | Response | 前端状态 | Mock |
|------|------|------|---------|----------|---------|------|
| POST | `/api/courses` | TEACHER | `{name, semester, description}` | `{courseId, name, semester, inviteCode, teacherId}` | ✅ 已接入 | [mock/course.ts](../frontend/src/mock/course.ts) |
| GET | `/api/courses` | 已登录 | — | `[{courseId, name, semester, role, memberCount}]` | ✅ 已接入 | 同上 |
| POST | `/api/courses/{id}/join` | STUDENT | `{inviteCode}` | `{courseId, joinedAt}` | ✅ 已接入 | 同上 |
| GET | `/api/courses/{id}/members` | TEACHER | — | `[{userId, name, joinedAt}]` | ✅ 已接入 | [mock/course.ts](../frontend/src/mock/course.ts) |

### 3. 知识图谱（§4）— 来源：[api-spec.md](api-spec.md) §4，[frontend-routes.md](frontend-routes.md) §3.3

| 方法 | 路径 | 权限 | Request | Response | 前端状态 | 负责 |
|------|------|------|---------|----------|---------|------|
| GET | `/api/courses/{id}/graph?role=` | 课程成员 | Query: role | `{nodes[], edges[], meta{}}` | ⏳ 占位 | **Dev1** |
| GET | `/api/courses/{id}/students/{sid}/graph` | TEACHER | — | 同结构，指定学生的掌握度 | ⏳ 占位 | **Dev1** |

### 4. 资源与测验（§5）— 来源：[api-spec.md](api-spec.md) §5

| 方法 | 路径 | 权限 | Request | Response | 前端状态 | Mock |
|------|------|------|---------|----------|---------|------|
| GET | `/api/courses/{id}/nodes/{nid}/learning` | 课程成员 | — | `{node, resources[], quizzes[]}` | ✅ 已接入 | [mock/node.ts](../frontend/src/mock/node.ts) |
| GET | `/api/quizzes/{id}` | 课程成员 | — | `{quizId, name, questions[]}` | ✅ 已接入 | [mock/quiz.ts](../frontend/src/mock/quiz.ts) |
| POST | `/api/quizzes/{id}/submit` | STUDENT | `{answers}` | `{score, totalScore, masteryUpdates[]}` | ✅ 已接入 | 同上 |
| POST | `/api/courses/{id}/resources` | TEACHER | FormData | `{resourceId, url}` | ❌ MVP 砍掉 | — |
| POST | `/api/courses/{id}/questions` | TEACHER | `{content, type, options, answer, score, nodeId}` | `{questionId}` | ❌ MVP 砍掉 | — |
| POST | `/api/courses/{id}/quizzes` | TEACHER | `{name, questionIds, deadline}` | `{quizId}` | ❌ MVP 砍掉 | — |

### 5. 学情看板（§6）— 来源：[api-spec.md](api-spec.md) §6

| 方法 | 路径 | 权限 | Request | Response | 前端状态 | Mock |
|------|------|------|---------|----------|---------|------|
| GET | `/api/courses/{id}/dashboard` | TEACHER | — | `{completionRate, activeRate, riskStudentCount, weakKnowledgePoints[], riskStudents[], activeTrend[]}` | ✅ 已接入 | [mock/dashboard.ts](../frontend/src/mock/dashboard.ts) |
| GET | `/api/courses/{id}/students/{sid}/trajectory` | TEACHER | — | `{recentQuizzes[], recentLogs[]}` | ✅ 已接入 | [mock/student.ts](../frontend/src/mock/student.ts) |

### 6. 通知（§7）— 来源：[api-spec.md](api-spec.md) §7

| 方法 | 路径 | 权限 | Request | Response | 前端状态 | Mock |
|------|------|------|---------|----------|---------|------|
| GET | `/api/notifications?isRead=&page=&size=` | 已登录 | Query | `{unreadCount, items[]}` | ✅ 已接入 | [mock/notification.ts](../frontend/src/mock/notification.ts) |
| PATCH | `/api/notifications/{id}/read` | 已登录 | — | `{code, message}` | ✅ 已接入 | 同上 |
| PATCH | `/api/notifications/read-all` | 已登录 | — | `{code, message}` | ✅ 已接入 | 同上 |

### 7. 学习计划（§8）— 来源：[api-spec.md](api-spec.md) §8

| 方法 | 路径 | 权限 | Request | Response | 前端状态 | Mock |
|------|------|------|---------|----------|---------|------|
| GET | `/api/courses/{id}/learning-plans/latest` | STUDENT | — | `{planId, planContent, generatedAt}` | ✅ 已接入 | [mock/agent.ts](../frontend/src/mock/agent.ts) |
| POST | `/api/courses/{id}/agent/learning-plan` | STUDENT | 空Body | 同上 | ✅ 已接入 | 同上 |

### 8. Agent 代理（§9）— 来源：[api-spec.md](api-spec.md) §9

| 方法 | 路径 | 权限 | Request | Response | 前端状态 | Mock |
|------|------|------|---------|----------|---------|------|
| POST | `/api/courses/{id}/agent/teaching-suggestion` | TEACHER | 空Body | `{problem, suggestions[]}` | ✅ 已接入 | [mock/agent.ts](../frontend/src/mock/agent.ts) |
| POST | `/api/courses/{id}/agent/trigger-reminder` | TEACHER | `{studentId, reason?}` | `{notificationId}` | ❌ 未实现 | —（Heartbeat 内自动触发） |
| GET | `/api/agent/heartbeat/status` | TEACHER | — | `{lastRunAt, status}` | ✅ 已接入 | 看板心跳卡片 |

### 9. 开发辅助（§12）— 来源：[api-spec.md](api-spec.md) §12

| 方法 | 路径 | 权限 | Request | Response | 前端状态 |
|------|------|------|---------|----------|---------|
| POST | `/api/dev/heartbeat/run?courseId=` | dev profile | Query | `{message, notifiedCount}` | ✅ 已接入 | 看板"手动执行 Heartbeat"按钮 |
| GET | `/health` | 公开 | — | `{status: "UP"}` | ❌ 未实现 |

---

## 二、页面 ↔ API ↔ 功能 对照表

| 功能ID | 页面 | 调用的 API | 来源文档 |
|--------|------|-----------|---------|
| F01 登录注册 | LoginPage, RegisterPage | POST auth/login, auth/register | [PRD §4.1](product/PRD-v0.2.md) |
| F02 课程管理 | CourseListPage | GET courses, POST courses, POST join | [PRD §4.1](product/PRD-v0.2.md) |
| F03 图谱(学生) | GraphPage(student) | GET graph?role=student | [PRD §4.2](product/PRD-v0.2.md) |
| F04 图谱(教师) | GraphPage(teacher) | GET graph?role=teacher | [PRD §4.2](product/PRD-v0.2.md) |
| F05 学情看板 | DashboardPage | GET dashboard | [PRD §4.5](product/PRD-v0.2.md) |
| F06 测验作答 | QuizPage | GET quizzes, POST submit | [PRD §4.4](product/PRD-v0.2.md) |
| F07 通知 | NotificationBell, NotificationListPage | GET/PATCH notifications | [PRD §4.7](product/PRD-v0.2.md) |
| — 节点学习 | NodeLearnPage | GET nodes/{id}/learning | [frontend-routes §3.4](frontend-routes.md) |
| — 学生下钻 | StudentDetailPage | GET students/{id}/graph, trajectory | [frontend-routes §3.7](frontend-routes.md) |
| F10 学习计划 | LearningPlanPage | GET plans/latest, POST agent/learning-plan | [PRD §4.6](product/PRD-v0.2.md) |
| F11 教学建议 | TeachingAdvicePage | POST agent/teaching-suggestion | [PRD §4.5](product/PRD-v0.2.md) |

---

## 三、数据类型对照（前端 types.ts ↔ api-spec）

| 前端类型 (`api/types.ts`) | api-spec 对应 | 差异 |
|--------------------------|-------------|------|
| `AuthUser` | auth/me Response.data | 前端用 `id`，spec 用 `userId` |
| `Course` | courses Response.data[0] | 前端多了 `nodeCount`, `studentCount`, `description` |
| `GraphNode` | graph Response.data.nodes[0] | 完全一致 |
| `GraphEdge` | graph Response.data.edges[0] | 完全一致 |
| `Quiz` | quizzes Response.data | 一致 |
| `SubmitResult` | quizzes/submit Response.data | 一致 |
| `DashboardData` | dashboard Response.data | 一致 |
| `Notification` | notifications Response.data.items[0] | 前端用 `id`，spec 用 `notificationId` |
| `LearningPlan` | learning-plans/latest Response.data | 前端简化了嵌套结构 |
| `TeachingAdvice` | agent/teaching-suggestion Response.data | 一致 |

> ⚠️ 后端就绪前需要统一字段名差异（`id` ↔ `userId`/`courseId`/`notificationId`）

---

## 四、Mock 数据覆盖情况

| Mock 文件 | 覆盖的 API | 数据来源 |
|-----------|-----------|---------|
| [mock/data.ts](../frontend/src/mock/data.ts) | — | [demo-seed-spec §2](demo-seed-spec.md) 演示账号 |
| [mock/auth.ts](../frontend/src/mock/auth.ts) | login, register, getMe | [demo-seed-spec §2](demo-seed-spec.md) 4个演示账号 |
| [mock/course.ts](../frontend/src/mock/course.ts) | courses, create, join, members | 3门课 + 每门15-20学生 |
| [mock/node.ts](../frontend/src/mock/node.ts) | fetchNodeLearning | 二叉树遍历、动态规划 含资源+测验 |
| [mock/quiz.ts](../frontend/src/mock/quiz.ts) | fetchQuiz, submitQuiz | 2套测验 各5题 含答案评分 |
| [mock/dashboard.ts](../frontend/src/mock/dashboard.ts) | fetchDashboard | 按课程ID差异化数据 |
| [mock/agent.ts](../frontend/src/mock/agent.ts) | learning-plan, teaching-suggestion | localStorage持久化 |
| [mock/student.ts](../frontend/src/mock/student.ts) | fetchStudentTrajectory | 3档学生(优/中/风险) |
| [mock/notification.ts](../frontend/src/mock/notification.ts) | notifications CRUD | 按userId隔离 6条演示通知 |

**待创建**：`mock/graph.ts`（Dev1 负责）

---

## 五、开发进度 Chunk 跟踪

| Chunk | 页面 | 状态 | Mock | 验收项 |
|-------|------|------|------|--------|
| 1 登录注册 | LoginPage, RegisterPage | ✅ 完成 | auth | 4账号登录 + getMe验证 + dev模式 |
| 2 课程列表 | CourseListPage | ✅ 完成 | course | 3门课/创建/加入/邀请码/成员管理(20人滚动) |
| 3 节点学习 | NodeLearnPage | ✅ 完成 | node | 资源列表(PDF/视频/链接) + 测验入口 |
| 4 测验作答 | QuizPage | ✅ 完成 | quiz | 单选/判断/题号导航/提交评分+掌握度变化 |
| 5 学情看板 | DashboardPage | ✅ 完成 | dashboard+course | ECharts折线/薄弱Top5/风险+全班学生/多课程 |
| 6 学习计划 | LearningPlanPage | ✅ 完成 | agent | GET最新→展示 / POST生成 / 勾选+进度localStorage |
| 7 教学建议 | TeachingAdvicePage | ✅ 完成 | agent | 生成/问题诊断/建议编号+优先级Tag |
| 8 学生下钻 | StudentDetailPage | ✅ 完成 | student | 3档学生数据/测验表+学习日志Timeline |
| 9 通知中心 | NotificationBell + ListPage | ✅ 完成 | notification | 铃铛红点+Dropdown/详情Modal/按用户隔离/已读同步 |
| — 知识图谱 | GraphPage | Dev1 负责 | Dev1 | G6渲染+双视图 |

---

## 七、未实现的 API（原因）

| 方法 | 路径 | 原因 |
|------|------|------|
| POST | `/api/courses/{id}/resources` | MVP 已砍（PRD §2） |
| POST | `/api/courses/{id}/questions` | MVP 已砍（PRD §2） |
| POST | `/api/courses/{id}/quizzes` | MVP 已砍（PRD §2） |
| POST | `/api/courses/{id}/agent/trigger-reminder` | Heartbeat 执行时自动触发，前端无需单独调用 |
| GET | `/health` | 运维健康检查，非前端功能 |
| GET | `/api/courses/{id}/graph` | **Dev1 负责** |
| GET | `/api/courses/{id}/students/{sid}/graph` | **Dev1 负责** |

**前端已接入：22 个接口 ✅ / 未接入：7 个（3个已砍 + 2个Dev1 + 2个后端/运维）**

---

## 七、调用链路

```
浏览器 → :5173 (Vite)
            │
            └─ axios → :8080/api/*  (Spring Boot)
                            │
                            └─ 内网 → :8000  (Agent Service)
                                        │
                                        └─ → LLM API

前端 ≠ Agent （禁止直连）
```

---

*本文档随开发进度更新。Chunk 完成一项后勾选对应行。*

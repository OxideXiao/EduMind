# API Spec v0.1

> **版本**：v0.1 | **Spring 端口**：8080 | **Agent 端口**：8000（仅 Spring 调用）
> **对齐**：PRD v0.2 + Agent 专责实施指南；差异见 `spec-alignment-notes.md`

---

## 目录

1. [通用约定](#1-通用约定)
2. [认证接口](#2-认证接口)
3. [课程与成员](#3-课程与成员)
4. [知识图谱](#4-知识图谱)
5. [资源与测验](#5-资源与测验)
6. [学情与掌握度](#6-学情与掌握度)
7. [通知](#7-通知)
8. [学习计划](#8-学习计划)
9. [Agent 代理接口（Spring 封装，前端调用）](#9-agent-代理接口spring-封装前端调用)
10. [Agent 服务接口（Dev 5，Spring 调用）](#10-agent-服务接口dev-5spring-调用)
11. [内部接口（Agent ↔ Spring）](#11-内部接口agent--spring)
12. [开发辅助](#12-开发辅助)

---

## 1. 通用约定

### 1.1 Base URL

| 调用方 | Base URL |
|--------|----------|
| 前端 | `{VITE_API_BASE_URL}` → `http://localhost:8080` |
| Agent → Spring | `{SPRING_BASE_URL}` → `http://localhost:8080` |
| Spring → Agent | `{agent.base-url}` → `http://localhost:8000` |

### 1.2 掌握度换算

- **Spring / 前端 / 图谱**：`score` 为 **0–100** 整数
- **Agent Prompt 输入**：可传 `knowledge_mastery` 为 **0–1** 浮点，Spring 代理层负责转换：`ratio = score / 100`

### 1.3 角色枚举

`TEACHER` | `STUDENT` | `ADMIN`

---

## 2. 认证接口

### POST `/api/auth/register`

**说明**：注册账号并选择角色。

**Request**

```json
{
  "name": "张老师",
  "email": "teacher@demo.com",
  "password": "demo123456",
  "role": "TEACHER"
}
```

**Response 200**

```json
{
  "code": 200,
  "message": "ok",
  "data": {
    "userId": 1,
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### POST `/api/auth/login`

**Request**

```json
{
  "email": "teacher@demo.com",
  "password": "demo123456"
}
```

**Response 200**

```json
{
  "code": 200,
  "data": {
    "userId": 1,
    "name": "张老师",
    "role": "TEACHER",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### GET `/api/auth/me`

**Headers**：`Authorization: Bearer {token}`

**Response 200**

```json
{
  "code": 200,
  "data": {
    "userId": 1,
    "name": "张老师",
    "email": "teacher@demo.com",
    "role": "TEACHER"
  }
}
```

---

## 3. 课程与成员

### POST `/api/courses`

**权限**：TEACHER

**Request**

```json
{
  "name": "数据结构与算法",
  "semester": "2025-2026-2",
  "description": "计算机专业核心课程"
}
```

**Response 200**

```json
{
  "code": 200,
  "data": {
    "courseId": 1,
    "name": "数据结构与算法",
    "semester": "2025-2026-2",
    "inviteCode": "A3K9M2",
    "teacherId": 1
  }
}
```

---

### GET `/api/courses`

**权限**：已登录

**Response 200**

```json
{
  "code": 200,
  "data": [
    {
      "courseId": 1,
      "name": "数据结构与算法",
      "semester": "2025-2026-2",
      "role": "TEACHER",
      "memberCount": 3
    }
  ]
}
```

---

### POST `/api/courses/{courseId}/join`

**权限**：STUDENT

**Request**

```json
{
  "inviteCode": "A3K9M2"
}
```

**Response 200**

```json
{
  "code": 200,
  "data": {
    "courseId": 1,
    "joinedAt": "2026-06-09T10:00:00"
  }
}
```

---

### GET `/api/courses/{courseId}/members`

**权限**：TEACHER（本课程）

**Response 200**

```json
{
  "code": 200,
  "data": {
    "students": [
      { "userId": 101, "name": "张三", "joinedAt": "2026-06-01T08:00:00" },
      { "userId": 102, "name": "李四", "joinedAt": "2026-06-02T08:00:00" }
    ]
  }
}
```

---

## 4. 知识图谱

### GET `/api/courses/{courseId}/graph`

**权限**：课程成员

**Query**

| 参数 | 必填 | 说明 |
|------|------|------|
| role | 否 | `student`（默认）\| `teacher`；也可从 JWT 角色推断 |

**Response 200 — 公共结构**

```json
{
  "code": 200,
  "data": {
    "courseId": 1,
    "nodes": [
      {
        "id": 10,
        "name": "二叉树遍历",
        "description": "...",
        "order": 3,
        "x": 120,
        "y": 80,
        "masteryScore": 65,
        "masteryLevel": "YELLOW",
        "isRecommended": false,
        "isWeakTop": true
      }
    ],
    "edges": [
      { "from": 8, "to": 10, "type": "PREREQUISITE" }
    ],
    "meta": {
      "viewType": "STUDENT",
      "recommendedNodeId": 11,
      "weakNodeIds": [10, 15]
    }
  }
}
```

**字段差异（服务端计算）**

| 字段 | 学生视图 | 教师视图 |
|------|----------|----------|
| `masteryScore` | 当前学生该节点掌握度 0–100 | 全班平均掌握度 0–100 |
| `masteryLevel` | GREEN/YELLOW/RED/GRAY | 同左 |
| `isRecommended` | 推荐下一节点 | false |
| `isWeakTop` | false | 是否 Top5 薄弱 |

**masteryLevel 规则**

| Level | 条件（score） |
|-------|---------------|
| GRAY | 0 |
| RED | 1–59 |
| YELLOW | 60–79 |
| GREEN | ≥ 80 |

---

### GET `/api/courses/{courseId}/students/{studentId}/graph`

**权限**：TEACHER 下钻 / STUDENT 仅本人

**Response**：与学生视图相同结构，`masteryScore` 为指定学生数据。

---

## 5. 资源与测验

### POST `/api/courses/{courseId}/resources`

**权限**：TEACHER

**Request**（multipart 或 JSON+预签名 URL）

```json
{
  "nodeId": 10,
  "name": "二叉树视频讲解",
  "type": "VIDEO",
  "url": "https://example.com/video.mp4"
}
```

---

### GET `/api/courses/{courseId}/nodes/{nodeId}/learning`

**权限**：STUDENT

**Response**

```json
{
  "code": 200,
  "data": {
    "node": { "id": 10, "name": "二叉树遍历", "description": "..." },
    "resources": [
      { "id": 1, "name": "课件.pdf", "type": "PDF", "url": "/files/xxx.pdf" }
    ],
    "quizzes": [
      { "quizId": 5, "name": "二叉树测验", "deadline": "2026-06-20T23:59:59" }
    ]
  }
}
```

---

### POST `/api/courses/{courseId}/questions`

**权限**：TEACHER

```json
{
  "nodeId": 10,
  "type": "SINGLE_CHOICE",
  "content": "前序遍历的根节点访问顺序是？",
  "options": ["A. 根-左-右", "B. 左-根-右", "C. 左-右-根"],
  "answer": "A",
  "score": 10
}
```

---

### POST `/api/courses/{courseId}/quizzes`

```json
{
  "name": "第三章测验",
  "questionIds": [1, 2, 3],
  "deadline": "2026-06-20T23:59:59"
}
```

---

### GET `/api/quizzes/{quizId}`

**权限**：STUDENT（不含正确答案）

---

### POST `/api/quizzes/{quizId}/submit`

**权限**：STUDENT

**Request**

```json
{
  "answers": {
    "1": "A",
    "2": "true"
  }
}
```

**Response 200**

```json
{
  "code": 200,
  "data": {
    "submissionId": 100,
    "score": 80,
    "totalScore": 100,
    "masteryUpdates": [
      { "nodeId": 10, "nodeName": "二叉树遍历", "oldScore": 55, "newScore": 68, "delta": 13 }
    ],
    "triggerReminder": false
  }
}
```

**副作用**

1. 更新 `student_mastery`（公式见 PRD：`新分×0.6 + 历史均分×0.4`）
2. 写入 `learning_logs`
3. 若某节点 `delta ≤ -15`（下降≥15%），Spring 异步调用 Agent `POST /api/agent/reminder`（实时提醒）

---

## 6. 学情与掌握度

### GET `/api/courses/{courseId}/dashboard`

**权限**：TEACHER

**Response 200**

```json
{
  "code": 200,
  "data": {
    "completionRate": 0.67,
    "activeRate": 0.75,
    "riskStudentCount": 1,
    "weakKnowledgePoints": [
      { "nodeId": 15, "name": "动态规划", "avgScore": 38.5 },
      { "nodeId": 10, "name": "二叉树遍历", "avgScore": 42.0 }
    ],
    "riskStudents": [
      { "userId": 103, "name": "王五", "reason": "3天未学习", "avgMastery": 30 }
    ],
    "activeTrend": [
      { "date": "2026-06-03", "activeCount": 2 },
      { "date": "2026-06-09", "activeCount": 3 }
    ]
  }
}
```

**指标计算（与 PRD 一致）**

| 指标 | 公式 |
|------|------|
| 完成率 | 已完成至少 1 次测验人数 / 选课学生数 |
| 活跃度 | 近 7 天有 learning_logs 记录的学生比例 |
| 风险学生 | 超 **3** 天无学习记录 **OR** 课程平均掌握度 < **40** |

---

### GET `/api/courses/{courseId}/students/{studentId}/trajectory`

**权限**：TEACHER / 本人 STUDENT

**Response**

```json
{
  "code": 200,
  "data": {
    "recentQuizzes": [
      { "quizName": "第三章测验", "score": 45, "submittedAt": "2026-06-08T14:00:00" }
    ],
    "recentLogs": [
      { "action": "VIEW_RESOURCE", "nodeName": "动态规划", "createdAt": "2026-06-07T20:00:00" }
    ]
  }
}
```

---

## 7. 通知

### GET `/api/notifications`

**权限**：已登录

**Query**：`?isRead=false&page=1&size=20`

**Response**

```json
{
  "code": 200,
  "data": {
    "unreadCount": 2,
    "items": [
      {
        "notificationId": 1001,
        "type": "REMINDER",
        "title": "学习提醒",
        "content": "张三，动态规划掌握度偏低，建议今日完成2道练习。",
        "courseId": 1,
        "priority": "HIGH",
        "isRead": false,
        "createdAt": "2026-06-09T22:05:00"
      }
    ]
  }
}
```

**type 枚举**：`REMINDER` | `PLAN` | `SYSTEM` | `ADVICE`

---

### PATCH `/api/notifications/{notificationId}/read`

**Response**：`{ "code": 200, "message": "ok" }`

---

### PATCH `/api/notifications/read-all`

**Response**：`{ "code": 200, "data": { "updatedCount": 5 } }`

---

## 8. 学习计划

### GET `/api/courses/{courseId}/learning-plans/latest`

**权限**：STUDENT（本人）

**Response**

```json
{
  "code": 200,
  "data": {
    "planId": 2001,
    "planContent": {
      "summary": "本周重点攻克动态规划",
      "short_term": {
        "focus": "动态规划基础",
        "daily_plan": [
          { "day": 1, "task": "观看DP入门视频", "duration_min": 30, "knowledge_point": "动态规划" }
        ]
      },
      "mid_term": { "goal": "...", "milestones": [], "suggested_resources": [] },
      "motivation": "坚持就是胜利！"
    },
    "generatedAt": "2026-06-09T15:30:00"
  }
}
```

---

## 9. Agent 代理接口（Spring 封装，前端调用）

> 前端 **只调以下 Spring 接口**；Spring 负责聚合数据后调用 Agent 服务。

### POST `/api/courses/{courseId}/agent/learning-plan`

**权限**：STUDENT

**说明**：Spring 读取掌握度 + memory → 调 Agent → 存库 → 返回。

**Request**：空 Body（userId/courseId 从 JWT 与 Path 取）

**Response 200**

```json
{
  "code": 200,
  "data": {
    "planId": 2001,
    "summary": "本周重点攻克动态规划",
    "short_term": { "focus": "...", "daily_plan": [] },
    "generatedAt": "2026-06-09T15:30:00"
  }
}
```

**超时**：30s；失败返回 `{ "code": 500, "message": "计划生成失败，请稍后重试" }`

---

### POST `/api/courses/{courseId}/agent/teaching-suggestion`

**权限**：TEACHER

**Request**（可选，不传则 Spring 自动取 dashboard 薄弱点）

```json
{
  "weakNodeIds": [15, 10]
}
```

**Response 200**

```json
{
  "code": 200,
  "data": {
    "problem": "72% 学生在「动态规划」章节掌握度低于 50%",
    "suggestions": [
      "增加 2 个 DP 状态转移案例讲解",
      "布置一次专项小测"
    ],
    "priority": "HIGH",
    "generatedAt": "2026-06-09T16:00:00"
  }
}
```

---

### POST `/api/courses/{courseId}/agent/trigger-reminder`

**权限**：TEACHER（手动）/ 内部（测验骤降）

**Request**

```json
{
  "studentId": 102,
  "reason": "MASTERY_DROP",
  "context": { "nodeId": 15, "delta": -18 }
}
```

**说明**：Spring 调 Agent `/api/agent/reminder`，再写通知。

---

### GET `/api/agent/heartbeat/status`

**权限**：TEACHER / ADMIN

**Response**

```json
{
  "code": 200,
  "data": {
    "lastRunAt": "2026-06-08T22:00:05",
    "status": "SUCCESS",
    "totalStudents": 3,
    "remindedCount": 2
  }
}
```

---

### POST `/api/dev/heartbeat/run`

**权限**：dev 环境 / ADMIN

**说明**：手动触发 Heartbeat（Demo 用），等同定时任务。

**Query**：`?courseId=1`（可选）

---

## 10. Agent 服务接口（Dev 5，Spring 调用）

> **Base URL**：`http://localhost:8000`
> **响应格式**：`{ "success": bool, "data": any, "error": string|null }`

### GET `/health`

```json
{ "status": "ok" }
```

---

### POST `/api/agent/heartbeat`

**说明**：执行完整 Heartbeat（沿用 Agent 指南 §7）。

**Query**：`course_id`（可选，不传则全课程）

**Response**

```json
{
  "success": true,
  "data": {
    "date": "2026-06-09",
    "total": 3,
    "success": 3,
    "details": [
      { "student_id": 101, "success": true, "reminder": { "title": "继续保持", "content": "...", "priority": "NORMAL" } }
    ]
  }
}
```

---

### POST `/api/agent/learning-plan`

**Request**（Spring 组装，沿用 Agent 指南 `LearningPlanRequest`）

```json
{
  "student_id": 102,
  "student_name": "李四",
  "course_id": 1,
  "course_name": "数据结构与算法",
  "memory_json": "{\"version\":1,\"summary\":\"...\"}",
  "knowledge_mastery": {
    "二叉树遍历": 0.65,
    "动态规划": 0.30,
    "贪心算法": 0.55
  }
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "summary": "...",
    "short_term": { "focus": "...", "daily_plan": [] },
    "mid_term": {},
    "motivation": "..."
  }
}
```

---

### POST `/api/agent/reminder`

**Request**（沿用 Agent 指南 `ReminderRequest`）

```json
{
  "student_id": 103,
  "student_name": "王五",
  "completion_rate": 0.15,
  "active_days": 1,
  "at_risk": true,
  "weak_points": ["动态规划", "二叉树遍历"],
  "memory_json": "{}"
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "title": "需要关注",
    "content": "王五同学，你已5天未登录...",
    "priority": "HIGH"
  }
}
```

---

### POST `/api/agent/memory-update`

**Request**

```json
{
  "current_memory_json": "{}",
  "today_activities": "完成率15%，本周活跃1天...",
  "knowledge_changes": "{\"动态规划\": 0.15}"
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "version": 2,
    "last_updated": "2026-06-09T22:05:00",
    "summary": "...",
    "weak_points": ["动态规划"],
    "suggested_focus": "..."
  }
}
```

---

### POST `/api/agent/teaching-suggestion`

**Request**（沿用 Agent 指南，补充完整）

```json
{
  "teacher_id": 1,
  "course_id": 1,
  "course_name": "数据结构与算法",
  "class_avg_mastery": {
    "动态规划": 0.38,
    "二叉树遍历": 0.62
  },
  "weak_knowledge_points": ["动态规划", "贪心算法"],
  "at_risk_student_count": 1
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "problem": "...",
    "suggestions": ["...", "..."],
    "priority": "HIGH"
  }
}
```

---

## 11. 内部接口（Agent ↔ Spring）

> Agent 通过 `X-Internal-Token` 调用；**沿用 Agent 指南 §2，并补充 course_id**。

### GET `/api/students/{studentId}/memory`

**Query**：`course_id`（**必填**）

**Response**

```json
{
  "code": 200,
  "data": {
    "memory_json": "{\"version\":1,\"summary\":\"...\"}"
  }
}
```

初始值：空对象 `"{}"` 或 seed 预置 JSON。

---

### PUT `/api/students/{studentId}/memory`

**Query**：`course_id`（**必填**）

**Request**

```json
{
  "memory_json": "{\"version\":2,\"last_updated\":\"2026-06-09T22:05:00\",...}"
}
```

---

### GET `/api/analytics/daily`

**Query**：`course_id`（可选）、`date=yyyy-MM-dd`（默认今天）

**Response**（沿用 Agent 指南 §2.2，`knowledge_mastery` 值为 **0–1**）

```json
{
  "code": 200,
  "data": {
    "course_id": 1,
    "date": "2026-06-09",
    "students": [
      {
        "student_id": 102,
        "student_name": "李四",
        "completion_rate": 0.55,
        "active_days_this_week": 3,
        "quiz_avg_score": 62.0,
        "at_risk": false,
        "knowledge_mastery": {
          "二叉树遍历": 0.65,
          "动态规划": 0.30
        }
      }
    ]
  }
}
```

**实现说明（Dev 4）**：从此库表实时聚合，**只读**；不提供 POST 写入。

---

### POST `/api/notifications`（内部创建）

**Request**

```json
{
  "user_id": 103,
  "course_id": 1,
  "type": "REMINDER",
  "title": "今日学习提醒",
  "content": "...",
  "priority": "HIGH"
}
```

> 注：Agent 指南用 `student_id`，Spec 统一为 `user_id`（值相同）。

**Response**

```json
{
  "code": 200,
  "data": { "notification_id": 1001 }
}
```

---

### POST `/api/learning-plans`（内部创建）

**Request**

```json
{
  "student_id": 102,
  "course_id": 1,
  "plan_content": "{...JSON string...}",
  "generated_at": "2026-06-09T15:30:00"
}
```

**Response**

```json
{
  "code": 200,
  "data": { "plan_id": 2001 }
}
```

---

## 12. 开发辅助

### POST `/api/dev/seed`

**权限**：仅 `spring.profiles.active=dev`

**说明**：写入 Demo 全套数据，详见 `demo-seed-spec.md`。

**Response**

```json
{
  "code": 200,
  "data": {
    "courseId": 1,
    "teacherEmail": "teacher@demo.com",
    "studentEmails": ["student1@demo.com", "student2@demo.com", "student3@demo.com"],
    "inviteCode": "DEMO01"
  }
}
```

---

## 附录：接口联调 Checklist

| # | 接口 | 方向 | 负责人 | 状态 |
|---|------|------|--------|------|
| 1 | Auth register/login | 前端→Spring | Dev 3 | ☐ |
| 2 | Courses CRUD + join | 前端→Spring | Dev 3 | ☐ |
| 3 | Graph dashboard | 前端→Spring | Dev 3/4 | ☐ |
| 4 | Quiz submit + mastery | 前端→Spring | Dev 3/4 | ☐ |
| 5 | Notifications | 前端→Spring | Dev 4/5 | ☐ |
| 6 | Agent proxy learning-plan | Spring→Agent | Dev 3+5 | ☐ |
| 7 | GET/PUT memory + course_id | Agent→Spring | Dev 3+5 | ☐ |
| 8 | GET analytics/daily | Agent→Spring | Dev 4+5 | ☐ |
| 9 | POST notifications internal | Agent→Spring | Dev 3+5 | ☐ |
| 10 | POST /api/agent/heartbeat | Spring→Agent | Dev 3+5 | ☐ |
| 11 | @Scheduled 22:00 | Spring | Dev 3 | ☐ |
| 12 | POST /api/dev/seed | 全员 | Dev 4/5 | ☐ |

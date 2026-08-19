# 前端页面与路由 Spec v0.1

> **版本**：v0.1 | **框架**：React 18 + TypeScript + Vite + Ant Design
> **原则**：前端只调 Spring `8080`；路由按角色隔离

---

## 1. 路由总表

| 路径 | 页面 | 角色 | 负责人 | 优先级 |
|------|------|------|--------|--------|
| `/login` | 登录 | 公开 | Dev 2 | P0 |
| `/register` | 注册 | 公开 | Dev 2 | P0 |
| `/` | 重定向 → `/courses` | 已登录 | Dev 2 | P0 |
| `/courses` | 课程列表 | 全部 | Dev 2 | P0 |
| `/courses/new` | 创建课程 | TEACHER | Dev 2 | P0 |
| `/courses/:courseId/join` | 邀请码加入（弹窗亦可） | STUDENT | Dev 2 | P0 |
| `/courses/:courseId/graph` | 知识图谱 | 全部 | **Dev 1** | P0 |
| `/courses/:courseId/nodes/:nodeId/learn` | 节点学习页 | STUDENT | Dev 2 | P0 |
| `/courses/:courseId/quizzes/:quizId` | 测验作答 | STUDENT | Dev 2 | P0 |
| `/courses/:courseId/dashboard` | 学情看板 | TEACHER | Dev 2 | P0 |
| `/courses/:courseId/students/:studentId` | 学生下钻 | TEACHER | Dev 1+2 | P0 |
| `/courses/:courseId/plan` | 学习计划 | STUDENT | Dev 2 | P1 |
| `/courses/:courseId/advice` | 教学建议 | TEACHER | Dev 2 | P1 |
| `/notifications` | 通知列表 | 全部 | Dev 2 | P0 |

---

## 2. 布局结构

### 2.1 AppLayout（登录后全局）

```text
┌──────────────────────────────────────────────────────┐
│ Header: Logo | 课程名(breadcrumb) | 🔔通知 | 用户菜单   │
├────────────┬─────────────────────────────────────────┤
│ SideMenu   │  Content（Outlet）                       │
│ - 我的课程  │                                         │
│ - 学情看板* │                                         │
│ - 学习计划* │                                         │
│ - 教学建议* │                                         │
│ (*角色可见) │                                         │
└────────────┴─────────────────────────────────────────┘
```

### 2.2 角色菜单可见性

| 菜单项 | TEACHER | STUDENT |
|--------|---------|---------|
| 我的课程 | ✅ | ✅ |
| 知识图谱 | ✅ | ✅ |
| 学情看板 | ✅ | ❌ |
| 教学建议 | ✅ | ❌ |
| 学习计划 | ❌ | ✅ |

---

## 3. 页面详细说明

### 3.1 登录 / 注册 — Dev 2

**组件**：`LoginPage`, `RegisterPage`

**API**：`POST /api/auth/login`, `POST /api/auth/register`

**要点**：
- Token 存 `localStorage`（key: `top_token`）
- 登录后按角色跳转 `/courses`
- 注册时 Radio 选择 TEACHER / STUDENT

---

### 3.2 课程列表 — Dev 2

**组件**：`CourseListPage`

**API**：`GET /api/courses`

**UI**：
- 教师：「创建课程」按钮 → `/courses/new`
- 学生：「加入课程」Modal（邀请码）→ `POST /courses/:id/join`
- Card 列表：课程名、学期、进入按钮

---

### 3.3 知识图谱 — Dev 1（核心）

**组件**：`GraphPage`, `GraphCanvas`（G6）, `GraphLegend`

**API**：`GET /api/courses/:courseId/graph?role=student|teacher`

**学生视图**：
- 节点颜色：GRAY/RED/YELLOW/GREEN
- `isRecommended` 节点蓝色边框
- 推荐路径绿色边（按 `order` 连接未掌握节点）
- 点击节点 → `/courses/:courseId/nodes/:nodeId/learn`

**教师视图**：
- 节点颜色 = 全班平均
- `isWeakTop` 红色角标 / 加粗边框
- 点击节点 → SidePanel 展示全班均值 + 学生列表
- 点击学生 → `/courses/:courseId/students/:studentId`

**性能**：
- 35 节点 MVP 直接渲染；后续 200+ 考虑 collapse 按章
- 首次加载 Skeleton，目标 < 3s

**G6 数据映射**：

```typescript
// nodes
{ id, label: name, style: { fill: colorMap[masteryLevel] } }
// edges
{ source: from, target: to }
```

---

### 3.4 节点学习页 — Dev 2

**组件**：`NodeLearnPage`

**API**：`GET /api/courses/:courseId/nodes/:nodeId/learning`

**UI**：
- 知识点标题 + 描述
- 资源列表（PDF 新窗口 / 视频播放器）
- 关联测验入口按钮

---

### 3.5 测验作答 — Dev 2

**组件**：`QuizPage`

**API**：`GET /api/quizzes/:quizId`, `POST /api/quizzes/:quizId/submit`

**UI**：
- 单选 / 判断题表单
- 提交后展示得分 + `masteryUpdates` 变化（+13 等）
- 「返回图谱」按钮

---

### 3.6 学情看板 — Dev 2

**组件**：`DashboardPage`

**API**：`GET /api/courses/:courseId/dashboard`

**UI**：

| 区域 | 组件 | 数据 |
|------|------|------|
| 顶部 | 3 个 StatisticCard | 完成率、活跃度、风险人数 |
| 左下 | ECharts 折线 | activeTrend |
| 右下 | Table | weakKnowledgePoints Top5 |
| 底部 | Table | riskStudents，点击下钻 |

---

### 3.7 学生下钻 — Dev 1 + Dev 2

**组件**：`StudentDetailPage`

**API**：
- `GET /api/courses/:courseId/students/:studentId/graph`
- `GET /api/courses/:courseId/students/:studentId/trajectory`

**UI**：
- 上部：迷你个人图谱（Dev 1 复用 GraphCanvas，`viewType=STUDENT`）
- 下部：近 5 次测验 Table + 学习日志 Timeline

---

### 3.8 学习计划 — Dev 2

**组件**：`LearningPlanPage`

**API**：
- `GET /api/courses/:courseId/learning-plans/latest`
- `POST /api/courses/:courseId/agent/learning-plan`

**UI**：
- 「生成本周计划」Button（Loading 30s）
- 展示 `summary` + `daily_plan` Checkbox 列表
- `motivation` 底部卡片

---

### 3.9 教学建议 — Dev 2

**组件**：`TeachingAdvicePage`

**API**：`POST /api/courses/:courseId/agent/teaching-suggestion`

**UI**：
- 「生成教学建议」Button
- Alert 展示 `problem`
- List 展示 `suggestions`
- Tag 展示 `priority`

---

### 3.10 通知 — Dev 2

**组件**：`NotificationBell`（Header）, `NotificationListPage`

**API**：
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

**UI**：
- Header 铃铛 + 红点 `unreadCount`
- Dropdown 最近 5 条 / 完整列表页
- 点击跳转 `courseId` 相关页（若 type=REMINDER → 图谱）

---

## 4. 前端目录建议

```text
frontend/src/
├── api/
│   ├── client.ts          # axios + JWT 拦截器
│   ├── auth.ts
│   ├── course.ts
│   ├── graph.ts
│   ├── quiz.ts
│   ├── dashboard.ts
│   ├── agent.ts
│   └── notification.ts
├── components/
│   ├── layout/AppLayout.tsx
│   ├── layout/NotificationBell.tsx
│   └── graph/GraphCanvas.tsx
├── pages/
│   ├── auth/LoginPage.tsx
│   ├── auth/RegisterPage.tsx
│   ├── course/CourseListPage.tsx
│   ├── graph/GraphPage.tsx
│   ├── learn/NodeLearnPage.tsx
│   ├── quiz/QuizPage.tsx
│   ├── dashboard/DashboardPage.tsx
│   ├── student/StudentDetailPage.tsx
│   ├── plan/LearningPlanPage.tsx
│   ├── advice/TeachingAdvicePage.tsx
│   └── notification/NotificationListPage.tsx
├── hooks/useAuth.ts
├── routes/index.tsx
└── utils/colorMap.ts      # masteryLevel → 颜色
```

---

## 5. 颜色映射（与 API Spec 一致）

```typescript
export const MASTERY_COLOR: Record<string, string> = {
  GRAY: '#d9d9d9',
  RED: '#ff4d4f',
  YELLOW: '#faad14',
  GREEN: '#52c41a',
};
export const RECOMMENDED_BORDER = '#1677ff';
export const WEAK_TOP_BORDER = '#cf1322';
```

---

## 6. 权限路由守卫

```typescript
// 伪代码
<Route element={<RequireAuth />}>
  <Route element={<RequireRole role="TEACHER" />}>
    <Route path="/courses/:id/dashboard" ... />
    <Route path="/courses/:id/advice" ... />
  </Route>
  <Route element={<RequireRole role="STUDENT" />}>
    <Route path="/courses/:id/plan" ... />
  </Route>
</Route>
```

---

## 7. 分工与联调顺序

| 天数 | Dev 1 | Dev 2 |
|------|-------|-------|
| Day 1–2 | G6 空壳 + mock 数据渲染 | 登录/课程/Layout/路由 |
| Day 3–4 | 学生视图颜色+推荐 | 测验页+学习页 |
| Day 5–6 | 教师视图+下钻图谱 | 看板 ECharts |
| Day 7–8 | 联调 graph API | 通知+计划+建议 |
| Day 9–10 | 图谱性能+Demo | BugFix+Seed 账号验证 |

**Day 3 联调依赖**：`GET /graph` 返回 mock 也可，字段结构必须符合 `api-spec.md`。

---

## 8. 页面-接口-功能映射

| 功能 ID | 页面 | API |
|---------|------|-----|
| F01 | Login/Register | auth |
| F02 | CourseList | courses, join |
| F03 | GraphPage (student) | graph?role=student |
| F04 | GraphPage (teacher) | graph?role=teacher |
| F05 | DashboardPage | dashboard |
| F06 | QuizPage | quizzes/submit |
| F07 | NotificationBell | notifications |
| F10 | LearningPlanPage | agent/learning-plan |
| F11 | TeachingAdvicePage | agent/teaching-suggestion |

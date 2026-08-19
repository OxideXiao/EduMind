# 前端模块详细设计（Module Design）

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 状态 | 已冻结 |
| 负责人 | Dev 1（图谱核心）/ Dev 2（其余页面） |
| 上级文档 | architecture.md §7 |
| 路由与分工 | frontend-routes.md |
| 接口契约 | api-spec.md |
| Demo 数据 | demo-seed-spec.md |

---

## 1. 模块定位

### 1.1 职责

前端模块负责智慧教学平台全部用户界面：登录注册、课程管理、知识图谱可视化、测验作答、学情看板、AI 计划/建议、通知中心。

### 1.2 不负责

| 事项 | 负责方 |
|------|--------|
| 业务逻辑、鉴权、持久化 | Spring Backend :8080 |
| LLM 编排、Heartbeat | Agent Service :8000 |
| 知识图谱数据计算 | Spring graph API |
| 数据库 | PostgreSQL (Dev3/4) |

### 1.3 调用边界

前端 **仅调 Spring :8080**，不直连 Agent :8000。

---

## 2. 技术选型

| 类别 | 选型 | 理由 |
|------|------|------|
| 框架 | React 18 + TypeScript | 团队熟悉、类型安全 |
| 构建 | Vite | 快速 HMR |
| UI 库 | Ant Design 5 | 丰富组件、ConfigProvider 主题 |
| 路由 | react-router-dom v6 | 懒加载 + 角色守卫 |
| HTTP | axios + 拦截器 | JWT 注入 + 401 处理 |
| 图谱 | @antv/g6 | PRD 指定、节点/边数据映射 |
| 图表 | ECharts + echarts-for-react | 看板趋势图 |
| 状态管理 | React Context | MVP 够用，不引入 Redux/Zustand |

### 2.1 设计系统（Design Token）

| 类别 | 值 |
|------|-----|
| 底色 | `#f5f3ef`（暖白） |
| 表面 | `#fefdfb` |
| 主色 | `#4f6d8c`（钢蓝） |
| 字体-标题 | Noto Serif SC |
| 字体-正文 | DM Sans |
| 字体-数据 | JetBrains Mono |
| 图标 | @ant-design/icons |

完整 Token 见 `frontend/src/global.css` 与 `frontend/src/theme.ts`。

---

## 3. 目录结构

```text
frontend/src/
├── main.tsx                  # ConfigProvider + BrowserRouter + AuthProvider
├── App.tsx                   # 根组件
├── global.css                # CSS 变量 + 全局样式 + 动效
├── theme.ts                  # Ant Design 主题覆写
│
├── api/                      # HTTP 请求层（仅调 Spring :8080）
│   ├── client.ts             #   axios 实例 + JWT 拦截器
│   ├── auth.ts               #   login / register
│   ├── course.ts             #   课程 CRUD + join
│   ├── graph.ts              #   GET graph?role=
│   ├── quiz.ts               #   测验 fetch + submit
│   ├── dashboard.ts          #   学情看板
│   ├── agent.ts              #   AI 计划/建议（经 Spring Proxy）
│   └── notification.ts       #   通知 CRUD
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx     #   侧栏 + Header + 面包屑 + Content
│   │   └── NotificationBell.tsx  # 铃铛 + 红点 + 30s 轮询
│   ├── graph/
│   │   ├── GraphCanvas.tsx   #   G6 核心画布（Dev1 主力）
│   │   ├── GraphLegend.tsx   #   图例
│   │   └── NodeSidePanel.tsx #   节点详情侧面板
│   ├── BrandCard.tsx         #   品牌卡片
│   ├── StatCard.tsx          #   统计卡片
│   └── EmptyState.tsx        #   空态占位
│
├── pages/
│   ├── auth/                 # 登录 / 注册
│   ├── course/               # 课程列表
│   ├── graph/                # 知识图谱（Dev1）
│   ├── learn/                # 节点学习
│   ├── quiz/                 # 测验作答
│   ├── dashboard/            # 学情看板
│   ├── student/              # 学生下钻
│   ├── plan/                 # 学习计划
│   ├── advice/               # 教学建议
│   └── notification/         # 通知列表
│
├── hooks/
│   └── useAuth.tsx           # AuthContext + useRole
│
├── routes/
│   ├── guards.tsx            # RequireAuth / RequireRole
│   └── index.tsx             # 路由树 + 懒加载
│
└── utils/
    ├── constants.ts          # Role 枚举 / TOKEN_KEY / API_BASE
    └── colorMap.ts           # 掌握度 → 颜色映射
```

---

## 4. 组件图与依赖

```text
main.tsx
  └── App
        └── AppRoutes (懒加载)
              ├── LoginPage        ─── auth API
              ├── RegisterPage     ─── auth API
              └── AppLayout
                    ├── SideMenu   ─── useRole
                    ├── Header     ─── NotificationBell ─── notification API
                    └── Content (Outlet)
                          ├── CourseListPage    ─── course API
                          ├── GraphPage         ─── graph API（Dev1）
                          ├── NodeLearnPage     ─── resource API
                          ├── QuizPage          ─── quiz API
                          ├── DashboardPage     ─── dashboard API
                          ├── StudentDetailPage ─── graph + trajectory API
                          ├── LearningPlanPage  ─── agent API
                          ├── TeachingAdvicePage── agent API
                          └── NotificationListPage ─ notification API
```

**依赖方向**：Page → API 函数 → axios client。Page 不直接碰 axios。

---

## 5. 核心工作流

### 5.1 登录流程

```text
用户输入邮箱+密码
  → LoginPage.onFinish()
  → POST /api/auth/login
  → 成功：token 存 localStorage(key=top_token)，user 存 AuthContext
  → navigate /courses
  → 失败：message.error 提示
```

Token 存储后，axios 拦截器自动在后续请求 Header 注入 `Authorization: Bearer {token}`。

### 5.2 角色路由守卫

```text
用户访问 /courses/:id/dashboard
  → RequireAuth  检查 token（state + localStorage 双检）
    → 无 token：Navigate → /login
    → 有 token：通过
  → RequireRole  检查 role
    → 不是 TEACHER：Navigate → /courses
    → 是 TEACHER：渲染 DashboardPage
```

### 5.3 测验提交 → 掌握度更新

```text
学生作答 → POST /quizzes/:id/submit
  → 返回 { score, masteryUpdates: [{ nodeId, change }] }
  → 前端展示得分动画 + 掌握度变化
  → 返回图谱 → 重新 GET /graph 刷新节点颜色
```

### 5.4 开发模式（前端独立开发用）

```text
?dev=teacher  → DevAutoLogin 读取 URL 参数 → devLogin → 注入 mock token
登录页按钮    → devLogin('TEACHER'|'STUDENT') → 注入 mock token
DevToolbar   → 右下角浮动面板，显示 token 前缀为 'dev-mock-' 时可用
```

开发模式下页面正常渲染，API 调用使用 mock 数据层，与真实 API 接口签名一致。

---

## 6. 与外部模块的协作边界

| 调用方 | 被调用方 | 路径 | 说明 |
|--------|----------|------|------|
| 前端 | Spring | `localhost:8080/api/*` | 所有业务接口 |
| 前端 | Agent | **禁止** | 安全要求，由 Spring 代理 |
| 前端 | G6/ECharts | 客户端渲染 | 不经过网络 |

**联调顺序**（来自 frontend-routes.md §7）：

| 天数 | Dev 1 | Dev 2 |
|------|-------|-------|
| Day 1–2 | G6 空壳 + mock | 登录/课程/Layout/路由 |
| Day 3–4 | 学生视图颜色+推荐 | 测验页+学习页 |
| Day 5–6 | 教师视图+下钻图谱 | 看板 ECharts |
| Day 7–8 | 联调 graph API | 通知+计划+建议 |
| Day 9–10 | 图谱性能+Demo | BugFix+Seed 验证 |

---

## 7. GraphCanvas 组件设计（Dev1 核心）

### 7.1 Props

```typescript
interface GraphCanvasProps {
  courseId: number;
  viewType: 'student' | 'teacher';
  data: GraphData;           // nodes + edges
  mini?: boolean;            // 迷你模式（学生下钻页）
  onNodeClick?: (node: GraphNode) => void;
}
```

### 7.2 G6 数据映射

| API 字段 | G6 属性 | 说明 |
|----------|---------|------|
| `node.id` | `id` | 节点唯一标识 |
| `node.label` | `label` | 显示文本 |
| `node.x / node.y` | `x / y` | preset layout 坐标 |
| `masteryLevel` | `style.fill` | GREEN/YELLOW/RED/GRAY |
| `isRecommended` | 蓝色外圈 + pulse 动画 | 学生视图 |
| `isWeakTop` | 红色虚线外环 | 教师视图 |
| `edge.isRecommendedPath` | 绿色虚线 | 推荐路径边 |

### 7.3 双视图渲染逻辑

同一 `/graph?role=` API，服务端返回不同 `masteryScore` 和 `meta` 字段。前端只做渲染映射，不计算掌握度。

---

## 8. API 层封装约定

| 约定 | 说明 |
|------|------|
| 基地址 | `http://localhost:8080/api`（环境变量 `VITE_API_BASE_URL`） |
| 鉴权 | JWT 存 `localStorage.top_token`，axios 拦截器自动注入 |
| 401 | 清除 token → 跳转 `/login` |
| 超时 | 普通请求 30s，Agent 请求 35s |
| 响应格式 | `{ code, data, message }`，仅取 `data` 字段 |
| Mock 开发 | `src/mock/` 目录，函数签名与 `src/api/` 一致 |

---

## 9. 状态管理方案

| 状态 | 方案 | 理由 |
|------|------|------|
| 用户认证（token, role, user） | React Context + localStorage | 全局需要 |
| 通知未读数 | 组件内 state + 30s 轮询 | 仅 Header 使用 |
| 图谱数据 | 页面内 useState + useEffect | 切换课程时重新 fetch |
| 测验作答 | 页面内 useReducer | 多题状态 |
| API 缓存 | 无 | MVP 不引入 React Query |

**原则**：MVP 不引入 Zustand / Redux。

---

## 10. 非功能要求

| 指标 | 目标 | 实现方式 |
|------|------|----------|
| 图谱首屏 | < 3s（35 节点） | G6 preset layout，无自动布局 |
| 页面切换 | < 200ms | React.lazy + Suspense |
| 浏览器 | Chrome / Edge 最新版 | - |
| 色彩一致性 | CSS 变量 100% 覆盖 | global.css + theme.ts |
| 暗色模式 | 不做 | 仅浅色主题 |

---

## 11. 测试策略

| 层级 | 内容 |
|------|------|
| 页面 | 开发模式下逐页验收（`?dev=teacher`） |
| 组件 | 各页面 Loading / Empty / Error 三态检查 |
| 联调 | 通过 Postman 验证 API 响应格式后接入 |
| E2E | 对照 demo-seed-spec.md 5 分钟 Demo 剧本完整走通 |

---

## 12. 评审 Checklist

- [ ] Dev1/2 确认技术选型无异议
- [ ] Dev1 确认 GraphCanvas Props 与 G6 数据映射对齐 api-spec
- [ ] Dev3/4 确认前端仅调 Spring :8080
- [ ] 全员确认 CSS 变量命名无冲突
- [ ] 路由表与 frontend-routes.md 一致
- [ ] 状态管理不引入过度工程化方案
- [ ] Demo 剧本可完整走通

---

*本文档为前端模块设计唯一权威来源。修改需更新版本号并通知全员。*

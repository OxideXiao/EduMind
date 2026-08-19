# 系统架构设计文档（Architecture Design）

| 项目 | 内容 |
|------|------|
| 文档版本 | v0.1 |
| 状态 | 待评审 |
| 对齐 PRD | [product/PRD-v0.2.md](./product/PRD-v0.2.md) |
| 关联 Spec | api-spec / tech-setup / llm-prompt-spec |

---

## 1. 文档目的与范围

本文档描述 **基于知识图谱与多智能体协同的智慧教学辅助平台** MVP 的系统级架构：分层、组件边界、数据流、部署与关键设计约束。

**不包含**（见对应文档）：

| 内容 | 文档 |
|------|------|
| 产品功能与 MVP 范围 | [product/PRD-v0.2.md](./product/PRD-v0.2.md) |
| 接口字段与 JSON 示例 | api-spec.md |
| Agent 模块内部设计 | design/agent-module.md |
| 前端/后端模块设计（待补充） | design/frontend-module.md、design/backend-module.md |
| Dev5 对齐与待改项 | spec-alignment-notes.md |
| 环境变量与启动命令 | tech-setup.md |

---

## 2. 架构目标与约束

### 2.1 业务目标（摘自 PRD）

- **教师**：班级知识图谱 + 学情看板 + AI 教学建议
- **学生**：个人掌握图谱 + AI 学习计划 + 智能提醒
- **AI 原生**：Heartbeat 自主扫描学情；记忆机制支撑个性化

### 2.2 架构约束（MVP）

| 约束 | 说明 |
|------|------|
| 时间 | 10 工作日 / 5 人 |
| 部署 | 单机 Demo；三进程（前端 + Spring + Agent） |
| AI 架构 | 统一 Agent 编排服务；**非** 4 独立 Agent 微服务 |
| 数据 | PostgreSQL 单库；**无** 向量库 / 独立 Memory 服务 |
| 安全 | 前端不直连 Agent；学情数据不出校（LLM 按比赛要求配置） |

### 2.3 质量属性（MVP 级别）

| 属性 | 目标 |
|------|------|
| 可演示性 | Day 10 完整 Demo 剧本可稳定跑通 |
| 可维护性 | 前后端 + Agent 职责清晰，Spec 驱动联调 |
| 性能 | 图谱 35–200 节点 < 3s；LLM 30s 超时 |
| 可观测 | Heartbeat 日志；Agent 决策可追溯 |

---

## 3. 逻辑架构（C4 Context + Container）

### 3.1 系统上下文

```text
                    ┌─────────────┐
                    │   教师用户   │
                    └──────┬──────┘
                           │
    ┌─────────────┐          │          ┌─────────────┐
    │   学生用户   │◄─────────┼─────────►│  LLM 云服务   │
    └──────┬──────┘          │          │ DeepSeek等  │
           │                 │          └──────▲──────┘
           │                 ▼                 │
           │     ┌───────────────────────┐     │
           └────►│  智慧教学辅助平台 MVP   │─────┘
                 │  (本系统)              │
                 └───────────────────────┘
                           │
                           ▼
                 ┌───────────────────────┐
                 │  PostgreSQL / MinIO   │
                 └───────────────────────┘
```

### 3.2 容器图（部署单元）

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (5173)                            │
│  React + TS + AntD + G6 + ECharts                               │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/HTTP  REST + JWT
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Spring Boot 主后端 (8080)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Auth     │ │ Course   │ │ Graph    │ │ Quiz     │           │
│  │ Module   │ │ Module   │ │ Module   │ │ Module   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Analytics│ │ Notify   │ │ Agent    │ │ Scheduler│           │
│  │ Module   │ │ Module   │ │ Proxy    │ │ (22:00)  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP + X-Internal-Token
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Agent Service  Python FastAPI (8000)                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ LLM Orchestrator（无状态）                                │   │
│  │  Heartbeat │ LearningPlan │ Reminder │ MemoryUpdate     │   │
│  │            │ TeachingSuggestion                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  prompts/ │ chains/ │ services/spring_client.py                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ OpenAI-compatible API
                             ▼
                      External LLM API
```

### 3.3 调用边界（强制）

| 调用方 | 被调用方 | 允许 | 禁止 |
|--------|----------|------|------|
| Browser | Spring 8080 | ✅ | — |
| Browser | Agent 8000 | ❌ | 安全 + 简化前端 |
| Spring | Agent 8000 | ✅ | — |
| Agent | Spring 8080 | ✅ 内部 API | 直连 DB |
| Agent | LLM API | ✅ | — |
| Spring | PostgreSQL | ✅ | — |

---

## 4. 组件职责矩阵

| 组件 | 端口 | 负责人 | 核心职责 | 持久化 |
|------|------|--------|----------|--------|
| **Frontend** | 5173 | Dev1/2 | 双视图图谱、看板、测验 UI、通知 | 无（Token localStorage） |
| **Spring Backend** | 8080 | Dev3/4 | 业务 CRUD、鉴权、学情聚合、Agent 代理、定时调度 | PostgreSQL |
| **Agent Service** | 8000 | Dev5 | LLM 编排、Prompt 链、Heartbeat 逻辑 | **无**（无状态） |
| **PostgreSQL** | 5432 | Dev3 | 用户/课程/图谱/掌握度/记忆/通知 | — |
| **MinIO**（可选） | 9000 | Dev3 | 课件 PDF/PPT 存储 | 对象存储 |

---

## 5. Spring 后端模块划分

> 详细接口见 `api-spec.md`；模块详细设计见 `design/backend-module.md`（待 Dev3/4 补充）。

```text
backend/
├── auth/           # 注册、登录、JWT、角色
├── course/         # 课程、邀请码、成员
├── graph/          # 知识点、关系、图谱 API（含 role 差异化）
├── resource/       # 教学资源上传与绑定
├── quiz/           # 题库、组卷、提交、计分
├── mastery/        # 掌握度计算与更新（Dev4）
├── analytics/      # 学情聚合、daily 接口、dashboard（Dev4）
├── notification/   # 通知 CRUD
├── memory/         # student_memory GET/PUT（供 Agent 调用）
├── agent/          # Agent 代理层：转发至 agent-service
├── scheduler/      # @Scheduled Heartbeat 触发
└── dev/            # seed、手动 heartbeat（仅 dev profile）
```

### 5.1 模块依赖关系

```text
quiz ──submit──► mastery ──update──► student_mastery
                      │
                      └──► learning_logs
analytics ◄──read── mastery + logs + quiz_submissions
agent/proxy ──HTTP──► agent-service
scheduler ──trigger──► agent/proxy ──► heartbeat
agent-service ──read/write──► memory + notification + analytics
```

### 5.2 掌握度与学情（规则层在 Spring，非 LLM）

| 规则 | 负责模块 | 说明 |
|------|----------|------|
| 掌握度公式 | mastery | 新分×0.6 + 历史均分×0.4；0–100 |
| 图谱颜色 | graph | 绿≥80 / 黄≥60 / 红<60 / 灰=0 |
| 风险学生 | analytics | 3 天未学 OR 平均掌握度 < 40 |
| 测验骤降提醒 | quiz + agent | 下降 ≥15% → 调 Agent reminder |

**原则**：可规则化的 **不算 LLM**；LLM 负责摘要、文案、计划与自然语言建议。

---

## 6. Agent 编排层（概要）

> 完整设计见 **`design/agent-module.md`**。

MVP 将「多智能体」实现为 **一个 Agent 服务内的四类能力**（非四个微服务）：

| 能力 | 触发 | 输出 |
|------|------|------|
| Heartbeat | Spring 22:00 定时 | 批量提醒 + 记忆更新 |
| Reminder | Heartbeat / 测验骤降 | 通知 JSON |
| Memory Update | Heartbeat 内 | memory_json |
| Learning Plan | 学生点击 | 计划 JSON → 存库 |
| Teaching Suggestion | 教师点击 | 建议 JSON |

**记忆架构**：存 Spring、算 Agent（详见 spec-alignment-notes §2）。

---

## 7. 前端架构（概要）

> 详细设计见 **`design/frontend-module.md`**（待 Dev1/2 补充）。

```text
frontend/src/
├── api/            # 仅指向 Spring 8080
├── pages/          # 按 frontend-routes.md
├── components/
│   ├── graph/      # G6 图谱（Dev1 核心）
│   └── layout/     # AppLayout、NotificationBell
├── hooks/          # useAuth
└── routes/         # 角色路由守卫
```

**核心设计点**：同一 `GET /graph` API，学生/教师视图由服务端 `masteryScore` / `meta` 差异化，前端只做渲染映射。

---

## 8. 核心数据流

### 8.1 学生学习闭环

```text
学生 → 图谱页 → 点击节点 → 学习资源 → 提交测验
  → Spring quiz.submit
  → mastery 更新 student_mastery + learning_logs
  → 返回 masteryUpdates
  → 图谱刷新（颜色变化）
```

### 8.2 Heartbeat 自主运营（AI 原生核心）

```text
Spring Scheduler 22:00
  → POST Agent /api/agent/heartbeat
  → Agent: GET Spring /api/analytics/daily
  → foreach student:
        GET memory
        LLM reminder → POST notification
        LLM memory-update → PUT memory
  → 返回汇总 → 写 heartbeat_logs
```

### 8.3 学习计划（用户触发）

```text
学生点击「生成计划」
  → Spring POST .../agent/learning-plan
  → Spring 组装 mastery + memory
  → Agent POST /api/agent/learning-plan
  → Spring POST /api/learning-plans 存库
  → 前端展示 daily_plan
```

### 8.4 教学建议（用户触发）

```text
教师点击「生成建议」
  → Spring 读 dashboard 薄弱点
  → Agent POST /api/agent/teaching-suggestion
  → 返回 problem + suggestions → 前端展示
```

---

## 9. 数据架构

### 9.1 数据分层

| 层级 | 存储 | 性质 |
|------|------|------|
| **事实数据** | student_mastery, learning_logs, quiz_submissions | Source of Truth |
| **AI 摘要** | student_memory.memory_json | LLM 维护的压缩画像 |
| **AI 产出** | learning_plans, notifications | 可再生的生成物 |
| **配置数据** | knowledge_nodes, questions, resources | 教师维护 |

### 9.2 核心 ER（简化）

```text
users ──< course_members >── courses ──< knowledge_nodes
                              │              │
                              │              └──< node_relations
                              ├──< resources / questions / quizzes
                              │
students ──< student_mastery (× nodes)
         ──< student_memory (× courses)
         ──< learning_logs
         ──< notifications
         ──< learning_plans
```

完整字段见 `api-spec.md` 与 `tech-setup.md` §1.1 DDL。

---

## 10. 部署架构（MVP Demo）

```text
┌─────────────────── 单机 / 云主机 ───────────────────┐
│  docker compose                                      │
│    ├── postgres:5432                                 │
│    ├── minio:9000        (可选)                      │
│    └── redis:6379        (可选)                      │
│                                                      │
│  java -jar backend.jar         :8080                 │
│  python agent-service/main.py  :8000  (内网)         │
│  npm run dev / nginx static    :5173                 │
└──────────────────────────────────────────────────────┘
```

**生产化（非 MVP）**：Agent 与 Spring 可容器化；LLM 走校内网关；MinIO 换 OSS。

---

## 11. 安全架构

| 链路 | 机制 |
|------|------|
| 前端 → Spring | JWT Bearer；角色 TEACHER/STUDENT |
| Spring → Agent | 内网 + `X-Internal-Token` |
| Agent → Spring 内部 API | 同 Token；不暴露公网 |
| Agent → LLM | API Key；Prompt 脱敏（不传密码等） |
| dev seed | `@Profile("dev")` 或环境开关 |

---

## 12. AI 原生性说明（赛题对齐）

| 能力 | 离开 AI 能否运行 | MVP 实现 |
|------|------------------|----------|
| 个性化提醒文案 | 否（需 NLG） | reminder chain |
| 学生记忆摘要更新 | 否 | memory-update chain |
| 学习计划 | 否 | learning-plan chain |
| 教学建议 | 否 | teaching-suggestion chain |
| Heartbeat 自主扫描 | 调度在 Spring；**生成在 Agent** | 组合体现 AI 原生 |
| 掌握度/风险/图谱颜色 | **是**（规则引擎） | Spring mastery/analytics |

答辩要点：**规则算事实，LLM 做理解、摘要与个性化生成；Heartbeat 体现「AI 主动运营」。**

---

## 13. 演进路线（Post-MVP）

| 阶段 | 架构变化 |
|------|----------|
| v1 MVP | 三容器 + 串行 Agent |
| v1.1 | Agent 事件驱动（测验提交发事件） |
| v2 | 大纲 AI 导入；RAG 答疑 |
| v3 | 独立 Memory/RAG 服务；多 Agent 编排器 |

PRD 已砍项不在 MVP 实现。

---

## 14. 文档体系与评审关系

```text
docs/product/PRD-v0.2.md      产品范围
    ↓
architecture.md（本文档）     系统架构 ← 架构评审
    ↓
api-spec / llm-prompt-spec    接口与 Prompt 契约
    ↓
design/*-module.md            模块详细设计 ← 模块评审
    ↓
spec-alignment-notes.md       Dev5 对齐待改项（保留）
    ↓
代码
```

---

## 15. 架构评审 Checklist

- [ ] 全员确认三容器边界（前端 / Spring / Agent）
- [ ] Dev3/4 确认 Spring 模块划分（§5）
- [ ] Dev5 确认 Agent 无状态 + 记忆存 Spring（§6）
- [ ] Dev1/2 确认前端只调 Spring（§7）
- [ ] 确认掌握度/风险在 Spring、LLM 在 Agent（§5.2、§12）
- [ ] 确认 Heartbeat 由 Spring 调度（§8.2）

---

*架构变更请更新本文档版本号，并在 spec-alignment-notes 或后续 ADR 中记录原因。*

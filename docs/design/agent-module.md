# Agent 模块详细设计（Module Design）

| 项目 | 内容 |
|------|------|
| 文档版本 | v0.1 |
| 状态 | 待 Dev5 确认 |
| 负责人 | Dev 5 |
| 上级文档 | architecture.md §6 |
| 接口契约 | api-spec.md §9–§11 |
| Prompt 契约 | llm-prompt-spec.md |
| 对齐待改 | spec-alignment-notes.md §3 |

> 本文档从 `参考/Agent专责实施指南.md` 提炼，去掉教程式代码，保留**组件结构、工作逻辑、技术选型**。
> 实现代码可参考原指南；**设计决策以本文档 + Spec 为准**。

---

## 1. 模块定位

### 1.1 职责

Agent 模块是系统的 **LLM 编排层**：接收 Spring 请求，调用大模型，返回结构化 JSON；**不**承担业务持久化（除日志）。

### 1.2 不负责

| 事项 | 负责方 |
|------|--------|
| 用户鉴权、课程 CRUD | Spring |
| 掌握度计算、学情聚合 | Spring（Dev4） |
| memory / notification 持久化 | Spring |
| 定时任务注册（22:00） | Spring Scheduler |
| 前端展示 | Frontend |

### 1.3 MVP 范围内的「多智能体」

**逻辑上** 四类 Agent 能力；**物理上** 一个 FastAPI 服务 + 多套 Prompt Chain（PRD 已砍独立 Agent 微服务）。

| 逻辑 Agent | 实现文件 | 优先级 |
|------------|----------|--------|
| 课程运营（Heartbeat + Reminder） | `services/heartbeat_service.py` | P0 |
| 记忆更新 | `chains/memory.py` | P0 |
| 学习计划 | `services/learning_plan_service.py` | P1 |
| 教学建议 | `chains/teaching_suggestion.py` | P1 |

---

## 2. 技术选型

| 类别 | 选型 | 理由 |
|------|------|------|
| Web 框架 | FastAPI 0.115 + uvicorn | 异步、OpenAPI、与 Spring HTTP 联调简单 |
| LLM 框架 | LangChain LCEL | Prompt \| LLM \| Parser 链式组合 |
| LLM 接入 | langchain-openai（兼容 API） | 可切换 DeepSeek / 深信服 / Ollama |
| HTTP 客户端 | httpx | 异步调用 Spring 内部 API |
| 配置 | python-dotenv | 本地 .env |
| 默认模型 | deepseek-chat | 成本低、中文好（可配置） |
| 降级 | Coze / Dify（AGENT_ENGINE 开关） | Day 8 前备选，见 tech-setup §10 |

**依赖清单**：见原指南 §4.1 `requirements.txt`。

---

## 3. 目录结构

```text
agent-service/
├── main.py                      # FastAPI 路由注册
├── config.py                    # 环境变量
├── requirements.txt
├── .env
├── prompts/
│   ├── memory.py
│   ├── reminder.py
│   ├── learning_plan.py
│   └── teaching_suggestion.py   # 独立，不复用 learning_plan
├── chains/
│   ├── base.py                  # get_llm / get_structured_llm
│   ├── memory.py
│   ├── heartbeat.py             # reminder chain
│   ├── learning_plan.py
│   └── teaching_suggestion.py
├── models/
│   ├── requests.py              # Pydantic 请求体
│   └── responses.py             # AgentResponse
├── services/
│   ├── spring_client.py         # 调用 Spring 内部 API
│   ├── heartbeat_service.py     # Heartbeat 编排
│   └── learning_plan_service.py
└── utils/
    └── logger.py
```

---

## 4. 组件设计

### 4.1 组件图

```text
┌─────────────────────────────────────────────────────────┐
│                      main.py (Router)                    │
│  /health │ /heartbeat │ /learning-plan │ /reminder     │
│          │ /memory-update │ /teaching-suggestion        │
└──────────────────────────┬──────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────────┐ ┌──────────────┐ ┌──────────────────┐
│ heartbeat_      │ │ learning_    │ │ chains/*         │
│ service         │ │ plan_service │ │ (单能力链)        │
└────────┬────────┘ └──────┬───────┘ └────────┬─────────┘
         │                 │                   │
         └─────────────────┼───────────────────┘
                           ▼
                  ┌─────────────────┐
                  │  spring_client  │
                  └────────┬────────┘
                           ▼
                    Spring Boot :8080
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
            ChatOpenAI          External LLM
            (chains/base)       API
```

### 4.2 spring_client（基础设施组件）

**职责**：封装对 Spring 内部 API 的 HTTP 调用；统一 Header `X-Internal-Token`。

| 方法 | Spring API | 说明 |
|------|------------|------|
| `fetch_daily_analytics(course_id, date)` | GET `/api/analytics/daily` | Heartbeat 入口 |
| `fetch_memory(student_id, course_id)` | GET `.../memory?course_id=` | **含 course_id** |
| `update_memory(student_id, course_id, json)` | PUT `.../memory?course_id=` | |
| `create_notification(...)` | POST `/api/notifications` | user_id + course_id |
| `save_learning_plan(...)` | POST `/api/learning-plans` | |

> **Dev5 待改**：原指南 memory 接口无 `course_id`，以 Spec 为准（spec-alignment-notes §3.1）。

### 4.3 chains/base（LLM 工厂）

| 函数 | temperature | 用途 |
|------|-------------|------|
| `get_llm(0.7)` | 0.7 | 学习计划（多样性） |
| `get_structured_llm()` | 0.1 | 记忆、提醒、建议（稳定 JSON） |

超时：30s（tech-setup §9）。

### 4.4 输出解析（共用策略）

三层容错 JSON 解析（见 llm-prompt-spec §1、原指南 §11.1）：

1. 直接 `json.loads`
2. 去 markdown ``` 包裹
3. 正则提取 `{...}`

解析失败：reminder/memory 用降级默认值；plan/suggestion 返回 error 给 Spring。

---

## 5. 核心工作流

### 5.1 Heartbeat（P0，Demo 核心）

**触发**：Spring `@Scheduled(cron = "0 0 22 * * ?")` → `POST /api/agent/heartbeat`

**编排类**：`HeartbeatService.run_heartbeat(course_id?)`

```text
1. GET analytics/daily → students[]
2. FOR each student:
     a. GET memory(student, course)
     b. reminder_chain.invoke(学情 + memory) → {title, content, priority}
     c. POST notification
     d. memory_chain.invoke(旧memory + 今日学情) → new_memory_json
     e. PUT memory
3. RETURN { total, success, details[] }
```

**单学生失败**：log + continue，不阻断批次。

**LLM 次数**：每学生 2 次（reminder + memory）。

### 5.2 实时提醒（P0）

**触发**：Spring 检测测验提交后某节点掌握度下降 ≥ 15%

**路径**：Spring → `POST /api/agent/reminder`（或经 Agent Proxy）

**输入**：ReminderRequest（见 api-spec §10）

**输出**：通知 JSON → Spring 写 notifications

### 5.3 学习计划（P1）

**触发**：学生点击 → Spring Proxy → Agent

**编排类**：`LearningPlanService.generate_plan(...)`

```text
1. GET memory
2. learning_plan_chain.invoke(name, course, mastery, memory)
3. parse_plan_output → POST learning-plans
4. RETURN plan + plan_id
```

### 5.4 教学建议（P1）

**触发**：教师点击 → Spring 读 dashboard → Agent

**链**：`teaching_suggestion_chain`（**独立 Prompt**，见 llm-prompt-spec §5）

> **Dev5 待改**：原指南 main.py 误复用 `build_learning_plan_chain()`（spec-alignment-notes §3.3）。

### 5.5 记忆更新（独立端点，可选）

`POST /api/agent/memory-update` 暴露为独立 API，供调试；**生产路径在 Heartbeat 内联调用**。

---

## 6. 记忆子系统（模块内视角）

| 项目 | 设计 |
|------|------|
| 存储 | **不在 Agent**；Spring `student_memory` 表 |
| 格式 | JSON（见 llm-prompt-spec §2.5） |
| 作用域 | `(student_id, course_id)` |
| 读取 | Heartbeat、LearningPlan 前 GET |
| 写入 | Heartbeat 后 PUT |
| 初始值 | Seed 预置或 `{}` |

---

## 7. API 端点汇总

| 方法 | 路径 | 调用方 | 说明 |
|------|------|--------|------|
| GET | `/health` | 运维 | 健康检查 |
| POST | `/api/agent/heartbeat` | Spring Scheduler | 批量运营 |
| POST | `/api/agent/reminder` | Spring | 单条提醒 |
| POST | `/api/agent/memory-update` | 调试 / Spring | 记忆更新 |
| POST | `/api/agent/learning-plan` | Spring Proxy | 计划生成 |
| POST | `/api/agent/teaching-suggestion` | Spring Proxy | 教学建议 |

请求/响应 JSON：**以 api-spec.md §10 为准**。

---

## 8. 与 Spring 的协作契约

```text
┌─────────────── Spring ───────────────┐
│ AgentProxyController                 │
│   learning-plan / teaching-suggestion│
│   trigger-reminder                   │
│ Scheduler → heartbeat                │
│ Internal APIs ← Agent spring_client  │
└──────────────────┬───────────────────┘
                   │ HTTP
┌──────────────────▼───────────────────┐
│           Agent Service              │
└──────────────────────────────────────┘
```

**数据组装在 Spring**：Agent 收到的 Request 应已包含 `knowledge_mastery`（0–1）、`memory_json` 等；Agent **不**直接查 PostgreSQL。

---

## 9. 非功能设计

| 项 | 要求 |
|----|------|
| 无状态 | 无本地 DB；重启可恢复 |
| 超时 | LLM 30s；httpx 30s |
| 并发 | MVP 串行处理学生；3–30 人 Demo 足够 |
| 日志 | 每次 LLM 调用：student_id、能力名、耗时、success |
| 密钥 | 仅 .env；不进 Git |

---

## 10. 测试策略（Dev5）

| 层级 | 内容 |
|------|------|
| Prompt 单测 | `llm-prompt-spec.md` §7 三组用例 |
| Chain 单测 | mock LLM 返回固定 JSON |
| 集成 | Postman 调 `/reminder`；再联 Spring |
| E2E | 手动 Heartbeat → 检查 notification + memory version |

---

## 11. Dev5 确认清单（对照 spec-alignment-notes §3）

- [ ] memory API 已加 `course_id`
- [ ] 教学建议使用独立 chain，非 learning_plan
- [ ] 不实现 `POST /api/analytics/daily` 写入
- [ ] 不在 Agent 本地持久化 memory
- [ ] spring_client 使用 `X-Internal-Token`
- [ ] 通知 Body 使用 `user_id` + `course_id`

确认后在 spec-alignment-notes §5 Checklist 打勾。

---

## 12. 参考文档索引

| 需求 | 文档 |
|------|------|
| 教程式代码、requirements、Coze 降级 | `参考/Agent专责实施指南.md` |
| Prompt 全文 | `llm-prompt-spec.md` |
| 接口 JSON | `api-spec.md` |
| 架构上下文 | `architecture.md` |
| 待改项跟踪 | `spec-alignment-notes.md` |

---

*模块设计变更需 Dev5 更新本文档，并通知 Dev3（接口）联调。*

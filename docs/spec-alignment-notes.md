# Spec 对齐说明（Dev5 确认用）

> 对照 [product/PRD-v0.2.md](./product/PRD-v0.2.md) 与 `参考/Agent专责实施指南.md` 的差异及处理决策。
> **用途**：供 Dev5 确认 Agent 指南需改动项；确认后在 §5 Checklist 打勾。
> **保留策略**：评审后**不删除**；模块设计冻结后仍可作为变更追溯。
> **正式架构**：见 `architecture.md`；Agent 模块设计见 `design/agent-module.md`。

---

## 1. 需团队确认的差异（已在 Spec 中按建议方案编写）


| #   | 差异点              | PRD v0.2                       | Agent 指南                            | Spec 采用方案                                                          | 理由                               |
| --- | ---------------- | ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ | -------------------------------- |
| 1   | **后端架构**         | Python FastAPI 单体              | Spring Boot + Python Agent 服务       | **Spring + Agent**                                                 | 以 Dev5 已出方案为准，分工清晰               |
| 2   | **记忆存储格式**       | `memory` TEXT，中文段落             | `memory_json` 结构化 JSON              | **JSON**                                                           | LLM 解析稳定；Heartbeat/计划共用          |
| 3   | **记忆作用域**        | `student_memory` 含 `course_id` | 接口仅 `student_id`                    | **加 `course_id` 参数**                                               | 一学生多课程，必须分课程记忆                   |
| 4   | **掌握度数值**        | 0–100 整数                       | 0–1 浮点                              | **对外 0–100，Agent 层可转 0–1**                                         | 前端图谱/看板用百分制；Agent Prompt 用比例     |
| 5   | **教学建议路径**       | `/api/agent/teaching-advice`   | `/api/agent/teaching-suggestion`    | **teaching-suggestion**                                            | 沿用 Agent 指南命名                    |
| 6   | **实时提醒**         | `/api/agent/trigger-reminder`  | `/api/agent/reminder`               | **两者并存**：Spring 调 `reminder`；对外文档保留 `trigger-reminder` 为 Spring 封装 | 前端只调 Spring，不直连 Agent            |
| 7   | **通知字段**         | `notifications.user_id`        | `POST` Body 用 `student_id`          | **统一 `user_id`**                                                   | 与 JWT 用户体系一致；学生即 user            |
| 8   | **学情写入**         | 无写入 API                        | Seed 脚本 `POST /api/analytics/daily` | **MVP 不做该 POST**；Seed 走 `POST /api/dev/seed` 或 SQL                 | 学情应由学习行为聚合，不应手工 POST 伪造（Demo 除外） |
| 9   | **Heartbeat 调度** | Agent 内定时                      | Spring `@Scheduled` 调 Agent         | **方案 A（Spring 调度）**                                                | Agent 指南推荐；写库走 Spring 事务         |
| 10  | **LLM 选型**       | 深信服 API 优先                     | DeepSeek 推荐                         | **.env 可配置**；比赛演示优先合规可用 API                                        | 两者不冲突                            |


---

## 2. 记忆系统架构决策（Dev 3 / Dev 5 必读）

> **结论**：记忆 **存 Spring、算 Agent**；不做 Agent 私有库，不做独立 Memory 服务。

### 2.1 两个概念不要混


| 概念                    | 含义                                     | 负责方                                 |
| --------------------- | -------------------------------------- | ----------------------------------- |
| **记忆存储（Persistence）** | `student_memory` 表中的 `memory_json` 持久化 | **Spring 后端**                       |
| **记忆更新（Computation）** | LLM 读取旧记忆 + 学情 → 生成新 JSON              | **Agent 服务**（`memory-update` chain） |


Agent 指南中的真实模式是：

```text
Agent 读记忆  ←  Spring GET /api/students/{id}/memory?course_id=
Agent 调 LLM 更新记忆（chains/memory.py）
Agent 写记忆  →  Spring PUT /api/students/{id}/memory?course_id=
```

**不是**「记忆全在后端计算」，而是 **「记忆存在后端，更新在 Agent」**。

### 2.2 三种方案对比


| 方案                            | 做法                        | MVP 评价                   |
| ----------------------------- | ------------------------- | ------------------------ |
| **A. 存 Spring + 算 Agent**（采用） | 业务库为权威源；Agent 无状态         | ✅ **推荐**                 |
| **B. 存 Agent 本地**             | SQLite / JSON 文件在 Agent 内 | ❌ 双数据源、Seed 困难、Agent 有状态 |
| **C. 独立 Memory 服务**           | 向量库 / 专用微服务               | ❌ 10 天过度设计；PRD 已砍向量库     |


### 2.3 为什么记忆存 Spring 合理

记忆本质是 **「面向 LLM 的学情摘要」**，不是原始事实。事实源（Source of Truth）在：

```text
student_mastery   — 掌握度
learning_logs     — 行为日志
quiz_submissions  — 测验结果
```

`memory_json` 是 LLM 对上述数据的 **压缩画像**，类似用户画像字段，应与业务数据同库、同权限域。


| 存 Spring 的好处     | 说明                         |
| ---------------- | -------------------------- |
| 与 Seed / Demo 一致 | `POST /api/dev/seed` 一次写入  |
| 前端/教师可扩展         | MVP 可不展示；后续下钻可查 memory     |
| Agent 无状态        | 重启不丢数据，易部署                 |
| 权限清晰             | 走 JWT / 内部 Token，不暴露 Agent |


### 2.4 职责边界（冻结）


| 层级                  | 职责                                                                                             | 禁止                        |
| ------------------- | ---------------------------------------------------------------------------------------------- | ------------------------- |
| **Spring（Dev 3/4）** | 表 `student_memory(student_id, course_id, memory_json, updated_at)`；GET/PUT API；鉴权；与掌握度/日志同一数据库 | 不调 LLM                    |
| **Agent（Dev 5）**    | `memory-update` Prompt + Chain；Heartbeat / 计划生成前读取 memory；更新后写回 Spring                         | **不在 Agent 本地持久化 memory** |
| **前端（Dev 1/2）**     | MVP 仅展示计划/提醒结果；不直连 memory API                                                                  | 不调 Agent                  |


### 2.5 Heartbeat 中的记忆流

```text
Spring @Scheduled 22:00
  → POST Agent /api/agent/heartbeat
      → Spring GET /api/analytics/daily
      → 对每个学生：
          ① Spring GET memory
          ② Agent LLM reminder
          ③ Agent LLM memory-update
          ④ Spring POST notification
          ⑤ Spring PUT memory
```

### 2.6 何时才需要独立 Memory 服务（非 MVP）

- 跨会话 RAG / embedding 检索
- 多 Agent 共享、版本化长期记忆
- 记忆体量超出单行 JSON（聊天记录级）

当前：每学生每课程 **一条 JSON 摘要**，独立服务 **收益 < 成本**。

### 2.7 答辩表述（可直接用）

> 学生记忆是 AI 维护的学情摘要，持久化在业务数据库；Agent 在 Heartbeat 和学习计划生成时读取并更新，保证提醒与计划的个性化和连续性。原始学情仍由掌握度与行为日志保证可追溯。

### 2.8 可选优化（第二阶段，MVP 不做）

1. **Agent 只读、Spring 写**：Heartbeat 返回 `{ reminder, new_memory }`，由 Spring 统一 PUT（事务更干净）
2. **规则 + LLM 混合**：`weak_points` 由掌握度规则计算，LLM 只写 `summary` / `behavior_notes`

---

## 3. Agent 指南中建议修正的点

### 3.1 记忆接口缺少 `course_id`（**必须改**）

原指南：

```
GET /api/students/{student_id}/memory
```

**问题**：同一学生选修多门课时，记忆会串课。

**Spec 修正**：

```
GET  /api/students/{studentId}/memory?course_id={courseId}
PUT  /api/students/{studentId}/memory?course_id={courseId}
```

Agent 服务 `spring_client.py` 同步增加 `course_id` 参数。

### 3.2 Seed 脚本 `POST /api/analytics/daily`（**不建议实现**）

**问题**：`/api/analytics/daily` 应为**聚合查询**接口，不应承担写入；与 Heartbeat 数据口径冲突。

**Spec 修正**：提供 `POST /api/dev/seed`（仅 dev 环境）或直接 `seed.sql` 写入业务表 + 学习日志，由 Dev4 聚合 API 读出。

### 3.3 `main.py` 教学建议复用学习计划链（**代码 bug，Spec 已单列 Prompt**）

指南 5.3 节 `teaching-suggestion` 误复用 `build_learning_plan_chain()`。

**Spec 修正**：独立 `teaching_suggestion.py` Prompt/Chain（见 `llm-prompt-spec.md`）。

### 3.4 通知创建缺少 `course_id`（**建议补**）

Heartbeat 提醒应可跳转到课程页。

**Spec 修正**：`POST /api/notifications` Body 增加可选 `course_id`。

### 3.5 Agent 调用 Spring 无鉴权（**MVP 可接受，需约定**）

**问题**：Agent 服务直连 Spring 内部 API，无 Token。

**MVP 方案**：Agent 与 Spring 同机部署，`/api/internal/`** 仅内网访问；或 Header 传 `X-Internal-Token`。

---

## 4. 无需修改、直接沿用的内容

- Agent 服务目录结构（`prompts/`、`chains/`、`services/`）
- Heartbeat 五步流程（拉学情 → 提醒 → 更新记忆 → 写通知 → 写记忆）
- 四类 Agent 端点：`learning-plan`、`reminder`、`memory-update`、`teaching-suggestion`、`heartbeat`
- LangChain LCEL 链 + JSON 输出 + 容错解析
- DeepSeek / OpenAI 兼容 API 配置方式
- Coze/Dify 降级策略（写入 tech-setup，不阻塞主路径）

---

## 5. 冻结前 Checklist

- [ ] Dev 3 确认 Spring 后端技术栈
- [ ] Dev 3 确认记忆/通知/学情接口 Path 与字段
- [ ] **Dev 3 / Dev 5 确认记忆架构：存 Spring、算 Agent（§2）**
- [ ] Dev 5 确认 Agent 端点与 Prompt 无变更
- [ ] Dev 5 确认 Agent **不在本地持久化** memory
- [ ] Dev 1/2 确认前端只调 Spring（端口 8080），不调 Agent（8000）
- [ ] 全员确认掌握度 0–100 与图谱颜色阈值（绿≥80 / 黄≥60 / 红<60 / 灰=0）
# 工程与环境约定（Tech Setup Spec）

> **版本**：v0.1 | **对齐**：PRD v0.2 + Agent 专责实施指南

---

## 1. 总体架构

```text
┌─────────────────────────────────────────────────────────┐
│  frontend/          React 18 + TypeScript + Vite        │
│                     Ant Design + AntV G6 + ECharts       │
│                     端口: 5173                           │
└──────────────────────────┬──────────────────────────────┘
                           │ REST + JWT
                           ▼
┌─────────────────────────────────────────────────────────┐
│  backend/           Spring Boot 3.x                     │
│                     端口: 8080                           │
│                     用户/课程/图谱/测验/学情/通知          │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP（内网 / X-Internal-Token）
                           ▼
┌─────────────────────────────────────────────────────────┐
│  agent-service/     Python FastAPI + LangChain           │
│                     端口: 8000                           │
│                     LLM 编排 / Heartbeat 逻辑            │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
                    LLM API（DeepSeek / 深信服 / Ollama）
```

**调用原则**

- 前端 **只访问 Spring**（`http://localhost:8080`）
- Agent 服务 **只被 Spring 调用**（前端不直连 8000）
- Heartbeat：Spring `@Scheduled(cron = "0 0 22 * * ?")` → `POST agent:8000/api/agent/heartbeat`

### 1.1 记忆系统职责边界

> 详见 `spec-alignment-notes.md` §2。**一句话：存 Spring，算 Agent。**

```text
┌─────────────────────────────────────────────────────────────┐
│  Spring（事实源 + 记忆持久化）                                  │
│  student_mastery / learning_logs / quiz_submissions         │
│  student_memory.memory_json  ← GET/PUT 权威存储              │
└───────────────────────────┬─────────────────────────────────┘
                            │ 内部 HTTP
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent（无状态，不本地存 memory）                               │
│  memory-update chain / reminder / learning-plan             │
│  读 memory → LLM → 写回 Spring                               │
└─────────────────────────────────────────────────────────────┘
```

| 组件 | 记忆相关职责 |
|------|--------------|
| Spring | 表 `student_memory(student_id, course_id, memory_json)`；`GET/PUT .../memory?course_id=` |
| Agent | `chains/memory.py` 更新逻辑；`spring_client.py` 读写 Spring；**禁止** Agent 本地 DB/文件存 memory |
| 前端 | MVP 不展示 memory；只展示计划/提醒结果 |

**DDL 要点**：

```sql
CREATE TABLE student_memory (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL,
  course_id  BIGINT NOT NULL,
  memory_json TEXT NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, course_id)
);
```

---

## 2. 仓库结构

```text
CCF-2026-TOP/
├── docs/                    # Spec 文档（本目录）
├── frontend/                # Dev 1 + Dev 2
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/             # axios 封装
│   │   └── routes.tsx
│   └── package.json
├── backend/                   # Dev 3 + Dev 4
│   ├── src/main/java/...
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/    # Flyway 或 schema.sql
├── agent-service/           # Dev 5（结构见 Agent 指南 §3）
│   ├── main.py
│   ├── prompts/
│   ├── chains/
│   ├── services/
│   └── seed/
├── docker-compose.yml         # PostgreSQL + Redis + MinIO（可选）
└── README.md
```

---

## 3. 技术栈

| 层 | 技术 | 负责人 |
|----|------|--------|
| 前端 | React 18, TS, Vite, Ant Design, AntV G6, ECharts, axios | Dev 1/2 |
| 主后端 | Spring Boot 3, Spring Security JWT, MyBatis/JPA, PostgreSQL | Dev 3/4 |
| Agent | FastAPI, LangChain, httpx, uvicorn | Dev 5 |
| 存储 | PostgreSQL 15, Redis（可选缓存）, MinIO（资源文件，可选） | Dev 3 |
| LLM | DeepSeek（默认）/ 比赛指定 API / Ollama 本地 | Dev 5 |

---

## 4. 环境变量

### 4.1 backend `.env` / `application.yml`

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/top_mvp
    username: top
    password: top123

jwt:
  secret: ${JWT_SECRET:dev-secret-change-me}
  expire-hours: 72

agent:
  base-url: http://localhost:8000
  internal-token: ${AGENT_INTERNAL_TOKEN:dev-internal-token}

minio:
  endpoint: http://localhost:9000
  access-key: minioadmin
  secret-key: minioadmin
  bucket: resources
```

### 4.2 agent-service `.env`

```env
LLM_API_KEY=sk-xxx
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat

SPRING_BASE_URL=http://localhost:8080
SPRING_INTERNAL_TOKEN=dev-internal-token

AGENT_PORT=8000
AGENT_ENGINE=langchain   # langchain | coze | dify
```

### 4.3 frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:8080
```

---

## 5. 本地启动（Day 2 目标：全员可跑通）

```bash
# 1. 基础设施
docker compose up -d   # postgres + redis + minio

# 2. 后端
cd backend && ./mvnw spring-boot:run

# 3. Agent
cd agent-service && pip install -r requirements.txt && python main.py

# 4. 前端
cd frontend && npm install && npm run dev

# 5. 演示数据（dev 环境）
curl -X POST http://localhost:8080/api/dev/seed
```

---

## 6. Git 分支策略

| 分支 | 用途 |
|------|------|
| `main` | 可演示稳定版 |
| `dev` | 每日集成 |
| `feat/xxx` | 个人功能分支，合并到 `dev` |

**PR 规则（MVP 简化）**：合并前至少 1 人 Review；联调通过的接口在 `docs/api-spec.md` 标记 ✅。

---

## 7. 统一响应格式（Spring 对外 API）

```json
{
  "code": 200,
  "message": "ok",
  "data": { }
}
```

| code | 含义 |
|------|------|
| 200 | 成功 |
| 400 | 参数错误 |
| 401 | 未登录 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

Agent 服务响应：

```json
{
  "success": true,
  "data": { },
  "error": null
}
```

---

## 8. 鉴权约定

### 8.1 前端 → Spring

```
Authorization: Bearer <jwt_token>
```

JWT Payload 建议：

```json
{ "userId": 1, "role": "TEACHER", "email": "teacher@demo.com" }
```

### 8.2 Spring → Agent

MVP：同机部署，无公网暴露 Agent 端口。

可选加固：

```
X-Internal-Token: dev-internal-token
```

### 8.3 Agent → Spring（内部 API）

```
X-Internal-Token: dev-internal-token
```

内部 API 前缀建议：`/api/internal/**` 或现有路径 + Token 校验。

---

## 9. 错误与超时

| 场景 | 策略 |
|------|------|
| LLM 调用 | 30s 超时；失败返回默认文案，不阻塞主流程 |
| Heartbeat 单学生失败 | 记录日志，继续下一个学生 |
| Heartbeat 整体 | 单次 < 10 分钟 |
| 前端 Loading | LLM 相关按钮显示「生成中…」，禁用重复点击 |

---

## 10. LLM 降级（Day 8 前备好）

`AGENT_ENGINE=coze` 或 `dify` 时，Agent 服务改用 HTTP 调用 Bot，Prompt 模板不变。

详见 Agent 指南 §10；**不阻塞 LangChain 主路径开发**。

---

## 11. 联调端口一览

| 服务 | 地址 | 健康检查 |
|------|------|----------|
| Frontend | http://localhost:5173 | 页面可开 |
| Spring | http://localhost:8080 | GET `/actuator/health` 或 `/api/health` |
| Agent | http://localhost:8000 | GET `/health` |
| PostgreSQL | localhost:5432 | — |

---

## 12. DoD（完成定义）速查

| 功能 | 验收 |
|------|------|
| F01 | 教师/学生注册登录，JWT 有效 |
| F02 | 教师建课得邀请码，学生加入成功 |
| F03/F04 | 图谱双视图颜色/高亮正确 |
| F05 | 看板四指标有数 |
| F06 | 提交测验后分数与掌握度更新 |
| F07 | 铃铛有未读，可标记已读 |
| F08 | 手动触发 Heartbeat 后产生通知 + 记忆更新 |
| F09 | `memory_json` 非空且 version 递增 |
| F10 | 点击生成计划，页面展示 daily_plan |
| F11 | 教师端展示教学建议 JSON |
| F12 | `POST /api/dev/seed` 后 Demo 可完整走通 |

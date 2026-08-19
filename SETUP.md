# 智慧教学平台 — 本地部署指南

> 适用分支：`integration-test` 及后续合并分支  
> 最后更新：2026-06-27

---

## 一、环境要求

| 组件 | 最低版本 | 说明 |
|------|---------|------|
| Java JDK | 17+ | 运行 Spring Boot 后端 |
| Node.js | 18+ | 运行 React 前端 |
| Python | 3.10+ | 运行 AI Agent 服务 |
| PostgreSQL | 14+ | 主数据库 |

---

## 二、拉取代码

```bash
git clone https://gitee.com/guilin-darong-culture/smart-teaching-platform.git
cd smart-teaching-platform
git checkout integration-test
```

---

## 三、安装 PostgreSQL 并创建数据库

### Windows

1. 下载安装包：https://www.postgresql.org/download/windows/
2. 安装时设置 postgres 用户密码为 `123456`（或记住你设的密码）
3. 端口保持默认 `5432`
4. 安装完成后打开 **SQL Shell (psql)** 或在终端执行：

```bash
psql -U postgres
```

输入密码后执行：

```sql
CREATE DATABASE teaching_ops;
\q
```

### macOS

```bash
brew install postgresql@16
brew services start postgresql@16
psql postgres
```

```sql
CREATE USER postgres WITH PASSWORD '123456';
CREATE DATABASE teaching_ops OWNER postgres;
\q
```

### Linux (Ubuntu)

```bash
sudo apt install postgresql
sudo -u postgres psql
```

```sql
ALTER USER postgres PASSWORD '123456';
CREATE DATABASE teaching_ops;
\q
```

> ⚠️ 如果 postgres 密码不是 `123456`，需要修改 `backend/src/main/resources/application.yml` 中的 `spring.datasource.password`

---

## 四、配置 LLM API Key（可选，但建议）

Agent 使用 DeepSeek 大模型生成学习计划和通知。

编辑 `agent-service/.env`（复制一份 `.env.example`）：

```env
LLM_API_KEY=你的DeepSeek_API_Key
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
SPRING_BASE_URL=http://localhost:8080
AGENT_PORT=8000
MOCK_SPRING=false
```

- DeepSeek API Key 获取：https://platform.deepseek.com/
- 如不想配 LLM，将 `MOCK_SPRING=true` 可跳过 Agent（但学习计划等功能走 mock）

---

## 五、启动服务

需要按顺序打开 **3 个终端窗口**：

### 终端 1：启动后端（Spring Boot）

```bash
cd backend

# Windows (使用 Maven Wrapper，无需安装 Maven)
mvnw spring-boot:run

# macOS / Linux
./mvnw spring-boot:run
```

看到 `Started SmartTeachingPlatformApplication` 表示启动成功。

首次启动会自动建表（schema.sql），端口 **8080**。

数据初始化：

```bash
curl -X POST http://localhost:8080/api/dev/seed
```

这步会灌入种子数据：教师 1 人 + 学生 9 人 + 课程 + 知识点 + 测验。

### 终端 2：启动 Agent 服务（Python）

```bash
cd agent-service

# 安装依赖（仅首次）
pip install fastapi uvicorn langchain-core langchain-openai httpx python-dotenv loguru

# 启动
python main.py
```

看到 `🚀 Agent Service 启动 — 引擎: langchain, Mock: False` 表示成功，端口 **8000**。

### 终端 3：启动前端（Vite）

```bash
cd frontend

# 安装依赖（仅首次）
npm install

# 启动开发服务器
npm run dev
```

看到 `➜ Local: http://localhost:5173/` 表示成功。

---

## 六、打开浏览器

访问 **http://localhost:5173**

---

## 七、测试账号

> 所有账号密码统一：`demo123456`

### 教师

| 邮箱 | 姓名 |
|------|------|
| teacher2@demo.com | 陈老师 |

### 学生

| 邮箱 | 姓名 | 平均分 | 特点 |
|------|------|--------|------|
| student1@demo.com | 张三 | 85% | 全面优秀 |
| student2@demo.com | 李四 | 53% | 中等偏下 |
| student3@demo.com | 王五 | 28% | 高危预警 |
| student4@demo.com | 赵六 | 89% | 学霸 |
| student5@demo.com | 孙七 | 50% | 进步型 |
| student6@demo.com | 周八 | 23% | 全低高危 |
| student7@demo.com | 吴九 | 56% | 偏科严重 |
| student8@demo.com | 郑十 | 95% | 几乎满分 |
| student9@demo.com | 钱一 | 58% | 分数波动 |

---

## 八、功能验证清单

### 基础功能

- [ ] 教师登录 → 能看到课程「数据结构与算法」（9 学生 · 35 知识点）
- [ ] 点击课程 → 知识图谱正常显示（35 个节点+连线）
- [ ] 知识点可点击 → 弹出学生列表（9 人）
- [ ] 学情看板 → 显示图表 + 风险学生 + 全班学生列表
- [ ] 教师点「手动执行 Heartbeat」→ 等待 30-60s → 成功提示

### AI 功能（需配置 LLM API Key）

- [ ] 学生登录 → 学习计划页 → 点「生成计划」→ 显示每日任务清单
- [ ] 教师登录 → 教学建议页 → 点「生成建议」→ 显示 AI 建议
- [ ] Heartbeat 执行后 → 各学生通知铃铛出现红点 → 点开有 AI 个性化提醒

### 测验

- [ ] 学生登录 → 测验页 → 答题 → 提交 → 显示得分

---

## 九、架构速览

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React 前端      │────▶│  Spring Boot 后端  │────▶│  Python Agent   │
│  :5173 (Vite)   │ JWT │  :8080 (Java)     │Token│  :8000 (FastAPI) │
│                 │◀────│                   │◀────│                 │
└─────────────────┘     └────────┬──────────┘     └────────┬────────┘
                                 │                         │
                            PostgreSQL                  DeepSeek LLM
                            :5432                       (云端 API)
```

---

## 十、常见问题

### 1. 后端启动报 `Connection refused` 

PostgreSQL 没启动。检查服务状态或手动启动。

### 2. Agent 启动报模块找不到

```bash
pip install fastapi uvicorn langchain-core langchain-openai httpx python-dotenv loguru apscheduler
```

### 3. 前端页面白屏 / 一直加载

打开浏览器 Console（F12）查看报错。常见原因：
- 后端没启动 → 检查 `localhost:8080`
- Agent 没启动 → 检查 `localhost:8000/health`

### 4. 学习计划 / 教学建议生成失败

检查 Agent 日志（`agent-service/logs/`），确认 DeepSeek API Key 已配置且有效。

### 5. 测验提交 500

数据库未初始化种子数据，执行：
```bash
curl -X POST http://localhost:8080/api/dev/seed
```

### 6. Heartbeat 执行后无通知

等待 30-60 秒（需调 9 次 LLM），然后刷新学生端页面查看通知铃铛。

---

## 十一、重新初始化数据库

```bash
# 进入 psql
psql -U postgres -d teaching_ops

# 删除所有表
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# 退出
\q

# 重启后端（自动建表）
# 然后执行种子数据
curl -X POST http://localhost:8080/api/dev/seed
```

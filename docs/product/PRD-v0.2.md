
# 产品需求文档（PRD）— 基于知识图谱与多智能体协同的智慧教学辅助平台

> **版本**：v1.0 MVP
> **时间约束**：1.5 周（10 个工作日）/ 5 人团队
> **比赛**：2026年 CCF 服务计算创新大赛暨深信服 CoStrict AI 原生创新大赛

---

## 1. 项目背景与目标

**背景**：高校教学场景中，教师难以实时掌握全班学情，学生缺乏个性化学习引导，传统教学管理工具与 AI 能力脱节。

**目标**：构建一套 AI 原生的智慧教学平台，核心实现：
- **面向教师**：知识图谱可视化 + 班级学情看板，支持数据驱动的教学决策
- **面向学生**：个人掌握图谱 + AI 学习计划 + 个性化智能提醒，增强自主学习能力
- **AI 自主工作**：Heartbeat 机制驱动 AI 每日主动扫描学情，维护学生个人记忆，主动推送提醒

**核心创新点（对应申报书）**：

| 创新点 | MVP 实现方式 |
|--------|------------|
| 基于角色的知识图谱差异化展示 | 同一图谱数据，学生看个人掌握度，教师看全班聚合数据 |
| AI 记忆机制 | 每个学生一个 `student_memory` 文本字段，由 LLM 每日维护更新 |
| Heartbeat 自主工作机制 | 每日定时任务，自动扫描学情 → 生成提醒 → 更新记忆 |
| 多智能体协同 | 统一 LLM 编排服务，串行调度四类 Agent 能力 |

---

## 2. MVP 功能清单

### 前排功能（演示时用户直接可见）

| # | 功能 | 优先级 |
|---|------|--------|
| F01 | 登录注册 + 角色切换（教师 / 学生） | P0 |
| F02 | 课程创建 + 邀请码加入 | P0 |
| F03 | 知识图谱可视化 — 学生视图（个人掌握度颜色 + 推荐路径） | P0 |
| F04 | 知识图谱可视化 — 教师视图（全班平均 + 薄弱点高亮 + 下钻） | P0 |
| F05 | 学情看板（完成率、活跃度、风险人数） | P0 |
| F06 | 测验作答 + 自动评分（单选 + 判断） | P0 |
| F07 | 智能提醒通知列表（站内通知 + 铃铛红点） | P0 |

### 后排功能（逻辑在背后，演示时能跑通）

| # | 功能 | 优先级 |
|---|------|--------|
| F08 | Heartbeat 每日定时任务（扫描学情 + 生成提醒 + 更新记忆） | P0 |
| F09 | 学生个人记忆（student_memory 字段，LLM 每日维护） | P0 |
| F10 | 学习计划生成（点击触发，LLM + prompt 记忆拼接） | P1 |
| F11 | 教学建议生成（点击触发，教师端，LLM 输出） | P1 |
| F12 | 预填充演示数据（1-2 门课完整数据） | P0 |

### 已砍功能（时间不够，不做）

| 砍掉的功能 | 原因 |
|-----------|------|
| AI 半自动导入课程大纲 | 用预置数据替代 |
| 教学周报定时推送 | 看板已覆盖同等信息 |
| 一键创建专项练习 | 非核心路径 |
| 独立 Memory 向量数据库 | prompt 拼接已足够 |
| Agent 事件驱动协同架构 | 串行编排替代 |
| 4 个独立 Agent 服务 | 统一 LLM 编排服务替代 |

---

## 3. 用户角色与核心流程

### 教师核心流程

```
登录 → 创建课程 → 生成邀请码 → 构建知识图谱（预置 or 手动添加节点）
  → 上传教学资源（绑定知识点） → 创建题库 → 发布测验
  → 查看学情看板 → 查看知识图谱（教师视图）→ 下钻个人图谱
  → 点击生成"教学建议"
```

### 学生核心流程

```
登录 → 输入邀请码加入课程 → 浏览知识图谱（学生视图）
  → 点击节点 → 学习资源 → 完成测验
  → 查看个人掌握图谱（实时更新）
  → 查看 AI 生成的周学习计划 → 接收智能提醒（通知铃铛）
```

---

## 4. 功能模块详细说明

### 4.1 用户与课程管理

**用户管理**：邮箱 + 密码注册，选择角色（教师/学生），JWT Token 鉴权，角色隔离。

**课程管理**：

| 功能 | 教师 | 学生 |
|------|------|------|
| 创建课程 | ✅ 填写课程名、学期、描述 | ❌ |
| 生成邀请码 | ✅ 系统生成 6 位随机码 | ❌ |
| 加入课程 | ❌ | ✅ 输入邀请码 |
| 课程列表 | ✅ 我创建的课程 | ✅ 我加入的课程 |
| 成员管理 | ✅ 查看学生列表 | ❌ |

---

### 4.2 知识图谱模块（核心卖点，不可精简）

**数据模型**：

```
KnowledgeNode（知识点）：id, course_id, name, description, x, y, order
NodeRelation（关系）：from_node_id, to_node_id, type（先修关系）
StudentMastery（掌握度）：student_id, node_id, course_id, score(0-100), updated_at
```

**差异化视图规则**：

| 维度 | 学生视图 | 教师视图 |
|------|---------|---------|
| 节点颜色 | 个人掌握度：绿(≥80) / 黄(60-79) / 红(<60) / 灰(未学) | 全班平均掌握度：同色系 |
| 高亮节点 | 推荐学习的下一个节点（蓝色边框闪烁） | Top 5 薄弱知识点（红色标记） |
| 点击节点 | 进入学习页面（资源 + 测验入口） | 查看该节点全班数据 + 下钻到个人 |
| 路径高亮 | 推荐学习路径（按 order 排序，绿色连线） | 不展示 |

**交互要求**：支持拖拽、缩放、展开/折叠；200+ 节点 < 3 秒加载。技术选型建议 AntV G6。

**MVP 简化**：演示时使用预置数据，不要求做完整编辑器。

---

### 4.3 教学资源管理

支持 PDF/PPT 上传（对象存储），视频链接（URL），资源绑定到知识点节点。

---

### 4.4 测验与题库管理

**题型**：单选题 + 判断题。

**教师**：创建题目（题干、选项、正确答案、绑定知识点、分值）→ 组卷 → 发布。

**学生**：进入测验 → 作答提交 → 即时评分 → 触发掌握度更新。

**掌握度公式**：最终掌握度 = 最近一次分数 × 0.6 + 历史平均分 × 0.4

---

### 4.5 学情分析模块

**学情看板（教师）**：

| 指标 | 计算方式 | 展示形式 |
|------|---------|---------|
| 课程完成率 | 已完成测验人数 / 总学生数 | 进度环 |
| 学习活跃度 | 近 7 天有学习记录的学生比例 | 折线图 |
| 风险学生数 | 超 3 天无学习记录 OR 掌握度 < 40% | 数字高亮 + 列表 |
| 薄弱知识点 | 全班平均掌握度最低的 Top 5 | 排行榜 |

**学习轨迹下钻**：点击学生姓名 → 个人图谱 + 近 5 次测验记录。

---

### 4.6 学习计划模块

学生点击「生成本周学习计划」→ 后端拼接 prompt（掌握度 + 学习记录 + 个人记忆）→ 调 LLM → 结果存库 → 页面按天展示任务列表，学生可勾选完成。

---

### 4.7 Heartbeat 自主工作 + 智能提醒模块

**核心理念**：系统每天定时自动"过一遍"每个学生，完成三件事：读上下文 → AI 判断与生成 → 写回数据库。

**定时规则**：
- 每日 22:00 遍历所有活跃课程的学生
- 提交测验后掌握度下降 ≥ 15% 时实时触发

**执行流程**：

```
22:00 触发 → 查询所有活跃课程 → 遍历每个学生
  → Step 1 读上下文（学习记录 + 计划进度 + 薄弱点 + 个人记忆）
  → Step 2 调 LLM，输出 { reminder, memory }
  → Step 3 写回（通知表 + student_memory 字段）
```

**学生个人记忆（student_memory）**：TEXT 字段，LLM 每日维护更新。

**初始值**：
```
【学习风格】暂无数据，待观察。
【当前状态】刚加入课程，尚未开始学习。
【薄弱环节】暂无。
【风险提示】无。
【上次更新】{注册日期}
```

**成熟后示例**：
```
【学习风格】倾向于晚上学习，单次专注时长约20-30分钟，周末活跃度明显下降。
【当前状态】本周学习积极，已完成计划的60%，进度良好。
【薄弱环节】递归和动态规划理解持续偏弱，链表上周有明显改善。
【风险提示】上周出现2天连续未登录，需持续关注。
【历史亮点】数组和栈掌握度已达优秀（>85%）。
【上次更新】2026-06-16
```

**站内通知**：右上角铃铛 + 红点 + 通知列表 + 已读标记。

---

### 4.8 LLM 编排服务

统一模块，不做独立 Agent 服务。

```
llm_service/
├── base.py        # 基础封装（重试/超时/异常处理）
├── memory.py      # 学生记忆读取与更新
├── heartbeat.py   # 每日 Heartbeat 任务逻辑
├── plan.py        # 学习计划生成
├── advice.py      # 教学建议生成
└── reminder.py    # 掌握度下降实时提醒
```

LLM 优先使用深信服 API，备选 OpenAI / Ollama。

---

## 5. 技术架构

```
前端展示层：React + TypeScript + AntD + AntV G6（图谱）+ ECharts（看板）
后端服务层：Python FastAPI 单体应用（用户/课程/图谱/资源/测验/学情/通知）
LLM 编排层：统一编排服务（学习计划 / 教学建议 / Heartbeat）
基础设施层：PostgreSQL + Redis + MinIO + LLM API
```

---

## 6. 数据库核心表设计

```sql
users (id, name, email, password_hash, role, created_at)
courses (id, name, semester, description, teacher_id, invite_code, created_at)
course_members (id, course_id, student_id, joined_at)
knowledge_nodes (id, course_id, name, description, order, x, y, created_at)
node_relations (id, from_node_id, to_node_id, type)
resources (id, course_id, node_id, name, type, url, created_at)
questions (id, course_id, node_id, content, type, options JSON, answer, score, created_at)
quizzes (id, course_id, name, question_ids JSON, deadline, created_at)
quiz_submissions (id, quiz_id, student_id, answers JSON, score, submitted_at)
student_mastery (id, student_id, node_id, course_id, score, updated_at)
learning_logs (id, student_id, course_id, node_id, action, duration_minutes, created_at)
student_memory (id, student_id, course_id, memory TEXT, updated_at)
learning_plans (id, student_id, course_id, week, plan JSON, created_at)
notifications (id, user_id, course_id, content, type, is_read, created_at)
heartbeat_logs (id, run_at, total_students, reminded_count, status)
```

---

## 7. 接口约定

### Agent/LLM 接口（Dev 5 提供）

```
POST /api/agent/learning-plan       请求: { userId, courseId }
POST /api/agent/teaching-advice     请求: { courseId, weakNodes }
POST /api/agent/trigger-reminder    请求: { studentId, courseId, reason }
GET  /api/agent/heartbeat/status
```

### 核心业务接口（Dev 3 提供）

```
POST /api/auth/register
POST /api/auth/login
GET/POST /api/courses
POST /api/courses/:id/join
GET /api/courses/:id/graph?role=student|teacher
GET /api/courses/:id/dashboard
POST /api/quizzes/:id/submit
GET /api/notifications
PATCH /api/notifications/:id/read
```

---

## 8. 非功能性要求

| 指标 | 要求 |
|------|------|
| 知识图谱加载 | 200+ 节点，首次渲染 < 3 秒 |
| 学情数据更新 | 提交后掌握度更新 < 5 分钟 |
| LLM 调用超时 | 30 秒超时，超时返回默认提示 |
| Heartbeat 执行 | 每日 22:00，单次 < 10 分钟 |
| 浏览器 | Chrome / Edge / Safari 最新版 |
| 并发 | Demo 阶段 5-10 人即可 |

---

## 9. 人员分工与里程碑

### 人员分工

| 成员 | 方向 | 主要职责 |
|------|------|---------|
| Dev 1 | 前端主力 | 知识图谱可视化（AntV G6）、学生/教师差异化视图 |
| Dev 2 | 前端辅助 | 登录/课程/测验/看板/通知/计划 等所有其他页面 |
| Dev 3 | 后端主力 | 数据库设计、用户/课程/图谱/测验 API、联调协调 |
| Dev 4 | 后端辅助 | 资源管理、掌握度计算、学情聚合、风险识别 |
| Dev 5 | Agent 专责 | LLM 编排服务、Heartbeat 定时任务、记忆模块、通知 CRUD |

### 关键里程碑

| 时间节点 | 必须完成 |
|---------|---------|
| Day 2 EOD | 数据库设计确认 / 接口约定文档 / 项目骨架可运行 |
| Day 5 EOD | 图谱渲染预置数据可展示 / 登录课程测验基础流程跑通 |
| Day 8 EOD | 前后端主干功能联通 / LLM 至少一个能力可调通 / Heartbeat 逻辑验证 |
| Day 10 EOD | 演示数据完备 / Demo 流程完整跑通 / 录屏备份 |

### 10 天工作节奏

```
         Day1  Day2  Day3  Day4  Day5  Day6  Day7  Day8  Day9  Day10
Dev1    [框架搭建]  [图谱基础渲染]   [学生视图]   [教师视图+下钻] [联调优化]
Dev2    [框架协同]  [登录+课程页面]  [测验页面]   [看板+通知页]  [计划页+收尾]
Dev3    [DB+接口设计][用户+课程API]  [图谱API]    [测验API]      [联调BugFix]
Dev4    [架构熟悉]  [资源管理API]   [掌握度计算] [学情聚合API]  [数据+联调]
Dev5    [接口约定]  [LLM基础封装]   [Heartbeat]  [学习计划]     [教学建议+Seed数据]
```

---

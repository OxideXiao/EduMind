# EduMind AI 能力说明

## 目标

本阶段 AI 功能先支撑教学闭环，不做复杂多 Agent 编排。上线前必须跑通三件事：

- 学生点击生成本周学习计划。
- 教师点击生成课程教学建议。
- 教师触发或 Heartbeat 生成学情提醒，并写入通知中心。

## 功能边界

### 学习计划

入口：`POST /api/courses/{courseId}/agent/learning-plan`

数据来源：

- 学生基本信息：当前登录学生。
- 课程信息：`courses` 表。
- 知识点掌握度：`knowledge_mastery` 与学情统计查询。
- 学生长期记忆：`student_memory.memory_json`。
- 测验与学习行为：当前阶段通过后端学情统计间接体现，后续可补更完整轨迹摘要。

AI 输出：

- `summary`：本周学习概览。
- `generation_basis`：本次计划依据了哪些数据。
- `weakness_diagnosis`：薄弱点、优势点、风险说明。
- `short_term.daily_plan`：每天任务、知识点、预计时长、预期结果。
- `mid_term`：本月目标和阶段性里程碑。
- `resource_recommendations`：针对薄弱知识点的资源建议。
- `progress_checks`：本周可检查指标。
- `motivation`：给学生的鼓励语。

验收标准：

- 学生端点击后能返回结构化计划。
- 计划会保存到 `learning_plans`。
- 无模型密钥或模型异常时，返回基于规则的降级计划，页面不报错。

### 教学建议

入口：`POST /api/courses/{courseId}/agent/teaching-suggestion`

数据来源：

- 课程信息：`courses` 表。
- 班级平均掌握度：课程知识点平均分。
- 薄弱知识点：前端指定或 dashboard 自动计算。
- 风险学生数量：dashboard 风险学生统计。

AI 输出：

- `summary`：班级整体评估。
- `data_basis`：建议依据。
- `weak_knowledge_points`：需要重点讲解的知识点。
- `teaching_suggestions`：课堂讲解、练习、复盘建议。
- `grouping_strategy`：分层辅导策略。
- `resource_strategy`：补充资源策略。
- `assessment_strategy`：后续测验和看板跟踪建议。
- `risk_alert`：风险学生提醒。
- `next_actions`：教师课后可直接执行动作。
- `priority`：建议优先级。

验收标准：

- 教师端点击后能返回问题摘要和建议列表。
- 建议能体现课程薄弱知识点和风险学生数量。
- 模型异常时返回规则降级建议。

### 学情提醒

入口：

- 单人提醒：`POST /api/courses/{courseId}/agent/trigger-reminder`
- Heartbeat：`POST /api/agent/heartbeat`

数据来源：

- 学生完成率。
- 本周活跃天数。
- 测验均分。
- 薄弱知识点。
- 学生长期记忆。

AI 输出：

- `title`：通知标题。
- `content`：通知正文。
- `priority`：`HIGH` 或 `NORMAL`。
- `risk_reasons`：触发提醒的原因。
- `next_action`：学生下一步动作。

验收标准：

- 教师触发单人提醒后，通知写入 `notifications`。
- Heartbeat 可批量处理学生，失败单个学生不影响整批。
- 通知中心能看到提醒。

## 当前不上线能力

以下能力放到后续增强，不阻塞 2026-09-12 前完成：

- AI 根据课程大纲生成知识图谱。
- AI 根据课件抽取知识点。
- AI 自动出题并直接入库。
- 学生问答助手。
- 教师备课助手。
- 编程题或实践题智能批改。
- 独立向量数据库记忆。

## 环境变量

Agent 服务使用 OpenAI 兼容接口，默认接 DeepSeek：

```text
LLM_API_KEY=你的模型密钥
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
AGENT_PORT=8000
SPRING_BASE_URL=http://localhost:8080
INTERNAL_TOKEN=dev-internal-token
MOCK_SPRING=false
```

本地演示可设置：

```text
MOCK_SPRING=true
```

这样 Agent 服务会使用内置学情数据，不依赖 Spring 后端和数据库。

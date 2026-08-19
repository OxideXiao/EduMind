# LLM Prompt Spec v0.1

> **版本**：v0.1 | **负责人**：Dev 5
> **来源**：沿用 `参考/Agent专责实施指南.md` §6–8、§11；补充教学建议 Prompt。

---

## 1. 通用约定

### 1.1 输出格式

- 所有 Prompt 要求 LLM **只输出 JSON**，无 markdown 包裹、无解释文字
- 解析层使用 `safe_json_parse`（见 Agent 指南 §11.1）三层容错
- 结构化输出链使用 `temperature=0.1`；计划生成使用 `temperature=0.5`

### 1.2 超时与降级

| 场景 | 超时 | 失败降级 |
|------|------|----------|
| Heartbeat 提醒 | 30s | 默认 `{ title: "今日学习提醒", content: "请及时完成本周学习任务。", priority: "NORMAL" }` |
| 记忆更新 | 30s | 保留原 memory，`version` 不变，记 error log |
| 学习计划 | 30s | 返回 HTTP 500，前端提示重试 |
| 教学建议 | 30s | 返回基于规则的静态建议（薄弱点列表 + 模板文案） |

### 1.3 文件映射

| 能力 | Prompt 文件 | Chain 文件 |
|------|-------------|------------|
| 记忆更新 | `prompts/memory.py` | `chains/memory.py` |
| 智能提醒 | `prompts/reminder.py` | `chains/heartbeat.py` |
| 学习计划 | `prompts/learning_plan.py` | `chains/learning_plan.py` |
| 教学建议 | `prompts/teaching_suggestion.py` | `chains/teaching_suggestion.py` |

---

## 2. 记忆更新（Memory Update）

### 2.1 触发时机

- Heartbeat 处理每个学生时（Step 2c）
- 可选：测验提交后异步更新（P2，MVP 不做）

### 2.2 输入变量

| 变量 | 来源 |
|------|------|
| `current_memory_json` | Spring `GET /api/students/{id}/memory?course_id=` |
| `today_activities` | Heartbeat 从 analytics 拼自然语言摘要 |
| `knowledge_changes` | 当日 `knowledge_mastery` JSON 字符串 |

### 2.3 System Prompt

```
你是一个教育数据助手，负责维护学生的学习记忆档案。

你的任务：根据学生当前记忆档案 + 今日学情数据，生成更新后的记忆JSON。

## 记忆字段说明
- version: 整数，每次更新+1
- last_updated: 本次更新时间（ISO格式）
- summary: 一句话概括学生当前学习状态
- knowledge_mastery_trend: 各知识点的掌握度及趋势(stable/improving/declining)
- weak_points: 薄弱知识点列表（掌握度<0.5）
- strengths: 优势知识点列表（掌握度>0.7）
- learning_style_note: 学习行为观察
- behavior_notes: 值得注意的行为（最多保留3条，旧的删除）
- suggested_focus: 本周学习建议

## 规则
1. 趋势判断：对比current_memory中的掌握度和今日新数据
2. behavior_notes保留最近最多3条，旧的自然淘汰
3. 用中文输出
4. 只输出JSON，不要有```json```标记，不要有任何解释
```

### 2.4 User Template

```
## 当前记忆档案
{current_memory_json}

## 今日学情
{today_activities}

## 知识点变化
{knowledge_changes}

请输出更新后的记忆JSON：
```

### 2.5 输出 Schema

```json
{
  "version": 2,
  "last_updated": "2026-06-09T22:05:00",
  "summary": "该生整体掌握度中等偏下，动态规划是最大短板",
  "knowledge_mastery_trend": {
    "二叉树遍历": { "current": 0.8, "trend": "stable" },
    "动态规划": { "current": 0.3, "trend": "declining" }
  },
  "weak_points": ["动态规划"],
  "strengths": ["二叉树遍历"],
  "learning_style_note": "偏好视频学习，刷题量不足",
  "behavior_notes": ["连续3天未登录"],
  "suggested_focus": "本周应重点攻克动态规划"
}
```

### 2.6 校验规则

必需字段：`version`, `last_updated`, `summary`, `knowledge_mastery_trend`, `weak_points`, `strengths`, `suggested_focus`

---

## 3. 智能提醒（Reminder）

### 3.1 触发时机

- Heartbeat 每日 22:00（批量）
- 测验提交后掌握度下降 ≥ 15%（Spring 调 `/api/agent/reminder`）

### 3.2 输入变量

| 变量 | 类型 | 说明 |
|------|------|------|
| student_name | string | 姓名 |
| completion_rate | float | 0–1 |
| active_days | int | 本周活跃天数 |
| at_risk | bool | 风险标记 |
| weak_points | string[] | 掌握度 < 0.5 的知识点名 |
| memory_json | string | 当前记忆 JSON 字符串 |

### 3.3 System Prompt

```
你是CoStrict AI学习平台的智能提醒助手。

你的任务：根据学生的学情数据和个人记忆，生成一条个性化的学习提醒通知。

## 提醒要求
1. 称呼学生姓名，语气温暖但简洁
2. 基于数据说话，不编造信息
3. 如果at_risk=true，语气要关切并给出具体行动建议
4. 如果weak_points非空，明确指出最需要加强的1-2个知识点
5. 长度控制在100字以内（通知卡片展示空间有限）

## 输出格式
{
  "title": "提醒标题（8字以内）",
  "content": "提醒正文",
  "priority": "HIGH 或 NORMAL"
}
只输出JSON，不要有其他内容。
```

### 3.4 User Template

```
学生：{student_name}
本周完成率：{completion_rate:.0%}
本周活跃天数：{active_days}天
处于风险状态：{at_risk}
薄弱知识点：{weak_points}
近期学习记忆：{memory_json}

请生成今日提醒：
```

### 3.5 输出 Schema

```json
{
  "title": "加油学习",
  "content": "李四同学，动态规划仍是薄弱环节，建议今晚完成2道基础题。",
  "priority": "HIGH"
}
```

---

## 4. 学习计划（Learning Plan）

### 4.1 触发时机

学生点击「生成本周学习计划」→ Spring 代理 → Agent

### 4.2 输入变量

| 变量 | 来源 |
|------|------|
| student_name | Spring |
| course_name | Spring |
| knowledge_mastery | 格式化文本（见 Agent 指南 `_format_mastery`） |
| memory_json | Spring GET memory |

### 4.3 System Prompt

```
你是CoStrict AI平台的学习规划专家。

你的任务：根据学生的知识掌握情况和学习记忆，生成一份个性化学习计划。

## 计划要求
1. 分为"短期（本周）"和"中期（本月）"两个层次
2. 优先攻克最薄弱的知识点（掌握度最低的1-2个）
3. 兼顾优势知识点的巩固
4. 每天给出具体的、可执行的学习任务（如"观看XX视频+完成3道练习题"）
5. 结合学生的学习风格偏好（从记忆数据中获取）
6. 计划要现实可行，每天学习量不超过2小时

## 输出格式
{
  "summary": "计划总体说明（50字以内）",
  "short_term": {
    "focus": "本周重点",
    "daily_plan": [
      {"day": 1, "task": "具体任务", "duration_min": 30, "knowledge_point": "知识点名"}
    ]
  },
  "mid_term": {
    "goal": "本月目标",
    "milestones": ["里程碑1", "里程碑2"],
    "suggested_resources": ["推荐学习资源"]
  },
  "motivation": "一句鼓励的话"
}
只输出JSON，不要有其他内容。
```

### 4.4 User Template

```
学生姓名：{student_name}
课程：{course_name}

## 当前知识点掌握度
{knowledge_mastery}

## 学生学习记忆
{memory_json}

请生成个性化学习计划：
```

### 4.5 输出 Schema

`daily_plan` 至少 3 天、最多 7 天；每条含 `day`, `task`, `duration_min`, `knowledge_point`。

### 4.6 前端展示映射

| JSON 字段 | UI |
|-----------|-----|
| summary | 页顶摘要 |
| short_term.daily_plan | 按天 Checkbox 列表 |
| motivation | 底部鼓励语 |

---

## 5. 教学建议（Teaching Suggestion）— 新增

> Agent 指南原代码误复用学习计划链，此处独立定义。

### 5.1 触发时机

教师点击「生成教学建议」→ Spring 取 dashboard 薄弱点 → Agent

### 5.2 输入变量

| 变量 | 说明 |
|------|------|
| course_name | 课程名 |
| class_avg_mastery | 全班各知识点平均掌握度（0–1） |
| weak_knowledge_points | 薄弱知识点名称列表 |
| at_risk_student_count | 风险学生数 |

### 5.3 System Prompt

```
你是CoStrict AI平台的教学诊断顾问，服务对象是高校授课教师。

你的任务：根据班级学情数据，识别教学问题并给出可执行的优化建议。

## 要求
1. 基于数据说话，引用具体知识点和比例（可估算）
2. 建议必须具体可执行（如"增加一次课堂练习""补充可视化案例"）
3. 建议 2–4 条，按优先级排序
4. 语气专业、简洁，面向教师
5. 不要建议"使用AI聊天"等空泛内容

## 输出格式
{
  "problem": "问题描述（一句话，含关键数据）",
  "suggestions": ["建议1", "建议2", "建议3"],
  "priority": "HIGH 或 NORMAL"
}
只输出JSON，不要有其他内容。
```

### 5.4 User Template

```
课程：{course_name}
风险学生数：{at_risk_student_count}

## 全班知识点平均掌握度
{class_avg_mastery}

## 薄弱知识点
{weak_knowledge_points}

请生成教学优化建议：
```

### 5.5 输出示例

```json
{
  "problem": "约70%学生在「动态规划」章节掌握度低于50%，且1名学生处于风险状态",
  "suggestions": [
    "下节课用15分钟回顾DP状态转移方程，配合1道白板例题",
    "发布一次动态规划专项小测（5题）",
    "为薄弱学生推送链表→DP的前置复习资源"
  ],
  "priority": "HIGH"
}
```

### 5.6 规则降级（LLM 失败时）

```python
def fallback_teaching_suggestion(weak_points, at_risk_count):
    return {
        "problem": f"班级在「{weak_points[0]}」等知识点掌握度偏低，{at_risk_count}名学生需关注",
        "suggestions": [
            f"针对「{weak_points[0]}」增加课堂案例讲解",
            "布置一次专项练习并查看学情看板变化"
        ],
        "priority": "HIGH" if at_risk_count > 0 else "NORMAL"
    }
```

---

## 6. Heartbeat 编排顺序（Prompt 调用链）

```text
对每个学生：
  1. GET memory + GET analytics（Spring）
  2. reminder chain → POST notification（Spring）
  3. memory-update chain → PUT memory（Spring）
```

**LLM 调用次数**：每学生 2 次（提醒 + 记忆）；3 名学生 Demo 约 6 次/天，可接受。

---

## 7. Prompt 测试用例（Dev 5 Day 2 必跑）

### 7.1 提醒 — 风险学生

```json
{
  "student_name": "王五",
  "completion_rate": 0.15,
  "active_days": 1,
  "at_risk": true,
  "weak_points": ["动态规划", "二叉树遍历"],
  "memory_json": "{\"summary\":\"多项指标预警\"}"
}
```

**期望**：`priority=HIGH`，content 含姓名 + 具体知识点 + 行动建议。

### 7.2 学习计划 — 中等生

```json
{
  "student_name": "李四",
  "course_name": "数据结构与算法",
  "knowledge_mastery": "- 动态规划: 30% 🔴 薄弱\n- 二叉树遍历: 65% 🟡 一般",
  "memory_json": "{\"weak_points\":[\"动态规划\"]}"
}
```

**期望**：`daily_plan` ≥ 3 天，含动态规划相关任务。

### 7.3 记忆更新

输入空 memory `{}` + 今日学情「完成率55%，活跃3天」。

**期望**：`version=1`，`weak_points` 与 mastery 一致。

---

## 8. 与 Agent 指南的差异

| 项 | Agent 指南 | 本 Spec |
|----|------------|---------|
| 教学建议 | 复用 learning_plan chain | **独立 Prompt/Chain** |
| 记忆 scope | 仅 student_id | 业务层传 `course_id`（Spring 侧） |
| PRD 文本记忆 | 中文段落 | **统一 JSON**（不再使用段落格式） |

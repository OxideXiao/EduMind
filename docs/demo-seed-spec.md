# Demo Seed Spec v0.1

> **版本**：v0.1 | **目标**：保障 5 分钟 Demo 稳定可复现
> **来源**：沿用 Agent 指南 §9，扩展图谱/测验/账号体系

---

## 1. 演示目标

| 场景 | 展示能力 | 用哪个账号 |
|------|----------|------------|
| 教师看全班学情 | 看板 + 教师图谱 + 薄弱点 | teacher@demo.com |
| 学生 A 正常学习 | 绿/黄节点 + 计划生成 | student1@demo.com（张三） |
| 学生 B 中等薄弱 | 提醒 + 计划侧重补强 | student2@demo.com（李四） |
| 学生 C 风险预警 | 风险标记 + HIGH 提醒 | student3@demo.com（王五） |
| Heartbeat | 22:00 或手动触发后通知增加 | 用 student3 最明显 |

---

## 2. 演示账号

| 角色 | 邮箱 | 密码 | 姓名 | userId（建议固定） |
|------|------|------|------|-------------------|
| 教师 | teacher@demo.com | demo123456 | 陈老师 | 1 |
| 学生 | student1@demo.com | demo123456 | 张三 | 101 |
| 学生 | student2@demo.com | demo123456 | 李四 | 102 |
| 学生 | student3@demo.com | demo123456 | 王五 | 103 |

---

## 3. 演示课程

| 字段 | 值 |
|------|-----|
| 课程名 | 数据结构与算法 |
| 学期 | 2025-2026-2 |
| 邀请码 | DEMO01 |
| courseId | 1 |
| 知识点数量 | **35**（MVP 够用；不必 200+） |

### 3.1 知识点清单（35 节点，分 7 章）

```text
第1章 绪论（5）：算法复杂度、递归基础、分治思想、暴力枚举、算法评估
第2章 线性表（5）：数组、链表、栈、队列、双端队列
第3章 树（5）：二叉树、二叉树遍历、BST、堆、哈夫曼树
第4章 图（5）：图的存储、DFS、BFS、最短路径、最小生成树
第5章 查找（5）：顺序查找、二分查找、哈希表、平衡二叉树、B+树概念
第6章 排序（5）：冒泡、快排、归并、堆排序、外部排序概念
第7章 算法设计（5）：贪心算法、动态规划、回溯、分支限界、算法综合
```

### 3.2 先修关系（示例）

```text
数组 → 链表 → 栈 → 队列
二叉树 → 二叉树遍历 → BST
DFS → 最短路径
贪心算法 → 动态规划
```

Seed 脚本写入 `node_relations` 约 20 条边即可。

### 3.3 图谱坐标

- 按章分列：`x = chapterIndex * 150`，章内 `y = nodeIndex * 60`
- 便于 G6 直接渲染，无需自动布局算法

---

## 4. 三档学生掌握度设计

> **score 为 0–100**；Agent 层转换时 `/100`

### 4.1 张三（优等生，101）

| 指标 | 值 |
|------|-----|
| 平均掌握度 | ~82 |
| 风险 | 否 |
| 完成率 | 92% |
| 本周活跃 | 7 天 |
| 测验均分 | 91.5 |

**节点颜色分布**：大部分 GREEN，1–2 个 YELLOW（如「动态规划」75）

### 4.2 李四（中等生，102）

| 指标 | 值 |
|------|-----|
| 平均掌握度 | ~52 |
| 风险 | 否 |
| 完成率 | 55% |
| 本周活跃 | 3 天 |
| 测验均分 | 62 |

**薄弱点**：动态规划（30）、贪心算法（55）

### 4.3 王五（预警学生，103）

| 指标 | 值 |
|------|-----|
| 平均掌握度 | ~28 |
| 风险 | **是** |
| 完成率 | 15% |
| 本周活跃 | 1 天 |
| 测验均分 | 28 |
| 最近登录 | **4 天前**（触发 PRD 3 天未学规则） |

**薄弱点**：动态规划（15）、二叉树遍历（40）、贪心算法（35）

---

## 5. 初始记忆 JSON（沿用 Agent 指南）

存储于 `student_memory.memory_json`，**按 course_id=1**。

### 张三（101）

```json
{
  "version": 0,
  "last_updated": "2026-06-09",
  "summary": "该生掌握度优秀，学习积极主动",
  "knowledge_mastery_trend": {
    "二叉树遍历": { "current": 0.9, "trend": "stable" },
    "动态规划": { "current": 0.75, "trend": "improving" },
    "贪心算法": { "current": 0.85, "trend": "stable" }
  },
  "weak_points": [],
  "strengths": ["二叉树遍历", "贪心算法"],
  "learning_style_note": "偏好刷题，每周主动做额外练习",
  "behavior_notes": ["连续7天活跃", "测验正确率稳定90%+"],
  "suggested_focus": "保持当前节奏，可挑战更难的动态规划题目"
}
```

### 李四（102）

```json
{
  "version": 0,
  "last_updated": "2026-06-09",
  "summary": "该生整体中等，动态规划是明显短板",
  "knowledge_mastery_trend": {
    "二叉树遍历": { "current": 0.65, "trend": "improving" },
    "动态规划": { "current": 0.3, "trend": "declining" },
    "贪心算法": { "current": 0.55, "trend": "stable" }
  },
  "weak_points": ["动态规划"],
  "strengths": ["二叉树遍历"],
  "learning_style_note": "偏好视频学习，做题偏少",
  "behavior_notes": ["上次动态规划测验只得了45分", "3天未查看学习资料"],
  "suggested_focus": "集中攻克动态规划，建议每天至少2道DP题"
}
```

### 王五（103）

```json
{
  "version": 0,
  "last_updated": "2026-06-09",
  "summary": "该生多项指标预警，需要重点关注",
  "knowledge_mastery_trend": {
    "二叉树遍历": { "current": 0.4, "trend": "declining" },
    "动态规划": { "current": 0.15, "trend": "declining" },
    "贪心算法": { "current": 0.35, "trend": "declining" }
  },
  "weak_points": ["二叉树遍历", "动态规划", "贪心算法"],
  "strengths": [],
  "learning_style_note": "极少参与线上学习活动",
  "behavior_notes": ["连续5天未登录", "完成率仅15%", "上次测验缺考"],
  "suggested_focus": "急需重新建立学习习惯，从最基础的二叉树开始补课"
}
```

---

## 6. 测验与题目（最小集）

| 测验 | 题数 | 绑定知识点 | 说明 |
|------|------|------------|------|
| 线性表基础测 | 5 | 数组、链表、栈 | 张三/李四已提交 |
| 树与遍历测 | 5 | 二叉树、二叉树遍历 | 三人均有记录，王五缺考或低分 |
| 算法设计测 | 5 | 贪心、动态规划 | 用于展示 DP 薄弱 |

**历史提交**：

| 学生 | 线性表 | 树与遍历 | 算法设计 |
|------|--------|----------|----------|
| 张三 | 95 | 90 | 85 |
| 李四 | 70 | 65 | 45 |
| 王五 | 30 | 35 | 未提交 |

---

## 7. 学习日志（支撑活跃度）

为每人写入近 7 天 `learning_logs`：

| 学生 | 活跃天数 | 说明 |
|------|----------|------|
| 张三 | 7 | 每天 1–2 条 VIEW_RESOURCE / QUIZ |
| 李四 | 3 | 分散在周一三五 |
| 王五 | 1 | 仅 4 天前 1 条记录 |

---

## 8. 资源（每章 1 个即可）

| 节点 | 资源 |
|------|------|
| 动态规划 | PDF《DP入门》+ 视频 URL 占位 |
| 二叉树遍历 | PPT《遍历动画》 |

共 7–10 个资源文件/链接，不必全部 35 节点覆盖。

---

## 9. Seed 实现方式

### 方案 A（推荐）：Spring `POST /api/dev/seed`

```
backend/src/main/resources/seed/
├── demo_users.json
├── demo_course.json
├── demo_nodes.json
├── demo_relations.json
├── demo_mastery.json
├── demo_quizzes.json
└── SeedService.java
```

**幂等**：重复调用先清理 `course_id=1` 关联数据再写入。

### 方案 B：Agent 指南 `seed/seed_data.py`

- 改为调 Spring `/api/dev/seed`，**不再** `POST /api/analytics/daily`
- 或仅负责触发：`POST /api/dev/heartbeat/run` 做 Heartbeat 演示

---

## 10. Seed 执行步骤（Demo 当天）

```bash
# 1. 启动服务（postgres + spring + agent + frontend）

# 2. 写入演示数据
curl -X POST http://localhost:8080/api/dev/seed

# 3. （可选）预跑 Heartbeat，确保 student3 有通知
curl -X POST "http://localhost:8080/api/dev/heartbeat/run?courseId=1"

# 4. 登录验证
# teacher@demo.com → 看板 riskStudentCount=1
# student3@demo.com → 铃铛有未读 HIGH 提醒
```

---

## 11. 5 分钟 Demo 剧本（与 PRD 一致）

| 时间 | 操作 | 预期画面 |
|------|------|----------|
| 0:00 | 教师登录 → 打开课程图谱 | Top5 薄弱含「动态规划」 |
| 0:45 | 打开学情看板 | 风险学生 1 人（王五） |
| 1:15 | 点击「生成教学建议」 | 出现 problem + suggestions |
| 1:45 | 切换 student2 登录 → 个人图谱 | 红黄绿分布 |
| 2:30 | 点击节点 → 做测验 → 提交 | 掌握度数字变化 |
| 3:00 | 点击「生成学习计划」 | daily_plan 列表 |
| 3:30 | 切换 student3 → 通知铃铛 | HIGH 优先级提醒 |
| 4:00 | （可选）手动 Heartbeat | 新通知 + memory version+1 |
| 4:30 | 口述架构 | Spring + Agent + Heartbeat |

---

## 12. 验收 Checklist

- [ ] `POST /api/dev/seed` 200，返回 inviteCode=DEMO01
- [ ] 教师 dashboard：`riskStudentCount >= 1`
- [ ] 教师 graph：至少 2 个 `isWeakTop=true`
- [ ] 张三 graph：多数节点 GREEN
- [ ] 王五 graph：多数节点 RED
- [ ] 测验提交后 mastery 变化可见
- [ ] Heartbeat 后王五收到新 REMINDER 通知
- [ ] 三人均有非空 `memory_json`

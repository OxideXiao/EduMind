# 模块设计文档（Module Design）目录

> 复杂模块在 Spec 之外补充**详细设计**，经模块评审后开发。
> 简单 CRUD（登录、课程列表）不必单独写。

---

## 文档状态

| 文档 | 模块 | 负责人 | 状态 |
|------|------|--------|------|
| [database-schema.md](./database-schema.md) | 数据库表结构、DDL、迁移 | Dev 3（主）/ Dev 4 | ☐ 待填写 |
| [agent-module.md](./agent-module.md) | LLM 编排 / Heartbeat / 记忆 | Dev 5 | ✅ v0.1 待 Dev5 确认 |
| [frontend-module.md](./frontend-module.md) | 前端整体 + 图谱 | Dev 1 / Dev 2 | ☐ 待补充 |
| [backend-module.md](./backend-module.md) | Spring 后端模块 | Dev 3 / Dev 4 | ☐ 待补充 |

---

## 模块设计文档模板

各模块负责人复制以下结构，保存为 `design/<module>-module.md`：

```markdown
# <模块名> 模块详细设计

| 项目 | 内容 |
|------|------|
| 文档版本 | v0.1 |
| 状态 | 草稿 / 待评审 / 已冻结 |
| 负责人 | Dev X |
| 上级文档 | architecture.md §X |
| 接口契约 | api-spec.md §X |

## 1. 模块定位（职责 / 不负责）
## 2. 技术选型
## 3. 目录 / 包结构
## 4. 组件图与依赖
## 5. 核心工作流（时序或流程图）
## 6. 与外部模块的协作边界
## 7. 非功能要求（性能、错误处理）
## 8. 测试策略
## 9. 评审 Checklist
```

---

## 何时需要写模块设计

| 模块 | 是否需要 | 理由 |
|------|----------|------|
| Agent / LLM | **必须** | 已提供 agent-module.md |
| 知识图谱（前后端） | **建议** | 核心卖点、双视图逻辑 |
| 学情 / 掌握度 | **建议** | 规则多、Dev3/4 需对齐 |
| 数据库 | **必须** | 见 database-schema.md；Day 2 前定稿 |
| 认证 / 课程 CRUD | 可选 | api-spec 通常足够 |

---

## 评审关系

```text
architecture.md（系统架构评审）
    ↓
design/*-module.md（模块评审）
    ↓
api-spec / llm-prompt-spec（契约冻结）
    ↓
代码
```

**spec-alignment-notes.md** 保留供 Dev5 确认 Agent 指南与 Spec 差异，模块设计确认后可打勾归档。

---

## frontend-module.md 建议章节（Dev1/2）

- 路由与页面划分（引用 frontend-routes.md）
- 状态管理方案（Context / Zustand / 无）
- GraphCanvas 组件设计：G6 数据映射、双视图 props
- API 层封装约定
- 与后端联调顺序

## backend-module.md 建议章节（Dev3/4）

- 包结构（引用 architecture.md §5）
- 各 Module 类职责与依赖
- 掌握度 / 风险 / dashboard 计算规则
- AgentProxy 与 Scheduler 设计
- 数据库 migration 策略
- 内部 API 与 JWT 隔离

---

*负责人完成初稿后，在本文档「文档状态」表更新状态。*

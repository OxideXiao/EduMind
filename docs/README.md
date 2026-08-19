# 开发 Spec 文档索引

> 基于 [product/PRD-v0.2.md](./product/PRD-v0.2.md)，对齐 `参考/Agent专责实施指南.md`
> **Day 1 评审后冻结 v0.1，变更请更新变更记录**

---

## 产品文档（`product/`）

| 文档 | 用途 |
|------|------|
| [product/PRD-v0.2.md](./product/PRD-v0.2.md) | 产品需求、MVP 规则与里程碑 |
| [product/mvp功能清单.md](./product/mvp功能清单.md) | 功能一页表（快速核对 F01–F12） |

---

## Spec 文档清单

| 文档 | 用途 | 主责 |
|------|------|------|
| [spec-alignment-notes.md](./spec-alignment-notes.md) | PRD vs Agent 指南差异、**记忆架构决策（§2）**；Dev5 确认改动 | 全员 / Dev 5 |
| [architecture.md](./architecture.md) | 系统架构设计（组件、边界、数据流） | 全员 |
| [tech-setup.md](./tech-setup.md) | 环境、部署、分支、DoD | Dev 3 |
| [api-spec.md](./api-spec.md) | Spring + Agent 接口契约 | Dev 3 + Dev 5 |
| [llm-prompt-spec.md](./llm-prompt-spec.md) | Prompt 模板与输出 Schema | Dev 5 |
| [demo-seed-spec.md](./demo-seed-spec.md) | 演示数据与 Demo 剧本 | Dev 4 + Dev 5 |
| [frontend-routes.md](./frontend-routes.md) | 页面路由与前后端分工 | Dev 1 + Dev 2 |

### 模块设计（`design/`，模块评审用）

| 文档 | 用途 | 主责 | 状态 |
|------|------|------|------|
| [design/agent-module.md](./design/agent-module.md) | Agent 模块详细设计 | Dev 5 | v0.1 待确认 |
| [design/frontend-module.md](./design/frontend-module.md) | 前端模块详细设计 | Dev 1 / Dev 2 | 待补充 |
| [design/backend-module.md](./design/backend-module.md) | 后端模块详细设计 | Dev 3 / Dev 4 | 待补充 |
| [design/database-schema.md](./design/database-schema.md) | **数据库设计（Dev3 填写）** | Dev 3 / Dev 4 | 待填写 |
| [design/README.md](./design/README.md) | 模块设计模板与说明 | — | — |

### 参考（非 Spec 正本）

| 文档 | 用途 |
|------|------|
| [../参考/Agent专责实施指南.md](../参考/Agent专责实施指南.md) | Dev5 实现参考（代码教程）；设计以 `design/agent-module.md` 为准 |

---

## 文档分层（文件结构）

```text
docs/product/PRD-v0.2.md     产品范围
    ↓
architecture.md              ← 系统架构
api-spec / llm-prompt-spec / …  ← Spec 契约
    ↓
design/*-module.md           ← 模块详细设计
    ↓
spec-alignment-notes.md      ← Dev5 对齐待改项
    ↓
代码
```

---

## Day 1 建议流程

1. 全员过 `spec-alignment-notes.md` §2 记忆架构 + §1 差异表（20 min）
2. Dev 3 / Dev 5 确认 `api-spec.md` 内部接口（30 min）
3. Dev 1 / Dev 2 确认 `frontend-routes.md` 分工（15 min）
4. Dev 5 按 `llm-prompt-spec.md` 初始化 agent-service
5. 搭骨架，`POST /api/dev/seed` 列入 Day 2 目标

架构与模块设计文档（`architecture.md`、`design/`）可在 Spec 评审前后阅读；**模块设计评审安排在 Spec 冻结之后**，由 Dev1/2、Dev3/4 按 `design/README.md` 模板补充。

# 桌面端项目开发

## 项目总览

你是全栈架构师，负责从零搭建「深迪设计 AI 平台」。项目是一个 **Electron 桌面端 AI 设计工具**：用户像使用 Figma 一样在画布上编辑设计稿，也可以用自然语言描述需求，由一套**多智能体引擎**（基于 Codex CLI）自动生成可编辑的设计文档；同时通过 **MCP（Model Context Protocol）服务**把当前设计状态桥接给外部编码 Agent，实现"设计稿 → 代码"闭环。

### 0.1 总体约束

- 使用 **pnpm workspace 单仓库**（monorepo），目录分 `apps/*` 与 `packages/*`。
- 全部代码 **TypeScript 严格模式**；React 组件为 `.tsx`，非组件为 `.ts`。
- 包名统一 `@miaoma-design-ai/<pkg>`，内部依赖用 `workspace:*`。
- 代码风格：Prettier + ESLint + simple-import-sort（import 排序）、commitlint + cz-git、husky、cspell。
- 每个包提供 `build / lint / format / format:check / test / test:run` 脚本；测试用 Vitest。
- 无独立 HTTP 后端；"后端" = Electron 主进程（本地服务层）+ MCP 服务 + 本地文件持久化。
- 版权头（可选）：文件顶部注释保留作者信息。

### 0.2 仓库结构

```
dt-ai-design/
├─ apps/
│  ├─ desktop/          # Electron 桌面应用（前端 + 主进程"后端"）
│  └─ server/           # 预留，当前为空占位
└─ packages/
   ├─ design-schema/        # 设计文档数据模型 + 校验（前端与 Agent 共用）
   ├─ editor-core/          # 编辑器领域模型 / 命令 / 会话（纯逻辑，无 UI）
   ├─ editor-interaction/   # 编辑器交互（预留）
   ├─ canvas-ruler/         # 画布标尺 React 组件
   ├─ design-generation/    # 多 Agent 生成编排引擎
   ├─ agent-core/           # Agent 领域模型（花名册、Run 状态机）
   ├─ agent-codex/          # Codex CLI Provider（子进程 + JSONL 事件流）
   ├─ agent-history/        # 生成历史文件存储
   ├─ agent-orchestrator/   # 编排（预留）
   ├─ agent-protocol/       # 协议（预留）
   ├─ agent-provider-codex/ # Provider 抽象（预留）
   ├─ agent-runtime/        # 运行时（预留）
   └─ mcp/                  # MCP stdio 服务器（sidecar 打包）
```

---

## 前端开发

### 角色与目标

你是资深 Electron + React 前端工程师，实现桌面端 AI 设计编辑器的全部 UI。产品形态对标 Pencil/Canva：左侧图层树、中央画布、右侧属性检查器、底部/侧边 AI 指令输入区，以及顶部工具栏。UI 组件一律基于 **shadcn/ui（Radix UI + Tailwind CSS v4）** 构建。

### 技术栈清单

- 运行时与构建：**Electron** + **electron-forge**（Vite 插件）+ **Vite** + `@vitejs/plugin-react`。
- 语言与框架：**TypeScript**（strict）、**React**。
- 样式：**Tailwind CSS v4**（CSS-first，`@theme` 定义设计令牌）+ **shadcn/ui** + **Radix UI primitives** + `tailwindcss-animate` + `tailwind-merge` + `clsx`。
- 图标：**lucide-react**。
- 路由：**react-router-dom 7**（桌面端用 `createHashRouter`）。
- 表单：**react-hook-form 7**（属性检查器输入区）。
- 手势：**@use-gesture/react**（画布节点拖拽、缩放）。
- 测试：**Vitest** + **@testing-library/react** + `@testing-library/user-event` + **jsdom**。
- 包管理：pnpm；内部 UI 无关逻辑抽到 `packages/*`。
- 状态管理：采用 **React Context + reducer 会话**，不引入 Redux/Zustand：
- ui 使用 shadcn/ui 组件库。

### 验收标准

- `pnpm start`（electron-forge start）可打开窗口并进入仪表盘 → 编辑器。
- 可创建/导入/删除项目（本地 JSON 持久化），可编辑节点属性且右侧检查器实时同步。
- 画布支持拖拽、框选、缩放、撤销等基础交互；标尺与选区覆盖层正确。
- 所有 UI 组件来自 shadcn/ui，主题令牌统一，暗色/亮色遵循 `color-scheme`。
- Vitest 全绿。

## 后端提示词

### 角色与目标

你是 Electron 主进程 / Node 服务工程师，实现桌面应用的**本地服务层**：窗口与生命周期、IPC 桥、项目持久化、AI 生成运行时、以及面向外部编码 Agent 的 **MCP stdio 服务**（sidecar）。注意：本项目**没有独立 HTTP 服务器**（`apps/server` 为占位），一切服务内嵌于 Electron 主进程。

### 技术栈清单

- **Node.js**（Electron 主进程环境）+ **TypeScript 5.9**（strict）。
- **@modelcontextprotocol/sdk**（`McpServer` / `StdioServerTransport`）+ **zod**（工具入参校验）。
- 文件持久化：`node:fs/promises` + `node:path`；JSON 文档落盘。
- 子进程：`node:child_process`（spawn Codex CLI、MCP 命令）。
- 测试：**Vitest**（主进程逻辑，`tests/*.test.ts`）。

### 验收标准

- 主进程启动 → 创建窗口 → preload API 可被渲染进程调用。
- 项目 CRUD 与导入在重启后数据不丢失；共享 IPC 类型在 main/renderer 两侧一致。
- 启动生成运行：主进程能 spawn Codex、推送进度事件、取消生效、失败返回结构化错误。
- MCP stdio 模式可被 Codex 发现并调用 5 个工具，入参校验与错误码正确。
- Vitest 覆盖 projectStore、generationRuntime、mcp registration/appService、screenshotCapture。

---

## Agent 提示词（多智能体设计生成引擎）

### 角色与目标

你是 AI Agent 系统工程师，实现「自然语言 → 可编辑设计文档」的**多智能体生成引擎**。核心思路：一个协调 Agent（coordinator）把用户需求拆解为多个区域任务（region assignment），最多 5 个协作者 Agent（collaborator）**并行**通过 **Codex CLI** 各自生成设计片段（fragment），引擎负责解析、组装、严格校验与**视觉闭环修复**（截图 + 视觉审查 + repair 循环）。

### 技术栈清单

- **TypeScript 5.9**（strict），纯 Node（不依赖 UI）。
- Agent 执行载体：**Codex CLI**（`codex exec` 子进程），通过 **JSONL 事件流**读取进度/结果；`--json` 输出结构化结果。
- JSON 契约：所有 Agent 产出（plan / fragment / variables-draft / visual-check / repair-batch）都有**固定 JSON Schema**，引擎内做严格解析与校验。
- 存储：**本地文件**（生成历史 `miaoma-agent-history`，按运行写 JSONL/文件）。
- 测试：**Vitest**（状态机迁移、契约解析、编排流程、组装）。

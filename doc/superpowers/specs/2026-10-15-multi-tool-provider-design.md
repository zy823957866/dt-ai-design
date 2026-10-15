# 多工具接入设计（Codex / OpenCode）

- 日期：2026-10-15
- 状态：已评审通过，待实现
- 相关包：`agent-provider-core`（新增）、`agent-provider-codex`、`agent-provider-opencode`（新增）、`agent-orchestrator`、`agent-protocol`、`apps/desktop`

## 1. 背景与目标

当前 Chat 输入框底部只有一个写死的「选择模型」下拉（`gpt-4o / gpt-5 / o3`），值经 `GenerationStartInput.model` 一路传到 `CodexProvider` 的 `--model`。整个生成链路（`Orchestrator` → `CodexProvider`）只支持 codex 一种 CLI，且类型写死。

目标：

1. Chat 底部改为两个下拉：**工具**（Codex / OpenCode）+ **模型**。
2. 切换工具时，模型列表**动态重读**对应 CLI，不能写死。
3. 切换工具时，生成路由到对应 provider。
4. 工具 + 模型选择**持久化**到全局 `AppSettings`。

已验证的关键事实：

- `codex debug models` 输出 JSON：`{ "models": [{ "slug", "display_name", "visibility", ... }] }`。
- `opencode models` 逐行输出 `provider/model`。
- `opencode run --format json --standalone --model <m> [--session <id>] [--auto]` 可用；**无 message 参数时从 stdin 读取 prompt**（`exit=0`），可传大 prompt，规避 Windows argv 长度限制。
- `opencode run --format json` 的 JSONL 事件每行一个，均带 `sessionID`，可作会话续接 id：
  - `step_start`（`part.type=step-start`）
  - `tool_use`（`part.type=tool`、`part.tool`、`part.state.{status,input,output}`）
  - `text`（`part.text`）
  - `step_finish`（`part.{reason,cost,tokens}`）
  - `error`（`error.{type,message,status}`）
- codex 既有实现见 `packages/agent-provider-codex`（`codex exec --json`、stdin 传 prompt、`resume <threadId>`、Windows `.cmd` 经 cmd.exe 代理、AbortSignal 树杀）。

## 2. 范围

范围外（YAGNI）：

- 不做按项目持久化（仅全局设置）。
- 不做模型搜索/收藏/分组。
- 不新增第三种工具（结构上可扩展即可）。
- 不改动 planner/executor 多代理流程。

## 3. 包结构

### 3.1 新增 `packages/agent-provider-core`（统一契约）

导出：

- `AgentTool = 'codex' | 'opencode'`
- `AgentModelInfo = { id: string; label: string }`
- `AgentProvider` 接口：`execute(req: AgentExecRequest): Promise<AgentExecResult>`
- `AgentExecRequest`：
  ```ts
  {
    prompt: string;
    cwd: string;
    model?: string;
    conversation?: { type: 'new' } | { type: 'resume'; id: string };
    access?: 'read-only' | 'workspace-write' | 'full-access';
    responseFormat?: 'text' | 'json';
    signal?: AbortSignal;
    onEvent?: (event: AgentExecEvent) => void;
  }
  ```
- `AgentExecResult`：`{ conversationId: string; text: string; json?: unknown; usage?: Record<string, unknown> }`
- `AgentExecEvent`（归一化）：
  ```ts
  | { type: 'step-started' }
  | { type: 'activity'; activity: AgentActivity }
  | { type: 'message'; text: string }
  | { type: 'turn-completed'; usage?: Record<string, unknown> }
  | { type: 'turn-failed'; error: { code: string; message: string } }
  ```
- `AgentActivity = { id; kind: 'bash'; status: 'running'|'completed'|'failed'; input: { command }; output?: { summary }; error?: { code; message } }`
- `AgentExecError`（`code`: `cancelled` / `spawn-failed` / `turn-failed` / `invalid-json` / `missing-message` / `missing-conversation-id` / `nonzero-exit`，附带 `exitCode?`、`stderr?`）
- `AgentToolDefinition`：
  ```ts
  {
    id: AgentTool;
    label: string;
    createProvider(options?: { command?: string; env?: Record<string,string> }): AgentProvider;
    listModels(options?: { command?: string }): Promise<AgentModelInfo[]>;
  }
  ```

同时上移通用工具：

- `extractJson(text): unknown`（从 codex 的 `jsonl.ts` 上移）。
- `spawnCli(command, args)`：Windows 下 `.cmd`/`.bat` 经 `cmd.exe` 代理、`.exe`/其它直接执行；返回 `{ file, argv }`。
- `terminateTree(child)`：Windows 用 `taskkill /pid <pid> /T /F`，其余 `SIGTERM`。
- 一个通用的「逐行 JSONL 读取子进程」工具，供两个 provider 复用。

### 3.2 改造 `packages/agent-provider-codex`

- 类型改从 `agent-provider-core` 导入；对既有类型名做 re-export 以保持兼容。
- `CodexProvider implements AgentProvider`（`threadId` 字段对外即 `conversationId`）。
- 新增 `listModels()`：spawn `codex debug models`，解析 `models[]`，过滤 `visibility === 'list'`，映射 `{ id: slug, label: display_name }`。
- 导出 `codexTool: AgentToolDefinition`。
- 复用 core 的 `spawnCli` / `terminateTree` / `extractJson`。

### 3.3 新增 `packages/agent-provider-opencode`

`OpenCodeProvider implements AgentProvider`：

- 命令：`opencode`（可用 `command` 覆盖）。
- 参数：`['run', '--format', 'json', '--standalone', ...(model?['--model',model]:[]), ...(resume?['--session',id]:[]), ...(access 允许写?['--auto']:[])]`。
- prompt 经 **stdin** 传入（不传 message 参数）。
- stdout JSONL 解析为 `AgentExecEvent`：
  - `step_start` → `step-started`
  - `text`（`part.text`）→ `message`
  - `tool_use`（`part.tool === 'shell'`）→ `activity`（`input.command`、`state.output`、`state.status`）
  - `step_finish` → `turn-completed`（`usage` 取 `part.tokens`/`part.cost`）
  - `error` → `turn-failed`
  - 每行 `sessionID` 记录为 `conversationId`
- `responseFormat === 'json'` 时对最终 `message` 文本调用 `extractJson`。
- AbortSignal → `terminateTree`。
- `listModels()`：spawn `opencode models`，按行解析 `provider/model` → `{ id, label: id }`。
- 导出 `opencodeTool: AgentToolDefinition`。

## 4. 契约改动

### 4.1 `agent-orchestrator`

- `Orchestrator` 依赖 **`AgentProvider` 接口**，不再 `import { CodexProvider }`。
- `generateDocument(input, run, provider)` 接收 provider（或构造时注入 registry）。
- `GenerateInput.threadId` → `conversationId`。
- `provider.execute` 的 `sandbox` 改为 `access`。
- 事件转发（`forwardEvent`）改用 `AgentExecEvent`。
- `executor/index.ts` 同样改为依赖接口。

### 4.2 事件映射保持不变

`activity` / `message` → `agent:step`（UI 时间线不变）。

## 5. 主进程（apps/desktop/src/main）

- 新增 `toolRegistry.ts`：`{ codex: codexTool, opencode: opencodeTool }`。
- 新增 `resolveOpenCodeCommand()`：优先 `DT_OPENCODE_EXECUTABLE` / `OPENCODE_CLI_PATH`，兜底 `"opencode"`（与 `codexExecutable.ts` 同构）。
- `generationRuntime.ts`：
  - 构造 registry，不再写死 `CodexProvider`。
  - `execute` 按 `input.tool` 选择 provider（按 tool 缓存 provider 实例）。
  - 会话缓存 key 改为 `${projectId}::${tool}`；切工具各走各的会话，切回可续接。
  - `resetThread(projectId)` 清除该项目所有 tool 的会话（或提供按 tool 版本）。
- `ipcHandlers.ts`：新增 `LIST_MODELS` handler，返回 `AgentModelInfo[]`。

## 6. 共享类型（apps/desktop/src/shared/ipc-types.ts）

- `GenerationStartInput`：新增 `tool: AgentTool`（保留 `model?`）。
- `AppSettings`：新增 `tool: AgentTool`、`model: string`（默认 `codex`）。
- `DesktopAPI`：新增 `listModels: (tool: AgentTool) => Promise<AgentModelInfo[]>`。
- 新增 `IpcAgentChannel.LIST_MODELS = 'agent:listModels'`。
- `AgentTool` / `AgentModelInfo` 从 `agent-provider-core` re-export（或本地等价定义）。
- `apps/desktop/package.json` 增加 `@dt-ai-design/agent-provider-core`、`@dt-ai-design/agent-provider-opencode` 依赖。

## 7. 渲染层（apps/desktop/src/components/editor/LeftPanel.tsx）

- 新增 hook `useAgentModel()`：
  - 初始化：`getSettings()` 读取 `tool` / `model`。
  - `listModels(tool)` 拉取列表（loading / error 状态）。
  - 切工具：拉新列表，`model` 重置为该工具首个模型，`setSettings({ tool, model })`。
  - 切模型：`setSettings({ model })`。
- UI 改造：
  - 底部左侧由 `ModelSelector` 改为 **`ToolSelector`（Codex / OpenCode）** + **`ModelSelector`（动态列表）**。
  - 模型列表过长时下拉可滚动。
- `ChatTab`：`start(text, { tool, model })`。
- `useGeneration.start` 将 `{ tool, model }` 放进 `startGeneration` 入参。

## 8. 错误处理

- CLI 未安装 / 路径错：spawn 失败 → 友好文案「未找到 codex/opencode CLI，请安装或设置 `XXX_CLI_PATH`」。
- 模型列表读取失败：列表为空 + 错误提示，模型选择占位「默认模型」（此时 `model` 传空，由 CLI 用其默认）。
- opencode 统一 `--standalone`，规避共享后台服务端口冲突。
- 生成失败沿用现有 `done.status=failed` + `error.message`。

## 9. 测试

单元测试（vitest）：

- `agent-provider-opencode`：JSONL 事件解析（`step_start` / `text` / `tool_use` / `step_finish` / `error` 的 fixture）、`opencode models` 行解析。
- `agent-provider-codex`：`codex debug models` JSON 解析 + `visibility` 过滤。
- `agent-provider-core`：`spawnCli` 的 Windows 目标解析（纯函数）、`extractJson` 回归。

手动验收：

- 启动桌面端，Chat 底部可见工具 + 模型两个下拉。
- 选 OpenCode → 模型列表变为 `opencode models` 结果；选 Codex → 变为 codex 目录。
- 两工具各生成一次，事件时间线正常、文档落画布（可撤销）。
- 切换工具再切回，会话可续接（各自 conversationId 独立）。
- 重启 app，工具/模型选择仍保留。

## 10. 风险与权衡

- **模型目录体积**：`codex debug models` 约 1MB，后端解析后只回传 `{id,label}` 精简列表，避免 IPC 传大对象。
- **codex 无 `models` 子命令**：改用 `debug models`（非正式但可用）；若未来变化，`listModels` 内部可回退到配置/空列表。
- **opencode 权限模型**：无 `--sandbox`，用 `--auto` 近似 codex 的 `workspace-write` 非交互写入语义（在 headless 下避免权限阻塞）。
- **新增包体积**：core 保持零运行时依赖。

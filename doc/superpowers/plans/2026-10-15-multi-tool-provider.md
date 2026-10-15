# 多工具接入（Codex / OpenCode）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让桌面端 Chat 从「选择模型」变为「选择工具（Codex/OpenCode）+ 选择模型」，切换工具时动态读取该 CLI 的模型列表并将生成路由到对应 provider，选择持久化到全局设置。

**Architecture:** 新增 `agent-provider-core` 定义统一 `AgentProvider` 接口与归一化事件/请求/结果类型，并提供通用工具（`extractJson`、`spawnCli`、`terminateTree`、`readLines`）。`agent-provider-codex` 与新建的 `agent-provider-opencode` 各自实现该接口并导出 `AgentToolDefinition`（含 `listModels`）。`agent-orchestrator` 改为依赖接口。桌面端主进程用 `toolRegistry` 按工具分派 provider，渲染层用两个下拉驱动。

**Tech Stack:** TypeScript、tsdown、vitest、Electron + React、pnpm workspaces、node:child_process。

## Global Constraints

- Node ≥ 22，pnpm 12.5.1，`nodeLinker: hoisted`。
- 所有包 `"type": "module"`，用 tsdown 构建（`entry: ['src/index.ts']`, `format: ['esm','cjs']`, `dts: true`）。
- 禁止新增运行时依赖到 `agent-provider-core`（保持零依赖）。
- 事件流一律经 stdin 传 prompt（不依赖 argv 长度）。
- opencode 一律加 `--standalone`（规避共享后台服务端口冲突）。
- 遵循仓库代码风格：不加多余注释、2 空格缩进、单引号、尾逗号。
- 提交信息用 Conventional Commits（commitlint 生效）。
- 运行单测：`pnpm --filter <pkg> test:run`；类型检查：`pnpm -r typecheck`。
- 当前工作区已有未提交改动，**不要** `git add .`，只提交本任务涉及的文件。

---

### Task 1: 新建 `agent-provider-core` 包（契约 + 通用工具）

**Files:**

- Create: `packages/agent-provider-core/package.json`
- Create: `packages/agent-provider-core/tsconfig.json`
- Create: `packages/agent-provider-core/tsdown.config.ts`
- Create: `packages/agent-provider-core/src/types.ts`
- Create: `packages/agent-provider-core/src/json.ts`
- Create: `packages/agent-provider-core/src/process.ts`
- Create: `packages/agent-provider-core/src/index.ts`
- Create: `packages/agent-provider-core/src/tests/json.test.ts`
- Create: `packages/agent-provider-core/src/tests/process.test.ts`
- Modify: `tsconfig.base.json`（新增 core 的 paths）

**Interfaces:**

- Produces:
  - `AgentTool = 'codex' | 'opencode'`
  - `AgentModelInfo = { id: string; label: string }`
  - `AgentAccess = 'read-only' | 'workspace-write' | 'full-access'`
  - `AgentConversation = { type: 'new' } | { type: 'resume'; id: string }`
  - `AgentActivity`（同上设计）
  - `AgentExecEvent`、`AgentExecRequest`、`AgentExecResult`
  - `AgentErrorCode`、`class AgentExecError`
  - `interface AgentProvider { execute(request: AgentExecRequest): Promise<AgentExecResult> }`
  - `AgentProviderOptions = { command?: string; env?: Record<string,string> }`
  - `AgentToolDefinition = { id; label; createProvider(opts?): AgentProvider; listModels(opts?: { command?: string }): Promise<AgentModelInfo[]> }`
  - `extractJson(message: string): unknown`
  - `resolveSpawnTarget(command: string, args: string[]): { file: string; argv: string[] }`
  - `spawnCli(command: string, args: string[], options?: { cwd?: string; env?: Record<string,string> }): ChildProcess`
  - `terminateTree(child: ChildProcess): void`
  - `readLines(stream: Readable | null, onLine: (line: string) => void): Promise<void>`
  - `readStream(stream: Readable | null, onChunk: (text: string) => void, maxLength?: number): Promise<string>`

- [ ] **Step 1: 创建包脚手架**

`packages/agent-provider-core/package.json`：

```json
{
  "name": "@dt-ai-design/agent-provider-core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "接入层核心契约：AgentProvider 接口、归一化事件与通用工具",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.mts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "scripts": {
    "build": "tsdown",
    "dev": "tsdown --watch",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "devDependencies": {
    "@types/node": "^22.20.5",
    "tsdown": "^0.23.0",
    "typescript": "^6.0.3",
    "vitest": "^5.0.3"
  }
}
```

`packages/agent-provider-core/tsconfig.json`：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["node"]
  },
  "include": ["src/**/*", "tsdown.config.ts"]
}
```

`packages/agent-provider-core/tsdown.config.ts`：

```ts
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
});
```

- [ ] **Step 2: 写类型契约 `src/types.ts`**

```ts
/** 多工具接入层核心契约。 */

export type AgentTool = 'codex' | 'opencode';

export interface AgentModelInfo {
  id: string;
  label: string;
}

export type AgentAccess = 'read-only' | 'workspace-write' | 'full-access';

export type AgentConversation =
  { type: 'new' } | { type: 'resume'; id: string };

export interface AgentActivity {
  id: string;
  kind: 'bash';
  status: 'running' | 'completed' | 'failed';
  input: { command: string };
  output?: { summary: string };
  error?: { code: string; message: string };
}

export type AgentExecEvent =
  | { type: 'step-started' }
  | { type: 'activity'; activity: AgentActivity }
  | { type: 'message'; text: string }
  | { type: 'turn-completed'; usage?: Record<string, unknown> }
  | { type: 'turn-failed'; error: { code: string; message: string } };

export interface AgentExecRequest {
  prompt: string;
  cwd: string;
  model?: string;
  conversation?: AgentConversation;
  access?: AgentAccess;
  responseFormat?: 'text' | 'json';
  signal?: AbortSignal;
  onEvent?: (event: AgentExecEvent) => void;
}

export interface AgentExecResult {
  conversationId: string;
  text: string;
  json?: unknown;
  usage?: Record<string, unknown>;
}

export type AgentErrorCode =
  | 'cancelled'
  | 'spawn-failed'
  | 'turn-failed'
  | 'invalid-json'
  | 'missing-message'
  | 'missing-conversation-id'
  | 'nonzero-exit';

export class AgentExecError extends Error {
  readonly code: AgentErrorCode;
  readonly exitCode?: number | null;
  readonly stderr?: string;

  constructor(args: {
    code: AgentErrorCode;
    message: string;
    exitCode?: number | null;
    stderr?: string;
  }) {
    super(args.message);
    this.name = 'AgentExecError';
    this.code = args.code;
    this.exitCode = args.exitCode;
    this.stderr = args.stderr;
  }
}

export interface AgentProvider {
  execute(request: AgentExecRequest): Promise<AgentExecResult>;
}

export interface AgentProviderOptions {
  command?: string;
  env?: Record<string, string>;
}

export interface AgentToolDefinition {
  id: AgentTool;
  label: string;
  createProvider(options?: AgentProviderOptions): AgentProvider;
  listModels(options?: { command?: string }): Promise<AgentModelInfo[]>;
}
```

- [ ] **Step 3: 写 `extractJson` 的失败测试 `src/tests/json.test.ts`**

````ts
import { describe, expect, it } from 'vitest';
import { extractJson } from '../json';

describe('extractJson', () => {
  it('parses a raw JSON object', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses JSON wrapped in a markdown fence', () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('extracts the first JSON object from surrounding prose', () => {
    expect(extractJson('here you go: {"a":1} done')).toEqual({ a: 1 });
  });

  it('extracts a JSON array', () => {
    expect(extractJson('result: [1,2,3]')).toEqual([1, 2, 3]);
  });

  it('throws on invalid JSON', () => {
    expect(() => extractJson('no json here')).toThrow();
  });
});
````

- [ ] **Step 4: 运行测试确认失败**

Run: `pnpm --filter @dt-ai-design/agent-provider-core test:run`
Expected: FAIL（`../json` 不存在）。若报「找不到包」，先执行 `pnpm install`。

- [ ] **Step 5: 实现 `src/json.ts`**

````ts
const MAX_SUMMARY_LENGTH = 2000;

export const summarizeText = (value: unknown, fallback: string): string => {
  const text = typeof value === 'string' ? value.trim() || fallback : fallback;
  return text.length <= MAX_SUMMARY_LENGTH
    ? text
    : `${text.slice(0, MAX_SUMMARY_LENGTH - 3)}...`;
};

export const extractJson = (message: string): unknown => {
  const trimmed = message.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  const objectStart = withoutFence.indexOf('{');
  const arrayStart = withoutFence.indexOf('[');
  const start =
    objectStart < 0
      ? arrayStart
      : arrayStart < 0
        ? objectStart
        : Math.min(objectStart, arrayStart);
  const end =
    start < 0
      ? -1
      : withoutFence.lastIndexOf(withoutFence[start] === '{' ? '}' : ']');

  const candidates = [
    trimmed,
    withoutFence,
    start >= 0 && end >= start ? withoutFence.slice(start, end + 1) : undefined,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // try next candidate
    }
  }

  throw new Error('Final message is not valid JSON.');
};
````

- [ ] **Step 6: 运行测试确认通过**

Run: `pnpm --filter @dt-ai-design/agent-provider-core test:run`
Expected: PASS（5 passed）。

- [ ] **Step 7: 写 `spawnCli` 目标解析的失败测试 `src/tests/process.test.ts`**

```ts
import { describe, expect, it, vi, afterEach } from 'vitest';
import { resolveSpawnTarget } from '../process';

describe('resolveSpawnTarget', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('returns the command directly on non-win32', () => {
    const original = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });
    expect(resolveSpawnTarget('codex', ['exec'])).toEqual({
      file: 'codex',
      argv: ['exec'],
    });
    Object.defineProperty(process, 'platform', { value: original });
  });

  it('spawns .exe directly on win32', () => {
    const original = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });
    expect(resolveSpawnTarget('C:\\bin\\codex.exe', ['exec'])).toEqual({
      file: 'C:\\bin\\codex.exe',
      argv: ['exec'],
    });
    Object.defineProperty(process, 'platform', { value: original });
  });

  it('proxies non-exe through cmd.exe on win32', () => {
    const original = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });
    vi.stubEnv('ComSpec', 'cmd.exe');
    expect(resolveSpawnTarget('codex', ['exec'])).toEqual({
      file: 'cmd.exe',
      argv: ['/d', '/c', 'codex', 'exec'],
    });
    Object.defineProperty(process, 'platform', { value: original });
  });
});
```

- [ ] **Step 8: 运行测试确认失败**

Run: `pnpm --filter @dt-ai-design/agent-provider-core test:run process`
Expected: FAIL（`resolveSpawnTarget` 未导出）。

- [ ] **Step 9: 实现 `src/process.ts`**

```ts
import { spawn, type ChildProcess } from 'node:child_process';
import type { Readable } from 'node:stream';

export interface SpawnTarget {
  file: string;
  argv: string[];
}

/**
 * Windows 兼容：npm/pnpm 安装的 CLI 多为 .CMD wrapper，
 * Node ≥18.20 禁止直接 spawn .cmd/.bat，需经 cmd.exe 代理；.exe 直接执行。
 */
export const resolveSpawnTarget = (
  command: string,
  args: string[],
): SpawnTarget => {
  if (process.platform !== 'win32') return { file: command, argv: args };
  if (command.toLowerCase().endsWith('.exe')) {
    return { file: command, argv: args };
  }
  const cmd = process.env.ComSpec ?? 'cmd.exe';
  return { file: cmd, argv: ['/d', '/c', command, ...args] };
};

export const spawnCli = (
  command: string,
  args: string[],
  options: { cwd?: string; env?: Record<string, string> } = {},
): ChildProcess => {
  const { file, argv } = resolveSpawnTarget(command, args);
  return spawn(file, argv, {
    cwd: options.cwd,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: options.env ? { ...process.env, ...options.env } : undefined,
    windowsHide: true,
  });
};

/** 终止子进程。Windows 下经 cmd.exe 代理时须树杀孙进程。 */
export const terminateTree = (child: ChildProcess): void => {
  if (child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform === 'win32' && child.pid !== undefined) {
    const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    killer.on('error', () => child.kill('SIGKILL'));
    return;
  }
  child.kill('SIGTERM');
};

/** 按行读取流（自动缓冲跨 chunk 的不完整行）。 */
export const readLines = async (
  stream: Readable | null,
  onLine: (line: string) => void,
): Promise<void> => {
  if (!stream) return;
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of stream) {
    buffer += decoder.decode(chunk as Buffer, { stream: true });
    let nl = buffer.indexOf('\n');
    while (nl >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) onLine(line);
      nl = buffer.indexOf('\n');
    }
  }
  const tail = (buffer + decoder.decode()).trim();
  if (tail) onLine(tail);
};

/** 读取流为字符串，可选保留末尾 maxLength 字符。 */
export const readStream = async (
  stream: Readable | null,
  onChunk: (text: string) => void,
  maxLength = Number.POSITIVE_INFINITY,
): Promise<string> => {
  if (!stream) return '';
  const decoder = new TextDecoder();
  let text = '';
  for await (const chunk of stream) {
    const part = decoder.decode(chunk as Buffer, { stream: true });
    text += part;
    if (text.length > maxLength) text = text.slice(-maxLength);
    onChunk(part);
  }
  return text;
};
```

- [ ] **Step 10: 写 `src/index.ts` 导出**

```ts
export { extractJson, summarizeText } from './json';
export {
  resolveSpawnTarget,
  spawnCli,
  terminateTree,
  readLines,
  readStream,
  type SpawnTarget,
} from './process';
export {
  AgentExecError,
  type AgentTool,
  type AgentModelInfo,
  type AgentAccess,
  type AgentConversation,
  type AgentActivity,
  type AgentExecEvent,
  type AgentExecRequest,
  type AgentExecResult,
  type AgentErrorCode,
  type AgentProvider,
  type AgentProviderOptions,
  type AgentToolDefinition,
} from './types';
```

- [ ] **Step 11: 注册 tsconfig paths**

修改 `tsconfig.base.json` 的 `paths`，在 `agent-provider-codex` 条目后新增：

```json
      "@dt-ai-design/agent-provider-core": [
        "./packages/agent-provider-core/src/index.ts"
      ],
```

- [ ] **Step 12: 安装、测试、构建、提交**

Run:

```bash
pnpm install
pnpm --filter @dt-ai-design/agent-provider-core test:run
pnpm --filter @dt-ai-design/agent-provider-core typecheck
pnpm --filter @dt-ai-design/agent-provider-core build
```

Expected: 测试全 PASS；typecheck 无错；build 生成 `dist/`。

```bash
git add packages/agent-provider-core tsconfig.base.json pnpm-lock.yaml
git commit -m "feat(agent-provider-core): add provider contract and cli utils"
```

---

### Task 2: 迁移 `agent-provider-codex` 到 core，新增 `listModels` 与 `codexTool`

**Files:**

- Modify: `packages/agent-provider-codex/package.json`
- Modify: `packages/agent-provider-codex/src/types.ts`
- Modify: `packages/agent-provider-codex/src/jsonl.ts`
- Modify: `packages/agent-provider-codex/src/adapters/codex.ts`
- Create: `packages/agent-provider-codex/src/tools.ts`
- Create: `packages/agent-provider-codex/src/models.ts`
- Create: `packages/agent-provider-codex/src/tests/models.test.ts`
- Modify: `packages/agent-provider-codex/src/index.ts`

**Interfaces:**

- Consumes: `AgentProvider`, `AgentExecRequest`, `AgentExecResult`, `AgentExecEvent`, `AgentExecError`, `extractJson`, `spawnCli`, `terminateTree`, `readLines`, `readStream`, `summarizeText`, `AgentToolDefinition`, `AgentModelInfo`（Task 1）。
- Produces: `CodexProvider implements AgentProvider`（`execute(request: AgentExecRequest)`）；`codexTool: AgentToolDefinition`；`parseCodexModels(json: unknown): AgentModelInfo[]`；类型别名 `CodexExecRequest`/`CodexExecResult`/`CodexExecEvent`/`CodexActivity`/`CodexConversation`/`CodexSandbox` = core 对应类型；`CodexExecError = AgentExecError`。

- [ ] **Step 1: 更新 `package.json`**

在 `dependencies` 增加：`"@dt-ai-design/agent-provider-core": "workspace:*"`；`devDependencies` 增加 `"vitest": "^5.0.3"`；`scripts` 增加 `"test": "vitest"`、`"test:run": "vitest run"`。

- [ ] **Step 2: 用 core 类型替换 `src/types.ts`**

```ts
/** Codex CLI 接入层类型（转发 core 契约，保持既有命名兼容）。 */
import type {
  AgentAccess,
  AgentActivity,
  AgentConversation,
  AgentExecEvent,
  AgentExecRequest,
  AgentExecResult,
} from '@dt-ai-design/agent-provider-core';

export type CodexSandbox = AgentAccess;
export type CodexConversation = AgentConversation;
export type CodexActivity = AgentActivity;
export type CodexExecEvent = AgentExecEvent;
export type CodexExecRequest = AgentExecRequest;
export type CodexExecResult = AgentExecResult;
export { AgentExecError as CodexExecError } from '@dt-ai-design/agent-provider-core';
export type { AgentErrorCode as CodexErrorCode } from '@dt-ai-design/agent-provider-core';
```

- [ ] **Step 3: 精简 `src/jsonl.ts`**

保留 `parseCodexJsonlEvent`，删除本地 `extractJson`（改由 core 提供），并把类型引用改为 core 类型：

- 顶部 `import type { AgentExecEvent } from '@dt-ai-design/agent-provider-core';` 并把函数签名/返回值中的 `CodexExecEvent` 换成 `AgentExecEvent`，同时从 `@dt-ai-design/agent-provider-core` 导入 `summarizeText` 替换本地 `summarize`。
- 删除文件末尾的 `extractJson` 定义。
- `readError` 的默认 code 保持 `'CODEX_TURN_FAILED'`。

最终导出：`export const parseCodexJsonlEvent = (line: string): AgentExecEvent | null => { ... }`（函数体不变，只是 `summarize` 换成导入的 `summarizeText(value, fallback)`）。

- [ ] **Step 4: 重写 `src/adapters/codex.ts` 使用 core 工具**

将：

- `import { spawn, type ChildProcess } from 'node:child_process';` 保留（用于类型）。
- 删除本地 `MAX_STDERR_LENGTH`、`resolveSpawnTarget`、`terminate`，改用 core 的 `spawnCli`、`terminateTree`、`readLines`、`readStream`。
- `execute(request: AgentExecRequest): Promise<AgentExecResult>`。
- 命令参数保持不变：`exec [resume] --json --skip-git-repo-check [--sandbox X | -c sandbox_mode="X"] [--model M] [threadId] -`。
- `access`（默认 `'workspace-write'`）替代 `sandbox`。
- `conversation` 默认 `{ type: 'new' }`。
- 返回值 `conversationId` 替代 `threadId`。
- 错误一律 `AgentExecError`（code 用 core 的 code 集合：`cancelled`/`spawn-failed`/`turn-failed`/`missing-message`/`missing-conversation-id`/`nonzero-exit`/`invalid-json`）。

关键实现骨架（完整替换类体）：

```ts
import type { ChildProcess } from 'node:child_process';

import {
  AgentExecError,
  extractJson,
  readLines,
  readStream,
  spawnCli,
  terminateTree,
  type AgentExecRequest,
  type AgentExecResult,
} from '@dt-ai-design/agent-provider-core';

import { parseCodexJsonlEvent } from '../jsonl';

export interface CodexProviderOptions {
  command?: string;
  env?: Record<string, string>;
}

const MAX_STDERR_LENGTH = 16000;

export class CodexProvider {
  private readonly command: string;
  private readonly env?: Record<string, string>;

  constructor(options: CodexProviderOptions = {}) {
    this.command = options.command ?? process.env.CODEX_CLI_PATH ?? 'codex';
    this.env = options.env;
  }

  async execute(request: AgentExecRequest): Promise<AgentExecResult> {
    if (!request.prompt.trim()) {
      throw new AgentExecError({
        code: 'spawn-failed',
        message: 'Prompt 不能为空。',
      });
    }
    if (request.signal?.aborted) {
      throw new AgentExecError({
        code: 'cancelled',
        message: 'Codex 执行已被取消。',
      });
    }

    const sandbox = request.access ?? 'workspace-write';
    const conversation = request.conversation ?? ({ type: 'new' } as const);

    const args = ['exec'];
    if (conversation.type === 'resume') args.push('resume');
    args.push('--json', '--skip-git-repo-check');
    if (conversation.type === 'resume') {
      args.push('-c', `sandbox_mode="${sandbox}"`);
    } else {
      args.push('--sandbox', sandbox);
    }
    if (request.model) args.push('--model', request.model);
    if (conversation.type === 'resume') args.push(conversation.id);
    args.push('-');

    let child: ChildProcess;
    try {
      child = spawnCli(this.command, args, { cwd: request.cwd, env: this.env });
    } catch (error) {
      throw new AgentExecError({
        code: 'spawn-failed',
        message:
          error instanceof Error
            ? `无法启动 codex（${this.command}）：${error.message}`
            : '无法启动 codex 进程。',
      });
    }

    child.stdin?.on('error', () => undefined);
    child.stdin?.end(request.prompt);

    const signal = request.signal;
    const terminate = () => terminateTree(child);
    signal?.addEventListener('abort', terminate, { once: true });

    try {
      let conversationId =
        conversation.type === 'resume' ? conversation.id : undefined;
      let finalMessage: string | undefined;
      let usage: Record<string, unknown> | undefined;
      let turnFailure: { code: string; message: string } | undefined;

      const handleLine = (line: string) => {
        const threadId = parseCodexThreadId(line);
        if (threadId) conversationId = threadId;
        const event = parseCodexJsonlEvent(line);
        if (!event) return;
        if (event.type === 'message') finalMessage = event.text;
        else if (event.type === 'turn-completed') usage = event.usage;
        else if (event.type === 'turn-failed') turnFailure = event.error;
        request.onEvent?.(event);
      };

      let spawnError: Error | undefined;
      const exitPromise = new Promise<{
        code: number | null;
        signal: string | null;
      }>((resolve, reject) => {
        child.once('error', (err) => {
          spawnError = err;
          reject(err);
        });
        child.once('close', (code, signal2) =>
          resolve({ code, signal: signal2 }),
        );
      });

      let stderr = '';
      const stderrDone = readStream(
        child.stderr,
        (text) => {
          stderr += text;
        },
        MAX_STDERR_LENGTH,
      ).catch(() => undefined);

      const stdoutDone = readLines(child.stdout, handleLine).catch(
        () => undefined,
      );

      let exit: { code: number | null; signal: string | null };
      try {
        const results = await Promise.allSettled([
          exitPromise,
          stdoutDone,
          stderrDone,
        ]);
        exit =
          results[0].status === 'fulfilled'
            ? results[0].value
            : { code: null, signal: null };
      } catch {
        exit = { code: null, signal: null };
      }

      if (signal?.aborted) {
        throw new AgentExecError({
          code: 'cancelled',
          message: 'Codex 执行已被取消。',
        });
      }
      if (spawnError) {
        throw new AgentExecError({
          code: 'spawn-failed',
          message: `无法启动 codex（${this.command}）：${spawnError.message}。请确认已安装 codex CLI 并完成 codex login，或设置 CODEX_CLI_PATH 环境变量。`,
        });
      }
      if (turnFailure) {
        throw new AgentExecError({
          code: 'turn-failed',
          message: turnFailure.message,
        });
      }
      if (exit.code !== 0) {
        throw new AgentExecError({
          code: 'nonzero-exit',
          message:
            stderr.trim() ||
            `codex 进程异常退出（exit code ${exit.code ?? 'null'}）。`,
          exitCode: exit.code,
          stderr,
        });
      }
      if (!conversationId) {
        throw new AgentExecError({
          code: 'missing-conversation-id',
          message: 'codex 未输出 thread_id。',
        });
      }
      if (finalMessage === undefined) {
        throw new AgentExecError({
          code: 'missing-message',
          message: 'codex 未输出最终消息。',
        });
      }

      let json: unknown;
      if (request.responseFormat === 'json') {
        try {
          json = extractJson(finalMessage);
        } catch {
          throw new AgentExecError({
            code: 'invalid-json',
            message: 'codex 最终输出不是合法 JSON。',
          });
        }
      }

      return { conversationId, text: finalMessage, json, usage };
    } finally {
      signal?.removeEventListener('abort', terminate);
    }
  }
}
```

> 说明：`AgentExecEvent` 不承载 codex 的 threadId，故 codex 侧需单独从原始行解析。在 `src/jsonl.ts` 中：
>
> 1. 新增导出：
>
> ```ts
> export const parseCodexThreadId = (line: string): string | undefined => {
>   try {
>     const event = JSON.parse(line) as { type?: string; thread_id?: string };
>     return event.type === 'thread.started' &&
>       typeof event.thread_id === 'string'
>       ? event.thread_id
>       : undefined;
>   } catch {
>     return undefined;
>   }
> };
> ```
>
> 2. 把 `thread.started` 分支改为返回 `{ type: 'step-started' }`：
>
> ```ts
>     case 'thread.started':
>       return { type: 'step-started' };
> ```
>
> 适配器顶部 import 增加 `parseCodexThreadId`：`import { parseCodexJsonlEvent, parseCodexThreadId } from '../jsonl';`

- [ ] **Step 5: 新增 `src/models.ts`**

```ts
import {
  spawnCli,
  readStream,
  type AgentModelInfo,
} from '@dt-ai-design/agent-provider-core';

interface RawModel {
  slug?: unknown;
  display_name?: unknown;
  visibility?: unknown;
}

export const parseCodexModels = (catalog: unknown): AgentModelInfo[] => {
  const models =
    catalog &&
    typeof catalog === 'object' &&
    Array.isArray((catalog as { models?: unknown }).models)
      ? (catalog as { models: RawModel[] }).models
      : [];
  return models
    .filter((m) => m && m.visibility === 'list' && typeof m.slug === 'string')
    .map((m) => ({
      id: String(m.slug),
      label:
        typeof m.display_name === 'string' ? m.display_name : String(m.slug),
    }));
};

export const listCodexModels = async (
  options: { command?: string } = {},
): Promise<AgentModelInfo[]> => {
  const command = options.command ?? process.env.CODEX_CLI_PATH ?? 'codex';
  const child = spawnCli(command, ['debug', 'models']);
  const out = await readStream(child.stdout, () => undefined);
  await new Promise<void>((resolve) => child.once('close', () => resolve()));
  try {
    return parseCodexModels(JSON.parse(out));
  } catch {
    return [];
  }
};
```

- [ ] **Step 6: 写 `parseCodexModels` 的失败测试 `src/tests/models.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { parseCodexModels } from '../models';

describe('parseCodexModels', () => {
  it('maps listable models to id/label and filters visibility', () => {
    const catalog = {
      models: [
        {
          slug: 'gpt-6-astra',
          display_name: 'GPT-6-Astra',
          visibility: 'list',
        },
        { slug: 'hidden-x', display_name: 'Hidden', visibility: 'hidden' },
      ],
    };
    expect(parseCodexModels(catalog)).toEqual([
      { id: 'gpt-6-astra', label: 'GPT-6-Astra' },
    ]);
  });

  it('falls back to slug when display_name missing', () => {
    expect(
      parseCodexModels({ models: [{ slug: 'x', visibility: 'list' }] }),
    ).toEqual([{ id: 'x', label: 'x' }]);
  });

  it('returns empty for malformed input', () => {
    expect(parseCodexModels(null)).toEqual([]);
    expect(parseCodexModels({})).toEqual([]);
  });
});
```

- [ ] **Step 7: 运行测试确认失败后实现，再确认通过**

Run: `pnpm --filter @dt-ai-design/agent-provider-codex test:run models`
Expected: 先 FAIL（`../models` 不存在）→ Step 5 实现后 PASS。

- [ ] **Step 8: 新增 `src/tools.ts`**

```ts
import type { AgentToolDefinition } from '@dt-ai-design/agent-provider-core';
import { CodexProvider } from './adapters/codex';
import { listCodexModels } from './models';

export const codexTool: AgentToolDefinition = {
  id: 'codex',
  label: 'Codex',
  createProvider: (options) => new CodexProvider(options),
  listModels: (options) => listCodexModels(options),
};
```

- [ ] **Step 9: 更新 `src/index.ts`**

```ts
export { CodexProvider, type CodexProviderOptions } from './adapters/codex';
export { parseCodexJsonlEvent } from './jsonl';
export { parseCodexModels, listCodexModels } from './models';
export { codexTool } from './tools';
export { extractJson } from '@dt-ai-design/agent-provider-core';
export type {
  CodexSandbox,
  CodexConversation,
  CodexActivity,
  CodexExecEvent,
  CodexExecRequest,
  CodexExecResult,
  CodexErrorCode,
} from './types';
export { AgentExecError as CodexExecError } from '@dt-ai-design/agent-provider-core';
```

- [ ] **Step 10: 测试、类型检查、提交**

Run:

```bash
pnpm install
pnpm --filter @dt-ai-design/agent-provider-codex test:run
pnpm --filter @dt-ai-design/agent-provider-codex typecheck
pnpm --filter @dt-ai-design/agent-provider-codex build
```

Expected: PASS / 无错 / 构建成功。

```bash
git add packages/agent-provider-codex pnpm-lock.yaml
git commit -m "refactor(agent-provider-codex): implement AgentProvider and add model listing"
```

---

### Task 3: 新建 `agent-provider-opencode` 包

**Files:**

- Create: `packages/agent-provider-opencode/package.json`
- Create: `packages/agent-provider-opencode/tsconfig.json`
- Create: `packages/agent-provider-opencode/tsdown.config.ts`
- Create: `packages/agent-provider-opencode/src/jsonl.ts`
- Create: `packages/agent-provider-opencode/src/models.ts`
- Create: `packages/agent-provider-opencode/src/adapters/opencode.ts`
- Create: `packages/agent-provider-opencode/src/tools.ts`
- Create: `packages/agent-provider-opencode/src/index.ts`
- Create: `packages/agent-provider-opencode/src/tests/jsonl.test.ts`
- Create: `packages/agent-provider-opencode/src/tests/models.test.ts`
- Modify: `tsconfig.base.json`（新增 paths）

**Interfaces:**

- Consumes: Task 1 core 契约与工具。
- Produces: `OpenCodeProvider implements AgentProvider`；`opencodeTool: AgentToolDefinition`；`parseOpencodeJsonlEvent(line): AgentExecEvent | null`；`parseOpencodeModels(stdout: string): AgentModelInfo[]`。

- [ ] **Step 1: 脚手架**

`package.json`（结构同 Task 1，name 改 `@dt-ai-design/agent-provider-opencode`，description 「接入层：OpenCode CLI 适配器」）：

```json
{
  "name": "@dt-ai-design/agent-provider-opencode",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "接入层：OpenCode CLI 适配器",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.mts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "scripts": {
    "build": "tsdown",
    "dev": "tsdown --watch",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "dependencies": {
    "@dt-ai-design/agent-provider-core": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^22.20.5",
    "tsdown": "^0.23.0",
    "typescript": "^6.0.3",
    "vitest": "^5.0.3"
  }
}
```

`tsconfig.json` / `tsdown.config.ts` 同 Task 1。

- [ ] **Step 2: 写事件解析的失败测试 `src/tests/jsonl.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { parseOpencodeJsonlEvent } from '../jsonl';

describe('parseOpencodeJsonlEvent', () => {
  it('maps step_start', () => {
    const line = JSON.stringify({
      type: 'step_start',
      sessionID: 'ses_1',
      part: { type: 'step-start' },
    });
    expect(parseOpencodeJsonlEvent(line)).toEqual({ type: 'step-started' });
  });

  it('maps text', () => {
    const line = JSON.stringify({
      type: 'text',
      sessionID: 'ses_1',
      part: { type: 'text', text: 'hi' },
    });
    expect(parseOpencodeJsonlEvent(line)).toEqual({
      type: 'message',
      text: 'hi',
    });
  });

  it('maps a shell tool_use to an activity', () => {
    const line = JSON.stringify({
      type: 'tool_use',
      sessionID: 'ses_1',
      part: {
        type: 'tool',
        id: 'call_1',
        tool: 'shell',
        state: {
          status: 'completed',
          input: { command: 'echo hi' },
          output: 'hi\n',
        },
      },
    });
    expect(parseOpencodeJsonlEvent(line)).toEqual({
      type: 'activity',
      activity: {
        id: 'call_1',
        kind: 'bash',
        status: 'completed',
        input: { command: 'echo hi' },
        output: { summary: 'hi\n' },
      },
    });
  });

  it('maps step_finish to turn-completed', () => {
    const line = JSON.stringify({
      type: 'step_finish',
      sessionID: 'ses_1',
      part: { type: 'step-finish', tokens: { input: 1, output: 2 } },
    });
    expect(parseOpencodeJsonlEvent(line)).toEqual({
      type: 'turn-completed',
      usage: { input: 1, output: 2 },
    });
  });

  it('maps error to turn-failed', () => {
    const line = JSON.stringify({
      type: 'error',
      error: { type: 'provider.quota', message: 'no balance' },
    });
    expect(parseOpencodeJsonlEvent(line)).toEqual({
      type: 'turn-failed',
      error: { code: 'provider.quota', message: 'no balance' },
    });
  });

  it('reads sessionID from a raw line', () => {
    const line = JSON.stringify({
      type: 'text',
      sessionID: 'ses_42',
      part: { type: 'text', text: 'x' },
    });
    expect(parseOpencodeSessionId(line)).toBe('ses_42');
  });

  it('ignores non-JSON lines', () => {
    expect(parseOpencodeJsonlEvent('not json')).toBeNull();
  });
});
```

> 需要同时测试 `parseOpencodeSessionId`，故在 `jsonl.ts` 导出它，并在测试顶部 `import { parseOpencodeJsonlEvent, parseOpencodeSessionId } from '../jsonl';`

- [ ] **Step 3: 运行测试确认失败**

Run: `pnpm --filter @dt-ai-design/agent-provider-opencode test:run`
Expected: FAIL（`../jsonl` 不存在）。

- [ ] **Step 4: 实现 `src/jsonl.ts`**

```ts
import {
  summarizeText,
  type AgentExecEvent,
} from '@dt-ai-design/agent-provider-core';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

export const parseOpencodeSessionId = (line: string): string | undefined => {
  try {
    const event = JSON.parse(line) as unknown;
    return isObject(event) ? readString(event.sessionID) : undefined;
  } catch {
    return undefined;
  }
};

const mapToolUse = (part: Record<string, unknown>): AgentExecEvent | null => {
  if (part.tool !== 'shell') return null;
  const state = isObject(part.state) ? part.state : {};
  const input = isObject(state.input) ? state.input : {};
  const command = readString(input.command);
  if (!command) return null;
  const id = readString(part.id) ?? 'shell';
  const status =
    state.status === 'failed'
      ? 'failed'
      : state.status === 'running'
        ? 'running'
        : 'completed';
  const summary = summarizeText(
    state.output,
    status === 'failed' ? 'Command failed.' : 'Command completed.',
  );
  if (status === 'failed') {
    return {
      type: 'activity',
      activity: {
        id,
        kind: 'bash',
        status,
        input: { command },
        output: { summary },
        error: { code: 'OPENCODE_COMMAND_FAILED', message: summary },
      },
    };
  }
  return {
    type: 'activity',
    activity: {
      id,
      kind: 'bash',
      status,
      input: { command },
      output: { summary },
    },
  };
};

/** 解析单行 JSONL（opencode run --format json）；非 JSON 行与未知事件返回 null。 */
export const parseOpencodeJsonlEvent = (
  line: string,
): AgentExecEvent | null => {
  let event: unknown;
  try {
    event = JSON.parse(line);
  } catch {
    return null;
  }
  if (!isObject(event)) return null;
  const part = isObject(event.part) ? event.part : undefined;

  switch (event.type) {
    case 'step_start':
      return { type: 'step-started' };
    case 'text': {
      const text = part ? readString(part.text) : undefined;
      return text ? { type: 'message', text } : null;
    }
    case 'tool_use':
      return part ? mapToolUse(part) : null;
    case 'step_finish': {
      const usageValue =
        part && isObject(part.tokens) ? { ...part.tokens } : undefined;
      return { type: 'turn-completed', usage: usageValue };
    }
    case 'error': {
      const error = isObject(event.error) ? event.error : {};
      return {
        type: 'turn-failed',
        error: {
          code: readString(error.type) ?? 'OPENCODE_TURN_FAILED',
          message: readString(error.message) ?? 'OpenCode execution failed.',
        },
      };
    }
    default:
      return null;
  }
};
```

- [ ] **Step 5: 运行测试确认通过**

Run: `pnpm --filter @dt-ai-design/agent-provider-opencode test:run`
Expected: PASS。

- [ ] **Step 6: 写模型解析的失败测试 `src/tests/models.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { parseOpencodeModels } from '../models';

describe('parseOpencodeModels', () => {
  it('parses provider/model lines', () => {
    const out = 'deepseek/deepseek-flash\nopencode/deepseek-v4.1-flash-free\n';
    expect(parseOpencodeModels(out)).toEqual([
      { id: 'deepseek/deepseek-flash', label: 'deepseek/deepseek-flash' },
      {
        id: 'opencode/deepseek-v4.1-flash-free',
        label: 'opencode/deepseek-v4.1-flash-free',
      },
    ]);
  });

  it('trims blanks and ignores malformed lines', () => {
    expect(parseOpencodeModels('\n  a/b  \nno-slash\n')).toEqual([
      { id: 'a/b', label: 'a/b' },
    ]);
  });
});
```

- [ ] **Step 7: 运行测试确认失败后实现 `src/models.ts`，再确认通过**

```ts
import {
  spawnCli,
  readStream,
  type AgentModelInfo,
} from '@dt-ai-design/agent-provider-core';

export const parseOpencodeModels = (stdout: string): AgentModelInfo[] =>
  stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('/') && !line.includes(' '))
    .map((line) => ({ id: line, label: line }));

export const listOpencodeModels = async (
  options: { command?: string } = {},
): Promise<AgentModelInfo[]> => {
  const command =
    options.command ?? process.env.OPENCODE_CLI_PATH ?? 'opencode';
  const child = spawnCli(command, ['models']);
  const out = await readStream(child.stdout, () => undefined);
  await new Promise<void>((resolve) => child.once('close', () => resolve()));
  return parseOpencodeModels(out);
};
```

Run: `pnpm --filter @dt-ai-design/agent-provider-opencode test:run`
Expected: PASS。

- [ ] **Step 8: 实现 `src/adapters/opencode.ts`**

```ts
import type { ChildProcess } from 'node:child_process';

import {
  AgentExecError,
  extractJson,
  readLines,
  readStream,
  spawnCli,
  terminateTree,
  type AgentExecRequest,
  type AgentExecResult,
} from '@dt-ai-design/agent-provider-core';

import { parseOpencodeJsonlEvent, parseOpencodeSessionId } from '../jsonl';

export interface OpenCodeProviderOptions {
  command?: string;
  env?: Record<string, string>;
}

const MAX_STDERR_LENGTH = 16000;

/**
 * OpenCode CLI 适配器。
 *
 * 通过 `opencode run --format json --standalone` 子进程执行一次对话：
 * - prompt 经 stdin 传入（无 message 参数时 opencode 从 stdin 读取）
 * - stdout JSONL 逐行解析（step_start / text / tool_use / step_finish / error）
 * - 每行的 sessionID 作为 conversationId；resume 时用 `--session <id>`
 * - access 允许写时加 `--auto` 自动批准权限（headless 下避免阻塞）
 * - AbortSignal 触发时树杀进程
 */
export class OpenCodeProvider {
  private readonly command: string;
  private readonly env?: Record<string, string>;

  constructor(options: OpenCodeProviderOptions = {}) {
    this.command =
      options.command ?? process.env.OPENCODE_CLI_PATH ?? 'opencode';
    this.env = options.env;
  }

  async execute(request: AgentExecRequest): Promise<AgentExecResult> {
    if (!request.prompt.trim()) {
      throw new AgentExecError({
        code: 'spawn-failed',
        message: 'Prompt 不能为空。',
      });
    }
    if (request.signal?.aborted) {
      throw new AgentExecError({
        code: 'cancelled',
        message: 'OpenCode 执行已被取消。',
      });
    }

    const conversation = request.conversation ?? ({ type: 'new' } as const);
    const allowWrite = (request.access ?? 'workspace-write') !== 'read-only';

    const args = ['run', '--format', 'json', '--standalone'];
    if (request.model) args.push('--model', request.model);
    if (conversation.type === 'resume') args.push('--session', conversation.id);
    if (allowWrite) args.push('--auto');

    let child: ChildProcess;
    try {
      child = spawnCli(this.command, args, { cwd: request.cwd, env: this.env });
    } catch (error) {
      throw new AgentExecError({
        code: 'spawn-failed',
        message:
          error instanceof Error
            ? `无法启动 opencode（${this.command}）：${error.message}`
            : '无法启动 opencode 进程。',
      });
    }

    child.stdin?.on('error', () => undefined);
    child.stdin?.end(request.prompt);

    const signal = request.signal;
    const terminate = () => terminateTree(child);
    signal?.addEventListener('abort', terminate, { once: true });

    try {
      let conversationId =
        conversation.type === 'resume' ? conversation.id : undefined;
      let finalMessage: string | undefined;
      let usage: Record<string, unknown> | undefined;
      let turnFailure: { code: string; message: string } | undefined;

      const handleLine = (line: string) => {
        const sid = parseOpencodeSessionId(line);
        if (sid) conversationId = sid;
        const event = parseOpencodeJsonlEvent(line);
        if (!event) return;
        if (event.type === 'message') finalMessage = event.text;
        else if (event.type === 'turn-completed') usage = event.usage;
        else if (event.type === 'turn-failed') turnFailure = event.error;
        request.onEvent?.(event);
      };

      let spawnError: Error | undefined;
      const exitPromise = new Promise<{
        code: number | null;
        signal: string | null;
      }>((resolve, reject) => {
        child.once('error', (err) => {
          spawnError = err;
          reject(err);
        });
        child.once('close', (code, sig) => resolve({ code, signal: sig }));
      });

      let stderr = '';
      const stderrDone = readStream(
        child.stderr,
        (text) => {
          stderr += text;
        },
        MAX_STDERR_LENGTH,
      ).catch(() => undefined);
      const stdoutDone = readLines(child.stdout, handleLine).catch(
        () => undefined,
      );

      let exit: { code: number | null; signal: string | null };
      try {
        const results = await Promise.allSettled([
          exitPromise,
          stdoutDone,
          stderrDone,
        ]);
        exit =
          results[0].status === 'fulfilled'
            ? results[0].value
            : { code: null, signal: null };
      } catch {
        exit = { code: null, signal: null };
      }

      if (signal?.aborted) {
        throw new AgentExecError({
          code: 'cancelled',
          message: 'OpenCode 执行已被取消。',
        });
      }
      if (spawnError) {
        throw new AgentExecError({
          code: 'spawn-failed',
          message: `无法启动 opencode（${this.command}）：${spawnError.message}。请确认已安装 opencode CLI 并完成登录，或设置 OPENCODE_CLI_PATH 环境变量。`,
        });
      }
      if (turnFailure) {
        throw new AgentExecError({
          code: 'turn-failed',
          message: turnFailure.message,
        });
      }
      if (exit.code !== 0) {
        throw new AgentExecError({
          code: 'nonzero-exit',
          message:
            stderr.trim() ||
            `opencode 进程异常退出（exit code ${exit.code ?? 'null'}）。`,
          exitCode: exit.code,
          stderr,
        });
      }
      if (!conversationId) {
        throw new AgentExecError({
          code: 'missing-conversation-id',
          message: 'opencode 未输出 sessionID。',
        });
      }
      if (finalMessage === undefined) {
        throw new AgentExecError({
          code: 'missing-message',
          message: 'opencode 未输出最终消息。',
        });
      }

      let json: unknown;
      if (request.responseFormat === 'json') {
        try {
          json = extractJson(finalMessage);
        } catch {
          throw new AgentExecError({
            code: 'invalid-json',
            message: 'opencode 最终输出不是合法 JSON。',
          });
        }
      }

      return { conversationId, text: finalMessage, json, usage };
    } finally {
      signal?.removeEventListener('abort', terminate);
    }
  }
}
```

- [ ] **Step 9: 实现 `src/tools.ts` 与 `src/index.ts`**

`src/tools.ts`：

```ts
import type { AgentToolDefinition } from '@dt-ai-design/agent-provider-core';
import { OpenCodeProvider } from './adapters/opencode';
import { listOpencodeModels } from './models';

export const opencodeTool: AgentToolDefinition = {
  id: 'opencode',
  label: 'OpenCode',
  createProvider: (options) => new OpenCodeProvider(options),
  listModels: (options) => listOpencodeModels(options),
};
```

`src/index.ts`：

```ts
export {
  OpenCodeProvider,
  type OpenCodeProviderOptions,
} from './adapters/opencode';
export { parseOpencodeJsonlEvent, parseOpencodeSessionId } from './jsonl';
export { parseOpencodeModels, listOpencodeModels } from './models';
export { opencodeTool } from './tools';
```

- [ ] **Step 10: 注册 tsconfig paths**

修改 `tsconfig.base.json`，在 core 条目后新增：

```json
      "@dt-ai-design/agent-provider-opencode": [
        "./packages/agent-provider-opencode/src/index.ts"
      ],
```

- [ ] **Step 11: 测试、类型检查、构建、提交**

Run:

```bash
pnpm install
pnpm --filter @dt-ai-design/agent-provider-opencode test:run
pnpm --filter @dt-ai-design/agent-provider-opencode typecheck
pnpm --filter @dt-ai-design/agent-provider-opencode build
```

Expected: PASS / 无错 / 构建成功。

```bash
git add packages/agent-provider-opencode tsconfig.base.json pnpm-lock.yaml
git commit -m "feat(agent-provider-opencode): add opencode CLI provider"
```

---

### Task 4: 重构 `agent-orchestrator` 依赖 `AgentProvider` 接口

**Files:**

- Modify: `packages/agent-orchestrator/src/index.ts`
- Modify: `packages/agent-orchestrator/src/executor/index.ts`
- Modify: `packages/agent-orchestrator/package.json`

**Interfaces:**

- Consumes: `AgentProvider`, `AgentExecError`, `AgentExecEvent`（core）。
- Produces: `Orchestrator` 构造改为 `options.provider: AgentProvider`（必填）；`GenerateInput.conversationId?: string`（替代 `threadId`）；`GenerateResult.conversationId?: string`；`Executor` 构造 `options.provider: AgentProvider`。

- [ ] **Step 1: 更新 `package.json`**

将 `dependencies` 的 `"@dt-ai-design/agent-provider-codex": "workspace:*"` 替换为 `"@dt-ai-design/agent-provider-core": "workspace:*"`。

- [ ] **Step 2: 修改 `src/index.ts`**

- 顶部：`import { AgentExecError, type AgentExecEvent, type AgentProvider } from '@dt-ai-design/agent-provider-core';`
- `OrchestratorOptions.provider` 类型改为 `AgentProvider`（去掉 `?` 可选，必填）：
  ```ts
  export interface OrchestratorOptions {
    provider: AgentProvider;
    validator?: Validator;
    maxRepairAttempts?: number;
  }
  ```
- 构造函数 `this.provider = options.provider;`（去掉 `?? new CodexProvider()`）。
- `GenerateInput`：`threadId?: string` → `conversationId?: string`。
- `GenerateResult`：`threadId?: string` → `conversationId?: string`。
- `run()` 里 `generateDocument` 结果映射改 `conversationId: result.conversationId`。
- `generateDocument`：
  - `let conversationId = input.conversationId;`
  - 调 `this.provider.execute({ ... conversation: conversationId ? { type: 'resume', id: conversationId } : { type: 'new' }, access: 'workspace-write', ... })`
  - `conversationId = result.conversationId;`
  - 返回 `{ document: candidate, conversationId }`。
- `throw new AgentExecError({ code: 'cancelled', message: '生成已取消。' })`。
- `forwardEvent(run, event: AgentExecEvent)`。

- [ ] **Step 3: 修改 `src/executor/index.ts`**

- `import type { AgentProvider } from '@dt-ai-design/agent-provider-core';`
- `ExecutorOptions.provider: AgentProvider`（必填）；`Executor` 构造 `this.provider = options.provider;`。
- 其余不变（`execute` 调用签名与 `responseFormat: 'text'` 不变）。

- [ ] **Step 4: 类型检查**

Run: `pnpm --filter @dt-ai-design/agent-orchestrator typecheck`
Expected: 无错（此时 desktop 尚未改，若跨包报错属正常，因为 desktop 还未更新；仅确保本包自身通过）。

> 若因为 workspace 依赖解析失败，先 `pnpm install`。

- [ ] **Step 5: 提交**

```bash
git add packages/agent-orchestrator pnpm-lock.yaml
git commit -m "refactor(agent-orchestrator): depend on AgentProvider interface"
```

---

### Task 5: 桌面端共享类型、设置、工具注册与可执行解析

**Files:**

- Modify: `apps/desktop/src/shared/ipc-types.ts`
- Modify: `apps/desktop/src/main/settings.ts`
- Create: `apps/desktop/src/main/toolRegistry.ts`
- Create: `apps/desktop/src/main/opencodeExecutable.ts`
- Modify: `apps/desktop/package.json`

**Interfaces:**

- Consumes: `codexTool`（Task 2）、`opencodeTool`（Task 3）、`AgentTool`、`AgentModelInfo`、`AgentToolDefinition`、`AgentProvider`（core）。
- Produces: `AgentTool`/`AgentModelInfo` re-export；`AppSettings.tool`、`AppSettings.model`；`IpcAgentChannel.LIST_MODELS='agent:listModels'`；`DesktopAPI.listModels`；`GenerationStartInput.tool`；`toolRegistry: Record<AgentTool, AgentToolDefinition>`；`resolveOpenCodeCommand(): string`。

- [ ] **Step 1: 扩展 `shared/ipc-types.ts`**

- 顶部加：
  ```ts
  import type {
    AgentTool,
    AgentModelInfo,
  } from '@dt-ai-design/agent-provider-core';
  export type { AgentTool, AgentModelInfo };
  ```
- `AppSettings` 增加字段：
  ```ts
  export interface AppSettings {
    theme: 'dark' | 'light' | 'system';
    recentProjects: string[];
    autoSave: boolean;
    autoSaveInterval: number;
    tool: AgentTool;
    model: string;
  }
  ```
- `GenerationStartInput` 增加 `tool: AgentTool;`（保留 `model?: string;`）。
- 新增：
  ```ts
  export const IpcAgentChannel = {
    LIST_MODELS: 'agent:listModels',
  } as const;
  ```
- `DesktopAPI` 增加：

  ```ts
  listModels: (tool: AgentTool) => Promise<AgentModelInfo[]>;
  ```

- [ ] **Step 2: 更新 `main/settings.ts` 默认值**

```ts
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  recentProjects: [],
  autoSave: true,
  autoSaveInterval: 30000,
  tool: 'codex',
  model: '',
};
```

- [ ] **Step 3: 新增 `main/opencodeExecutable.ts`**

```ts
import { existsSync } from 'node:fs';
import path from 'node:path';

/** 解析 opencode 可执行命令。优先环境变量，其次常见安装位置，兜底 "opencode"。 */
export const resolveOpenCodeCommand = (): string => {
  const environment = process.env as {
    OPENCODE_CLI_PATH?: string;
    DT_OPENCODE_EXECUTABLE?: string;
    LOCALAPPDATA?: string;
  };

  const configured =
    environment.DT_OPENCODE_EXECUTABLE ?? environment.OPENCODE_CLI_PATH;
  if (configured) return configured;

  if (process.platform === 'win32' && environment.LOCALAPPDATA) {
    const candidate = path.join(
      environment.LOCALAPPDATA,
      'Programs',
      'opencode',
      'opencode.exe',
    );
    if (existsSync(candidate)) return candidate;
  }

  return 'opencode';
};
```

- [ ] **Step 4: 新增 `main/toolRegistry.ts`**

```ts
import { codexTool } from '@dt-ai-design/agent-provider-codex';
import { opencodeTool } from '@dt-ai-design/agent-provider-opencode';
import type {
  AgentProvider,
  AgentTool,
  AgentToolDefinition,
} from '@dt-ai-design/agent-provider-core';

import { resolveCodexCommand } from './codexExecutable';
import { resolveOpenCodeCommand } from './opencodeExecutable';

export const toolRegistry: Record<AgentTool, AgentToolDefinition> = {
  codex: codexTool,
  opencode: opencodeTool,
};

/** 各工具的可执行命令解析（供 provider 与 listModels 共用）。 */
export const resolveToolCommand = (tool: AgentTool): string =>
  tool === 'codex' ? resolveCodexCommand() : resolveOpenCodeCommand();

export const createToolProvider = (tool: AgentTool): AgentProvider =>
  toolRegistry[tool].createProvider({ command: resolveToolCommand(tool) });

export type { AgentProvider, AgentTool, AgentToolDefinition };
```

- [ ] **Step 5: 更新 `apps/desktop/package.json` 依赖**

`dependencies` 增加：

```json
    "@dt-ai-design/agent-provider-core": "workspace:*",
    "@dt-ai-design/agent-provider-opencode": "workspace:*",
```

- [ ] **Step 6: 安装并类型检查**

Run:

```bash
pnpm install
pnpm --filter @dt-ai-design/desktop typecheck
```

Expected: 无错（GenerationRuntime 尚未改，如报 provider 相关错误，进入 Task 6 修复）。

- [ ] **Step 7: 提交**

```bash
git add apps/desktop/src/shared/ipc-types.ts apps/desktop/src/main/settings.ts apps/desktop/src/main/toolRegistry.ts apps/desktop/src/main/opencodeExecutable.ts apps/desktop/package.json pnpm-lock.yaml
git commit -m "feat(desktop): add tool registry, settings and agent ipc types"
```

---

### Task 6: 主进程 `GenerationRuntime`、`ipcHandlers`、`preload` 接线

**Files:**

- Modify: `apps/desktop/src/main/generationRuntime.ts`
- Modify: `apps/desktop/src/main/ipcHandlers.ts`
- Modify: `apps/desktop/src/preload.ts`

**Interfaces:**

- Consumes: `toolRegistry`、`createToolProvider`、`resolveToolCommand`、`IpcAgentChannel`、`GenerationStartInput.tool`、`AgentTool`。
- Produces: `GenerationRuntime` 按 `input.tool` 分派；`listModels(tool)` IPC。

- [ ] **Step 1: 重写 `generationRuntime.ts`**

- 删除 `import { CodexProvider }`、`resolveCodexCommand`。
- 新增：
  ```ts
  import type {
    AgentProvider,
    AgentTool,
  } from '@dt-ai-design/agent-provider-core';
  import { createToolProvider } from './toolRegistry';
  import { Orchestrator } from '@dt-ai-design/agent-orchestrator';
  ```
- 字段：
  ```ts
  private readonly orchestrators: Record<AgentTool, Orchestrator>;
  /** `${projectId}::${tool}` → conversationId */
  private readonly conversations = new Map<string, string>();
  ```
- 构造函数：
  ```ts
  const makeOrchestrator = (tool: AgentTool) =>
    new Orchestrator({ provider: createToolProvider(tool) });
  this.orchestrators = {
    codex: makeOrchestrator('codex'),
    opencode: makeOrchestrator('opencode'),
  };
  ```
  > 若 `GenerationRuntimeOptions.command` 需要保留，改为 `commands?: Partial<Record<AgentTool, string>>` 并透传；默认用 `resolveToolCommand`。为最小改动，保留 `command?: string` 但仅用于 codex；推荐改为 `createToolProvider` 内部已用 `resolveToolCommand`。**实现采用**：删除 `command` 选项，统一走 `toolRegistry`。
- `resetThread(projectId)`：删除 `this.conversations` 中所有以 `${projectId}::` 开头的键。
- `execute`：
  ```ts
  const key = `${input.projectId}::${input.tool}`;
  const orchestrator = this.orchestrators[input.tool];
  const result = await orchestrator.generateDocument(
    {
      prompt: input.prompt,
      document: input.document,
      cwd: this.workspaceDir,
      model: input.model,
      signal: abort.signal,
      conversationId: this.conversations.get(key),
    },
    agentRun,
  );
  if (result.conversationId) this.conversations.set(key, result.conversationId);
  ```
- `toGenerationEvent` 中 `CodexActivity` 改为 `AgentActivity`（从 core 导入）。

- [ ] **Step 2: 更新 `ipcHandlers.ts`**

- 顶部 `import { IpcAgentChannel } from '../shared/ipc-types';` 与 `import { toolRegistry, resolveToolCommand } from './toolRegistry';`、`import type { AgentTool } from '@dt-ai-design/agent-provider-core';`。
- 在 AI 生成区块前新增：

  ```ts
  ipcMain.handle(
    IpcAgentChannel.LIST_MODELS,
    async (_event, tool: AgentTool) => {
      const definition = toolRegistry[tool];
      if (!definition) return [];
      try {
        return await definition.listModels({
          command: resolveToolCommand(tool),
        });
      } catch {
        return [];
      }
    },
  );
  ```

- [ ] **Step 3: 更新 `preload.ts`**

- import 增加 `IpcAgentChannel` 与 `type AgentTool`。
- `api` 增加：

  ```ts
  listModels: (tool: AgentTool) =>
    ipcRenderer.invoke(IpcAgentChannel.LIST_MODELS, tool),
  ```

- [ ] **Step 4: 类型检查**

Run: `pnpm --filter @dt-ai-design/desktop typecheck`
Expected: 无错。

- [ ] **Step 5: 提交**

```bash
git add apps/desktop/src/main/generationRuntime.ts apps/desktop/src/main/ipcHandlers.ts apps/desktop/src/preload.ts
git commit -m "feat(desktop): dispatch generation by selected tool"
```

---

### Task 7: 渲染层——工具/模型选择

**Files:**

- Modify: `apps/desktop/src/lib/useGeneration.ts`
- Create: `apps/desktop/src/lib/useAgentModel.ts`
- Modify: `apps/desktop/src/components/editor/LeftPanel.tsx`

**Interfaces:**

- Consumes: `window.desktopAPI.listModels`、`getSettings`/`setSettings`、`AgentTool`、`AgentModelInfo`。
- Produces: `useAgentModel(): { tool; model; models; loading; error; setTool; setModel }`；`GenerationStartOptions.tool`。

- [ ] **Step 1: 更新 `useGeneration.ts`**

- `GenerationStartOptions`：
  ```ts
  export interface GenerationStartOptions {
    tool: AgentTool;
    model?: string;
  }
  ```
- 顶部 `import type { AgentTool } from '@dt-ai-design/agent-provider-core';`
- `start` 中 `startGeneration({ projectId, prompt: text, document: ..., tool: options.tool, model: options.model })`。

- [ ] **Step 2: 新增 `lib/useAgentModel.ts`**

```ts
import { useCallback, useEffect, useState } from 'react';
import type {
  AgentModelInfo,
  AgentTool,
} from '@dt-ai-design/agent-provider-core';

export interface AgentModelController {
  tool: AgentTool;
  model: string;
  models: AgentModelInfo[];
  loading: boolean;
  error: string | null;
  setTool: (tool: AgentTool) => void;
  setModel: (model: string) => void;
}

const TOOLS: AgentTool[] = ['codex', 'opencode'];

export function useAgentModel(): AgentModelController {
  const [tool, setToolState] = useState<AgentTool>('codex');
  const [model, setModelState] = useState('');
  const [models, setModels] = useState<AgentModelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async (nextTool: AgentTool) => {
    setLoading(true);
    setError(null);
    try {
      const list = await window.desktopAPI.listModels(nextTool);
      setModels(list);
      return list;
    } catch (e) {
      setModels([]);
      setError(e instanceof Error ? e.message : '读取模型列表失败。');
      return [] as AgentModelInfo[];
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化：读取持久化选择
  useEffect(() => {
    void (async () => {
      const settings = await window.desktopAPI.getSettings();
      const initialTool: AgentTool = TOOLS.includes(settings.tool)
        ? settings.tool
        : 'codex';
      setToolState(initialTool);
      const list = await loadModels(initialTool);
      const initialModel = list.some((m) => m.id === settings.model)
        ? settings.model
        : (list[0]?.id ?? '');
      setModelState(initialModel);
    })();
  }, [loadModels]);

  const setTool = useCallback(
    (nextTool: AgentTool) => {
      setToolState(nextTool);
      void (async () => {
        const list = await loadModels(nextTool);
        const nextModel = list[0]?.id ?? '';
        setModelState(nextModel);
        await window.desktopAPI.setSettings({
          tool: nextTool,
          model: nextModel,
        });
      })();
    },
    [loadModels],
  );

  const setModel = useCallback((nextModel: string) => {
    setModelState(nextModel);
    void window.desktopAPI.setSettings({ model: nextModel });
  }, []);

  return { tool, model, models, loading, error, setTool, setModel };
}

export const AGENT_TOOLS: Array<{ id: AgentTool; label: string }> = [
  { id: 'codex', label: 'Codex' },
  { id: 'opencode', label: 'OpenCode' },
];
```

> 注：`getSettings` 返回的 `settings.tool` / `settings.model` 类型来自更新后的 `AppSettings`。

- [ ] **Step 3: 修改 `LeftPanel.tsx`**

- 顶部 import 增加：
  ```ts
  import { useAgentModel, AGENT_TOOLS } from '@/lib/useAgentModel';
  import type { AgentTool } from '@dt-ai-design/agent-provider-core';
  ```
- 删除本地 `MODEL_OPTIONS`。
- 新增 `ToolSelector` 组件（结构仿 `ModelSelector`，用 `AGENT_TOOLS`，`onChange: (tool: AgentTool) => void`）。
- 改造 `ModelSelector`：props 改为 `{ models: { id: string; label: string }[]; model: string; loading: boolean; onModelChange: (id: string) => void }`；渲染 `models`（空时显示「默认模型」占位，`loading` 时禁用）。
- `ChatTab`：

  ```ts
  const { tool, model, models, loading, setTool, setModel } = useAgentModel();
  ```

  删除 `const [model, setModel] = useState(MODEL_OPTIONS[0].value);`。
  `handleSend`：`void start(text, { tool, model });`
  底部 JSX：

  ```tsx
  <ToolSelector tool={tool} onToolChange={setTool} />
  <ModelSelector
    models={models}
    model={model}
    loading={loading}
    onModelChange={setModel}
  />
  ```

- [ ] **Step 4: 类型检查与 lint**

Run:

```bash
pnpm --filter @dt-ai-design/desktop typecheck
pnpm lint
```

Expected: 无错。

- [ ] **Step 5: 提交**

```bash
git add apps/desktop/src/lib/useGeneration.ts apps/desktop/src/lib/useAgentModel.ts apps/desktop/src/components/editor/LeftPanel.tsx
git commit -m "feat(desktop): tool + dynamic model selector in chat panel"
```

---

### Task 8: 端到端验证与整体构建

**Files:** 无（验证）

- [ ] **Step 1: 全量类型检查**

Run: `pnpm -r typecheck`
Expected: 所有包无错。

- [ ] **Step 2: 全量单测**

Run: `pnpm --filter @dt-ai-design/agent-provider-core test:run; pnpm --filter @dt-ai-design/agent-provider-codex test:run; pnpm --filter @dt-ai-design/agent-provider-opencode test:run`
Expected: 全 PASS。

- [ ] **Step 3: 构建包**

Run: `pnpm build:packages`
Expected: 各包 `dist/` 生成成功。

- [ ] **Step 4: 手动 E2E**

Run: `pnpm dev`
逐项确认：

- Chat 底部出现「工具」下拉（Codex / OpenCode）+「模型」下拉。
- 选 OpenCode → 模型列表变为 `opencode models` 结果；选 Codex → 变为 codex 目录。
- 切换工具时模型重置为该工具首个，且重启 app 后选择保留。
- 分别用 Codex 和 OpenCode 各生成一次：时间线出现 stage/activity/message，文档落画布且可撤销。
- 切换工具再切回，能续接各自会话（不串话）。
- 未安装某 CLI 时给出友好错误（可临时改 `XXX_CLI_PATH` 指向不存在路径验证）。

- [ ] **Step 5: 提交（如有遗留改动）**

```bash
git add -A -- packages apps/desktop tsconfig.base.json
git commit -m "chore: multi-tool provider integration polish"
```

> 仅在确有改动时提交；确认未误纳入工作区其它无关改动。

---

## Self-Review

**Spec coverage:**

- 双下拉（工具+模型）→ Task 7 Step 3。
- 切工具动态换模型 → Task 7 Step 2/3 + Task 5/6 `listModels` IPC。
- 切工具调用不同 provider → Task 4/5/6（接口 + registry + runtime 分派）。
- 持久化到 AppSettings → Task 5 Step 1/2 + Task 7 Step 2。
- 新增 core 包 → Task 1；codex 迁移 → Task 2；opencode → Task 3。
- 错误处理（CLI 未装、模型列表失败、`--standalone`）→ Task 3 Step 8、Task 6 Step 2、Global Constraints。
- 测试 → Task 1/2/3 的 vitest + Task 8。

**Placeholder scan:** 无 TBD/TODO；所有代码步骤含完整代码。

**Type consistency:**

- `conversationId`（core/orchestrator/runtime）一致；codex 对外别名 `CodexExecResult` = core 类型。
- `AgentExecEvent` 事件名 `step-started/message/activity/turn-completed/turn-failed` 在 core、jsonl、forwardEvent、runtime 一致。
- `AgentToolDefinition.listModels(options?: { command?: string })` 在 core、codex/opencode tools、runtime、ipcHandlers 一致。
- `AppSettings.tool/model` 与 `useAgentModel`、`settings.ts` 一致。

**已知取舍：** codex 的 thread_id 通过原始行解析（`jsonl.ts` 的 `thread.started` 归一化为 `step-started` 不携带 id），已在 Task 2 Step 4 说明；若后续要在事件里暴露 conversationId，可扩展 `step-started` 事件。

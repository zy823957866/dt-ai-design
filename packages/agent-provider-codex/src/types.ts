/** Codex CLI 接入层类型契约。 */

export type CodexSandbox =
  'read-only' | 'workspace-write' | 'danger-full-access';

export type CodexConversation =
  { type: 'new' } | { type: 'resume'; threadId: string };

/** bash 命令执行活动（对应 codex JSONL 的 command_execution item）。 */
export interface CodexActivity {
  id: string;
  kind: 'bash';
  status: 'running' | 'completed' | 'failed';
  input: { command: string };
  output?: { summary: string };
  error?: { code: string; message: string };
}

/** codex exec --json 在 stdout 输出的 JSONL 事件（已归一化）。 */
export type CodexExecEvent =
  | { type: 'thread-started'; threadId: string }
  | { type: 'turn-started' }
  | { type: 'activity'; activity: CodexActivity }
  | { type: 'message'; text: string }
  | { type: 'turn-completed'; usage?: Record<string, unknown> }
  | { type: 'turn-failed'; error: { code: string; message: string } };

export interface CodexExecRequest {
  /** 发给 codex 的完整 prompt（经 stdin 传入，避免 argv 长度与转义问题）。 */
  prompt: string;
  /** 子进程工作目录。 */
  cwd: string;
  sandbox?: CodexSandbox;
  /** 会话延续：resume 时复用上一次的 threadId。 */
  conversation?: CodexConversation;
  model?: string;
  /** 'json' 时从最终消息中提取 JSON 并校验。 */
  responseFormat?: 'text' | 'json';
  signal?: AbortSignal;
  onEvent?: (event: CodexExecEvent) => void;
}

export interface CodexExecResult {
  threadId: string;
  /** 最终 agent_message 原文。 */
  text: string;
  /** responseFormat 为 'json' 时提取出的 JSON 值。 */
  json?: unknown;
  usage?: Record<string, unknown>;
}

export type CodexErrorCode =
  | 'cancelled'
  | 'spawn-failed'
  | 'turn-failed'
  | 'invalid-json'
  | 'missing-message'
  | 'missing-thread-id'
  | 'nonzero-exit';

export class CodexExecError extends Error {
  readonly code: CodexErrorCode;
  readonly exitCode?: number | null;
  readonly stderr?: string;

  constructor({
    code,
    message,
    exitCode,
    stderr,
  }: {
    code: CodexErrorCode;
    message: string;
    exitCode?: number | null;
    stderr?: string;
  }) {
    super(message);
    this.name = 'CodexExecError';
    this.code = code;
    this.exitCode = exitCode;
    this.stderr = stderr;
  }
}

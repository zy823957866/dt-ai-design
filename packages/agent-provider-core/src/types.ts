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

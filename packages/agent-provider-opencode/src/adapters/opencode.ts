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
  type AgentProvider,
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
export class OpenCodeProvider implements AgentProvider {
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

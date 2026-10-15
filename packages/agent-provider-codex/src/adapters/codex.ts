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

import { parseCodexJsonlEvent, parseCodexThreadId } from '../jsonl';

export interface CodexProviderOptions {
  /** codex 可执行命令或路径；默认取 CODEX_CLI_PATH 环境变量或 "codex"。 */
  command?: string;
  /** 附加环境变量。 */
  env?: Record<string, string>;
}

const MAX_STDERR_LENGTH = 16000;

/**
 * Codex CLI 适配器。
 *
 * 通过 `codex exec --json` 子进程执行一次对话：
 * - prompt 经 stdin 传入（规避 argv 长度上限与转义问题）
 * - stdout JSONL 逐行解析为事件（bash 活动 / 最终消息）
 * - conversation.type === 'resume' 时用 `codex exec resume <id>` 延续会话
 * - AbortSignal 触发时终止进程（Windows 下 taskkill /T 树杀）
 */
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
    // resume 子命令不支持 --sandbox 标志，需用 config 覆盖
    if (conversation.type === 'resume') {
      args.push('-c', `sandbox_mode="${sandbox}"`);
    } else {
      args.push('--sandbox', sandbox);
    }
    if (request.model) args.push('--model', request.model);
    if (conversation.type === 'resume') args.push(conversation.id);
    args.push('-'); // prompt 从 stdin 读取

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

    // 早退（如 ENOENT）时 stdin 写入会 EPIPE，忽略由 exit 路径统一报错
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
          message: `无法启动 codex（${this.command}）：${spawnError.message}。请确认已安装 codex CLI（npm i -g @openai/codex）并完成 codex login，或设置 CODEX_CLI_PATH 环境变量。`,
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

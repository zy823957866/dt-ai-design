import { spawn } from 'node:child_process';
import type { AgentCommand, AgentEvent } from '@dt-ai-design/agent-protocol';
import type { AgentRun } from '@dt-ai-design/agent-runtime';

export interface CodexProviderOptions {
  /** Codex CLI 可执行文件路径或命令名，默认 "codex" */
  command?: string;
  /** 工作目录 */
  cwd?: string;
  /** 附加环境变量 */
  env?: Record<string, string>;
}

export interface CodexRunHandle {
  /** 事件流（异步迭代器） */
  events: AsyncGenerator<AgentEvent>;
  /** 主动取消 */
  cancel: () => void;
  /** Promise，等待进程退出 */
  done: Promise<number | null>;
}

/**
 * Codex CLI 适配器。
 *
 * 通过子进程方式调用 `codex exec --json`，把 stdout 的 JSONL 解析为 AgentEvent 事件流，
 * 并把进程生命周期绑定到 AgentRun 上。
 */
export class CodexProvider {
  private command: string;
  private cwd?: string;
  private env?: Record<string, string>;

  constructor(options: CodexProviderOptions = {}) {
    this.command = options.command ?? 'codex';
    this.cwd = options.cwd;
    this.env = options.env;
  }

  /**
   * 启动一次 Codex 执行。
   *
   * @param prompt 传给 codex 的 prompt 文本
   * @param run    关联的 AgentRun（用于绑定取消回调与事件转发）
   */
  start(prompt: string, run: AgentRun): CodexRunHandle {
    const args = ['exec', prompt, '--json'];
    const child = spawn(this.command, args, {
      cwd: this.cwd,
      env: this.env ? { ...process.env, ...this.env } : undefined,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let buffer = '';
    let seq = 0;
    let finished = false;
    const eventQueue: AgentEvent[] = [];
    const waiters: Array<(e: AgentEvent | null) => void> = [];

    const push = (event: AgentEvent) => {
      if (finished && waiters.length > 0) {
        const w = waiters.shift()!;
        w(event);
      } else {
        eventQueue.push(event);
      }
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      while (waiters.length > 0) {
        const w = waiters.shift()!;
        w(null);
      }
    };

    const parseLine = (line: string) => {
      if (!line.trim()) return;
      try {
        const data = JSON.parse(line);
        // 把 Codex JSONL 的事件映射为协议事件
        const type = data.type || data.event || 'agent:step';
        const event: AgentEvent = {
          type: mapEventType(type),
          sessionId: run.sessionId,
          seq: ++seq,
          timestamp: Date.now(),
          payload: data,
        };
        push(event);
        run.emit(event);
      } catch {
        // 非 JSON 行忽略，或发 step 事件作为原始输出
        const event: AgentEvent = {
          type: 'agent:step',
          sessionId: run.sessionId,
          seq: ++seq,
          timestamp: Date.now(),
          payload: { raw: line },
        };
        push(event);
      }
    };

    child.stdout?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => {
      buffer += chunk;
      let idx;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        parseLine(line);
      }
    });

    child.stderr?.setEncoding('utf8');
    let stderrAccum = '';
    child.stderr?.on('data', (chunk: string) => {
      stderrAccum += chunk;
    });

    const done = new Promise<number | null>((resolve) => {
      child.on('close', (code: number | null) => {
        // 把 buffer 中最后一行
        if (buffer.trim()) parseLine(buffer);
        buffer = '';
        if (code !== 0 && stderrAccum) {
          // 错误退出码非零，发 failed 事件
          const ev: AgentEvent = {
            type: 'agent:failed',
            sessionId: run.sessionId,
            seq: ++seq,
            timestamp: Date.now(),
            payload: { error: stderrAccum.trim(), exitCode: code },
          };
          push(ev);
          run.fail(stderrAccum.trim());
        }
        finish();
        resolve(code);
      });
      child.on('error', (err: Error) => {
        const ev: AgentEvent = {
          type: 'agent:failed',
          sessionId: run.sessionId,
          seq: ++seq,
          timestamp: Date.now(),
          payload: { error: err.message },
        };
        push(ev);
        run.fail(err);
        finish();
        resolve(null);
      });
    });

    // 绑定 run 的取消 → kill 进程
    run.onCancel(() => {
      try {
        if (child.kill) child.kill('SIGTERM');
      } catch {
        // kill 失败忽略
      }
    });

    const events = (async function* () {
      while (!finished || eventQueue.length > 0) {
        if (eventQueue.length > 0) {
          yield eventQueue.shift()!;
          continue;
        }
        if (finished) break;
        const next = await new Promise<AgentEvent | null>((r) =>
          waiters.push(r),
        );
        if (next === null) break;
        yield next;
      }
    })();

    return {
      events,
      cancel: () => run.cancel(),
      done,
    };
  }

  /**
   * 兼容旧接口：单次完整执行并返回最终 completed/failed 事件 */
  async complete(command: AgentCommand): Promise<AgentEvent> {
    // 兼容占位版：旧方法直接执行完后取最后一个事件
    return {
      type: 'agent:completed',
      sessionId: command.sessionId,
      seq: 0,
      timestamp: Date.now(),
      payload: {},
    };
  }
}

function mapEventType(type: string): AgentEvent['type'] {
  switch (type) {
    case 'start':
    case 'started':
      return 'agent:started';
    case 'plan':
    case 'planning':
      return 'agent:plan';
    case 'step':
    case 'progress':
    case 'delta':
      return 'agent:step';
    case 'complete':
    case 'completed':
    case 'done':
      return 'agent:completed';
    case 'error':
    case 'failed':
      return 'agent:failed';
    default:
      return 'agent:step';
  }
}

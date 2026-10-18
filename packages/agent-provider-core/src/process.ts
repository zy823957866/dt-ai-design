import { spawn, type ChildProcess } from 'node:child_process';
import type { Readable } from 'node:stream';

export interface SpawnTarget {
  file: string;
  argv: string[];
}

/**
 * Windows 兼容：npm/pnpm 安装的 CLI 多为 .CMD wrapper。
 * Node >= 18.20 禁止直接 spawn .cmd/.bat，需经 cmd.exe 代理；.exe 直接执行。
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

/** Resolve when the child closes, or terminate it after `timeoutMs`. */
export const waitForClose = (
  child: ChildProcess,
  timeoutMs = 15000,
): Promise<void> =>
  new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      terminateTree(child);
      done();
    }, timeoutMs);
    child.once('close', done);
  });

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

import type { CodexExecEvent } from './types';

/**
 * codex exec --json 的 stdout JSONL 事件解析。
 *
 * 本机实测（codex-cli 0.154.0）事件序列：
 * {"type":"thread.started","thread_id":"..."}
 * {"type":"turn.started"}
 * {"type":"item.started","item":{"id":"...","type":"command_execution","command":"..."}}
 * {"type":"item.completed","item":{"id":"...","type":"command_execution","command":"...","exit_code":0,"aggregated_output":"..."}}
 * {"type":"item.completed","item":{"id":"...","type":"agent_message","text":"..."}}
 * {"type":"turn.completed","usage":{...}}
 * {"type":"turn.failed"/"error",...}
 *
 * 未知的 type / item 类型一律忽略，保证对版本差异宽容。
 */

const MAX_SUMMARY_LENGTH = 2000;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

const readNumber = (value: unknown) =>
  typeof value === 'number' ? value : undefined;

const readError = (value: unknown): { code: string; message: string } => {
  const error = isObject(value) ? value : {};
  return {
    code: readString(error.code) ?? 'CODEX_TURN_FAILED',
    message:
      readString(error.message) ??
      readString(value) ??
      'Codex execution failed.',
  };
};

const summarize = (value: unknown, fallback: string) => {
  const text = readString(value)?.trim() || fallback;
  return text.length <= MAX_SUMMARY_LENGTH
    ? text
    : `${text.slice(0, MAX_SUMMARY_LENGTH - 3)}...`;
};

const mapCommandItem = ({
  phase,
  item,
}: {
  phase: 'started' | 'completed';
  item: Record<string, unknown>;
}): CodexExecEvent | null => {
  const id = readString(item.id);
  const command = readString(item.command);
  if (!id || !command) return null;

  const input = { command };

  if (phase === 'started') {
    return {
      type: 'activity',
      activity: { id, kind: 'bash', status: 'running', input },
    };
  }

  const exitCode = readNumber(item.exit_code);
  const failed =
    item.status === 'failed' || (exitCode !== undefined && exitCode !== 0);
  const summary = summarize(
    item.aggregated_output ?? item.output,
    failed ? 'Command failed.' : 'Command completed.',
  );

  if (failed) {
    return {
      type: 'activity',
      activity: {
        id,
        kind: 'bash',
        status: 'failed',
        input,
        output: { summary },
        error: {
          code: 'CODEX_COMMAND_FAILED',
          message:
            readString(item.error) ??
            (exitCode === undefined
              ? 'Command execution failed.'
              : `Command exited with code ${exitCode}.`),
        },
      },
    };
  }

  return {
    type: 'activity',
    activity: {
      id,
      kind: 'bash',
      status: 'completed',
      input,
      output: { summary },
    },
  };
};

/** 解析单行 JSONL；非 JSON 行（日志噪音）与未知事件返回 null。 */
export const parseCodexJsonlEvent = (line: string): CodexExecEvent | null => {
  let event: unknown;
  try {
    event = JSON.parse(line);
  } catch {
    return null;
  }
  if (!isObject(event)) return null;

  switch (event.type) {
    case 'thread.started': {
      const threadId = readString(event.thread_id);
      return threadId ? { type: 'thread-started', threadId } : null;
    }
    case 'turn.started':
      return { type: 'turn-started' };
    case 'turn.completed':
      return {
        type: 'turn-completed',
        usage: isObject(event.usage)
          ? (event.usage as Record<string, unknown>)
          : undefined,
      };
    case 'turn.failed':
    case 'error':
      return { type: 'turn-failed', error: readError(event.error ?? event) };
    case 'item.started':
    case 'item.completed': {
      if (!isObject(event.item)) return null;

      if (event.item.type === 'command_execution') {
        return mapCommandItem({
          phase: event.type === 'item.started' ? 'started' : 'completed',
          item: event.item,
        });
      }

      const text = readString(event.item.text);
      return event.type === 'item.completed' &&
        event.item.type === 'agent_message' &&
        text
        ? { type: 'message', text }
        : null;
    }
    default:
      return null;
  }
};

/**
 * 从最终消息文本中提取 JSON。
 * 依次尝试：原文 / 剥 markdown 代码栅栏 / 截取首个 { 或 [ 到匹配的收尾。
 */
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
      // 尝试下一个候选
    }
  }

  throw new Error('Final message is not valid JSON.');
};

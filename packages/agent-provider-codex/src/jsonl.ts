import {
  summarizeText,
  type AgentExecEvent,
} from '@dt-ai-design/agent-provider-core';

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

const mapCommandItem = ({
  phase,
  item,
}: {
  phase: 'started' | 'completed';
  item: Record<string, unknown>;
}): AgentExecEvent | null => {
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
  const summary = summarizeText(
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
export const parseCodexJsonlEvent = (line: string): AgentExecEvent | null => {
  let event: unknown;
  try {
    event = JSON.parse(line);
  } catch {
    return null;
  }
  if (!isObject(event)) return null;

  switch (event.type) {
    case 'thread.started':
      return { type: 'step-started' };
    case 'turn.started':
      return { type: 'step-started' };
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
 * 从原始 JSONL 行中提取 codex thread_id。
 *
 * AgentExecEvent 不承载 threadId，故 codex 适配层需单独解析 thread.started。
 */
export const parseCodexThreadId = (line: string): string | undefined => {
  try {
    const event = JSON.parse(line) as { type?: string; thread_id?: string };
    return event.type === 'thread.started' &&
      typeof event.thread_id === 'string'
      ? event.thread_id
      : undefined;
  } catch {
    return undefined;
  }
};

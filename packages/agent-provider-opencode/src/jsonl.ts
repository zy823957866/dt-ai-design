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

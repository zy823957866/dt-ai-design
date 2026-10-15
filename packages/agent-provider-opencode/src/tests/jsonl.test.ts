import { describe, expect, it } from 'vitest';
import { parseOpencodeJsonlEvent, parseOpencodeSessionId } from '../jsonl';

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
        output: { summary: 'hi' },
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

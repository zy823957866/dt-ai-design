import { describe, expect, it } from 'vitest';

import type { AgentEvent, AgentEventType } from '@dt-ai-design/agent-protocol';

import { AgentRun } from '../lifecycle';

const collect = (run: AgentRun) => {
  const events: AgentEvent[] = [];
  run.onEvent((event) => events.push(event));
  return events;
};

const types = (events: AgentEvent[]): AgentEventType[] =>
  events.map((event) => event.type);

describe('AgentRun', () => {
  it('starts with an agent:started event and enters planning', () => {
    const run = new AgentRun('s1');
    const events = collect(run);
    run.start();
    expect(types(events)).toEqual(['agent:started', 'agent:step']);
    expect(run.getStage()).toBe('planning');
  });

  it('emits Pencil-style tool call and result events with incrementing seq', () => {
    const run = new AgentRun('s1');
    const events = collect(run);
    run.emitToolCall({ callId: 'c1', tool: 'execute', input: { code: 'x' } });
    run.emitToolResult({
      callId: 'c1',
      tool: 'execute',
      ok: true,
      refs: { Hero: 'layer_1' },
      output: ['ok'],
    });

    expect(types(events)).toEqual(['agent:tool-call', 'agent:tool-result']);
    expect(events[0].seq).toBe(1);
    expect(events[1].seq).toBe(2);
    expect(events[1].payload).toMatchObject({
      callId: 'c1',
      ok: true,
      refs: { Hero: 'layer_1' },
    });
  });

  it('emits document, screenshot and message events', () => {
    const run = new AgentRun('s1');
    const events = collect(run);
    run.emitDocument({ revision: 1, document: { id: 'doc' } });
    run.emitScreenshot({ nodeIds: ['a'], images: ['data'] });
    run.emitMessage('done');
    expect(types(events)).toEqual([
      'agent:document',
      'agent:screenshot',
      'agent:message',
    ]);
  });

  it('advances the document revision monotonically', () => {
    const run = new AgentRun('s1');
    expect(run.nextRevision()).toBe(1);
    expect(run.nextRevision()).toBe(2);
    expect(run.nextRevision()).toBe(3);
  });

  it('supports the editing and verifying stages', () => {
    const run = new AgentRun('s1');
    run.setStage('editing', 'drawing hero');
    expect(run.getStage()).toBe('editing');
    run.setStage('verifying');
    expect(run.getStage()).toBe('verifying');
  });
});

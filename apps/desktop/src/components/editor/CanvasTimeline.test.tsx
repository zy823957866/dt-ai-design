// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CanvasTimeline } from './CanvasTimeline';
import type { CanvasAgentItem } from '@/lib/useCanvasAgent';

const items: CanvasAgentItem[] = [
  { id: 'u1', kind: 'user', text: '做一个登录页' },
  { id: 's1', kind: 'stage', message: 'editing', spin: true },
  {
    id: 't1',
    kind: 'tool',
    callId: 'c1',
    tool: 'execute',
    status: 'ok',
    code: 'hero = Insert(document, {type:"frame", name:"Hero"})',
    output: ['Hero created'],
    refs: { Hero: 'layer_1' },
  },
];

describe('CanvasTimeline', () => {
  it('renders the user request and a tool call block', () => {
    render(
      <CanvasTimeline
        items={items}
        expandedIds={new Set(['t1'])}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('做一个登录页')).toBeTruthy();
    expect(screen.getByTestId('tool-call')).toBeTruthy();
    expect(screen.getByText('Hero created')).toBeTruthy();
    // refs are shown as chips
    expect(screen.getByText('Hero')).toBeTruthy();
  });

  it('shows the failing snippet error with its editId hint', () => {
    const failed: CanvasAgentItem[] = [
      {
        id: 't2',
        kind: 'tool',
        callId: 'c2',
        tool: 'execute',
        status: 'error',
        code: 'broken(',
        error: { message: 'Unexpected token', editId: 'edit_12345678' },
      },
    ];
    render(
      <CanvasTimeline
        items={failed}
        expandedIds={new Set(['t2'])}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText(/Unexpected token/)).toBeTruthy();
    expect(screen.getByText(/edit_12/)).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  createDocument,
  type DesignDocument,
} from '@dt-ai-design/design-schema';

import { EditorProvider } from '@/components/editor/EditorProvider';
import { GenerationContext } from '@/lib/generation';
import type { CanvasAgentController } from '@/lib/useCanvasAgent';

import { CanvasAgentOverlay } from './CanvasAgentOverlay';

const base = (id: string, parentId: string | null, index: number) => ({
  id,
  name: id,
  parentId,
  index,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  blendMode: 'normal' as const,
  layerPosition: 'auto' as const,
});

const makeDoc = (): DesignDocument => {
  const doc = createDocument('T');
  doc.layers.page = {
    ...base('page', null, 0),
    type: 'frame',
    x: 0,
    y: 0,
    width: 1440,
    height: 600,
    children: ['hero'],
    layout: {
      mode: 'none',
      gap: 0,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      justifyContent: 'start',
      alignItems: 'start',
    },
    sizingMode: { width: 'fixed', height: 'fixed' },
    fills: [],
    strokes: [],
    cornerRadius: 0,
    effects: [],
    overflow: 'visible',
    clipContent: false,
  };
  doc.layers.hero = {
    ...base('hero', 'page', 0),
    type: 'frame',
    x: 0,
    y: 0,
    width: 1440,
    height: 600,
    children: [],
    layout: {
      mode: 'none',
      gap: 0,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      justifyContent: 'start',
      alignItems: 'start',
    },
    sizingMode: { width: 'fixed', height: 'fixed' },
    fills: [],
    strokes: [],
    cornerRadius: 0,
    effects: [],
    overflow: 'visible',
    clipContent: false,
  };
  doc.rootLayerIds = ['page'];
  return doc;
};

const controller = (
  overrides: Partial<CanvasAgentController>,
): CanvasAgentController => ({
  items: [],
  agents: [],
  isRunning: false,
  error: null,
  start: vi.fn(),
  cancel: vi.fn(),
  reset: vi.fn(),
  ...overrides,
});

const renderOverlay = (value: CanvasAgentController) =>
  render(
    <EditorProvider initialDocument={makeDoc()}>
      <GenerationContext.Provider value={value}>
        <CanvasAgentOverlay zoom={1} panX={0} panY={0} offset={0} />
      </GenerationContext.Provider>
    </EditorProvider>,
  );

describe('CanvasAgentOverlay', () => {
  it('renders nothing when idle', () => {
    const { container } = renderOverlay(controller({ isRunning: false }));
    expect(container.querySelector('[data-agent-overlay]')).toBeNull();
  });

  it('renders a named agent cursor and a region scan while running', () => {
    const { container } = renderOverlay(
      controller({
        isRunning: true,
        agents: [{ agentId: 'newton', label: 'Hero', regionId: 'hero' }],
        items: [
          {
            id: 't1',
            kind: 'tool',
            callId: 'c1',
            tool: 'execute',
            status: 'running',
            code: 'Insert(document,{})',
            agentId: 'newton',
            regionId: 'hero',
          },
        ],
      }),
    );
    expect(container.querySelector('[data-agent-overlay]')).not.toBeNull();
    expect(screen.getByText('Newton')).toBeTruthy();
  });

  it('renders both scan line and glow border for a region', () => {
    const { container } = renderOverlay(
      controller({
        isRunning: true,
        agents: [{ agentId: 'tesla', label: 'Content', regionId: 'hero' }],
        items: [
          {
            id: 't2',
            kind: 'tool',
            callId: 'c2',
            tool: 'execute',
            status: 'running',
            code: 'x',
            agentId: 'tesla',
            regionId: 'hero',
          },
        ],
      }),
    );
    expect(container.querySelector('.editor-agent-scan-sweep')).not.toBeNull();
    expect(container.querySelector('.editor-agent-scan-border')).not.toBeNull();
  });
});

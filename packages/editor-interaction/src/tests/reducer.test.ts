import { describe, it, expect } from 'vitest';
import { reduceInteraction } from '../reducer';
import { createInitialInteractionState } from '../state/initialState';

describe('reduceInteraction tool handling', () => {
  it('defaults to move tool', () => {
    expect(createInitialInteractionState().activeTool).toBe('move');
  });

  it('switches to move and emits setActiveTool', () => {
    const s = createInitialInteractionState();
    const { state, commands } = reduceInteraction(s, {
      type: 'selectTool',
      tool: 'move',
    });
    expect(state.activeTool).toBe('move');
    expect(commands).toEqual([{ type: 'setActiveTool', tool: 'move' }]);
  });

  it('enters creatingShape for rectangle on empty canvas', () => {
    const s = {
      ...createInitialInteractionState(),
      activeTool: 'rectangle' as const,
    };
    const { state } = reduceInteraction(s, {
      type: 'pointerDown',
      point: { x: 0, y: 0 },
      hit: { layerId: '', type: 'empty' },
      shiftKey: false,
      metaKey: false,
    });
    expect(state.mode).toBe('creatingShape');
  });

  it('escape resets to move tool', () => {
    const s = {
      ...createInitialInteractionState(),
      activeTool: 'rectangle' as const,
      mode: 'creatingShape' as const,
    };
    const { state } = reduceInteraction(s, { type: 'escape' });
    expect(state.activeTool).toBe('move');
  });
});

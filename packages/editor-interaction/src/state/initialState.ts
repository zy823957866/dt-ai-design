import type { InteractionState } from '../types';

export function createInitialInteractionState(): InteractionState {
  return {
    activeTool: 'move',
    mode: 'idle',
    selectedLayerIds: [],
    draft: null,
    isSpacePressed: false,
    creationBounds: null,
    marqueeBounds: null,
    textEditingLayerId: null,
  };
}

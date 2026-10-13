import type { InteractionState } from '../types';

export function createInitialInteractionState(): InteractionState {
  return {
    activeTool: 'select',
    mode: 'idle',
    selectedLayerIds: [],
    draft: null,
    isSpacePressed: false,
    creationBounds: null,
    marqueeBounds: null,
    textEditingLayerId: null,
  };
}

export { createEditorInteraction } from './createEditorInteraction';
export { reduceInteraction } from './reducer';
export { createInitialInteractionState } from './state/initialState';

export type {
  EditorInteraction,
  InteractionState,
  InteractionEvent,
  InteractionCommand,
  InteractionMode,
  InteractionDraft,
  CanvasToolId,
  CanvasPoint,
  ScreenPoint,
  HitResult,
  CreationBounds,
} from './types';

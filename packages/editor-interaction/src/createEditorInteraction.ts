import { createInitialInteractionState } from './state/initialState';
import { reduceInteraction } from './reducer';
import type {
  EditorInteraction,
  InteractionState,
  InteractionEvent,
  InteractionCommand,
} from './types';

type Listener = () => void;

export function createEditorInteraction(
  initialState?: Partial<InteractionState>,
): EditorInteraction {
  let state: InteractionState = {
    ...createInitialInteractionState(),
    ...initialState,
  };

  const listeners = new Set<Listener>();

  function getState(): InteractionState {
    return state;
  }

  function dispatch(event: InteractionEvent): InteractionCommand[] {
    const result = reduceInteraction(state, event);
    const prev = state;
    state = result.state;

    if (prev !== state && listeners.size > 0) {
      for (const listener of listeners) {
        try {
          listener();
        } catch {
          /* ignore */
        }
      }
    }

    return result.commands;
  }

  function subscribe(callback: Listener): () => void {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  }

  return { getState, dispatch, subscribe };
}

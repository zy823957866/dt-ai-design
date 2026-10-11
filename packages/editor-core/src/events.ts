/** 编辑器事件类型映射 */
export interface EditorEventMap {
  change: void;
  selectionChange: string[];
  documentChange: void;
  viewportChange: void;
  toolChange: void;
  rulerToggle: void;
}

type EventListener<T> = (payload: T) => void;

/**
 * 简单的类型化事件发射器
 */
export function createEventEmitter() {
  const listeners = new Map<string, Set<EventListener<unknown>>>();

  function on<K extends keyof EditorEventMap>(
    event: K,
    listener: (payload: EditorEventMap[K]) => void,
  ): () => void {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)!.add(listener as EventListener<unknown>);

    return () => {
      listeners.get(event)?.delete(listener as EventListener<unknown>);
    };
  }

  function emit<K extends keyof EditorEventMap>(
    event: K,
    payload: EditorEventMap[K],
  ): void {
    const set = listeners.get(event);
    if (set) {
      for (const listener of set) {
        listener(payload);
      }
    }
  }

  function off<K extends keyof EditorEventMap>(
    event: K,
    listener: (payload: EditorEventMap[K]) => void,
  ): void {
    listeners.get(event)?.delete(listener as EventListener<unknown>);
  }

  return { on, off, emit };
}

export type EditorEventEmitter = ReturnType<typeof createEventEmitter>;

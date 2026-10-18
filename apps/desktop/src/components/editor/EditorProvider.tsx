import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  createEditorState,
  CommandStack,
  addLayer,
  removeLayer,
  moveLayer,
  resizeLayer,
  setLayerProperty,
  setLayersProperty,
  alignSelection as alignSelectionFn,
  distributeSelection as distributeSelectionFn,
  moveLayerForward as moveLayerForwardFn,
  moveLayerBackward as moveLayerBackwardFn,
  moveLayerToFront as moveLayerToFrontFn,
  moveLayerToBack as moveLayerToBackFn,
  reorderLayer as reorderLayerFn,
  setSelection,
  selectAll,
  deselectAll,
  groupSelection,
  ungroupSelection,
  frameSelection,
  duplicateLayer,
  appendFill,
  updateFill,
  removeFill,
  appendStroke,
  updateStroke,
  removeStroke,
  appendEffect,
  updateEffect,
  removeEffect,
  replaceDocument as replaceDocumentFn,
  zoomIn as zoomInFn,
  zoomOut as zoomOutFn,
  zoomTo as zoomToFn,
  pan as panFn,
  setViewport as setViewportFn,
  createEventEmitter,
  type EditorState,
  type AlignDirection,
  type DistributeDirection,
  type Viewport,
} from '@dt-ai-design/editor-core';

import type {
  LayerTypeString,
  Layer,
  DesignDocument,
} from '@dt-ai-design/design-schema';

import { EditorContext, type EditorApi } from '@/lib/editor';
import { normalizeTextSizes } from '@/lib/textMetrics';
import { documentThumbnailDataUrl } from '@/lib/thumbnail';

interface EditorProviderProps {
  children: ReactNode;

  initialDocument?: DesignDocument;

  projectId?: string;
}

/**


 * 编辑器状态 Provider


 *


 * 使用 ref 存储可变的编辑器状态（命令栈 + API），


 * 同时通过 React state 触发 UI 重新渲染。 */

export function EditorProvider({
  children,
  initialDocument,
  projectId,
}: EditorProviderProps) {
  const stateRef = useRef<EditorState>(
    createEditorState(
      initialDocument
        ? normalizeTextSizes(initialDocument).document
        : undefined,
    ),
  );

  const stackRef = useRef<CommandStack>(new CommandStack(stateRef.current));

  const eventsRef = useRef(createEventEmitter());

  const activeToolRef = useRef<string>('move');

  const showRulersRef = useRef(true);

  const [, setTick] = useState(0);

  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

  // ─── 状态读取 ───

  const getState = useCallback(() => stateRef.current, []);

  const getDocument = useCallback(() => stateRef.current.document, []);

  const getSelection = useCallback(() => stateRef.current.selection, []);

  const getViewport = useCallback(() => stateRef.current.viewport, []);

  // ─── 工具 ───

  const getActiveTool = useCallback(() => activeToolRef.current, []);

  const handleSetActiveTool = useCallback(
    (tool: string) => {
      activeToolRef.current = tool;

      eventsRef.current.emit('toolChange', undefined);

      forceUpdate();
    },
    [forceUpdate],
  );

  const getShowRulers = useCallback(() => showRulersRef.current, []);

  const toggleRulers = useCallback(() => {
    showRulersRef.current = !showRulersRef.current;

    eventsRef.current.emit('rulerToggle', undefined);

    forceUpdate();
  }, [forceUpdate]);

  // ─── 变更通知 ───

  const notifyChange = useCallback(() => {
    eventsRef.current.emit('change', undefined);

    forceUpdate();
  }, [forceUpdate]);

  const notifySelectionChange = useCallback(() => {
    eventsRef.current.emit(
      'selectionChange',
      stateRef.current.selection.layerIds,
    );

    forceUpdate();
  }, [forceUpdate]);

  const notifyViewportChange = useCallback(() => {
    eventsRef.current.emit('viewportChange', undefined);

    forceUpdate();
  }, [forceUpdate]);

  // ─── 图层操作 ───

  const handleAddLayer = useCallback(
    (
      type: LayerTypeString,
      props?: Partial<Layer>,
      parentId?: string | null,
    ) => {
      const cmd = {
        name: 'addLayer',

        execute: (s: EditorState) => {
          const result = addLayer(s, type, props, parentId);

          s.selection = result.selection;

          return result.document;
        },

        undo: (s: EditorState) => {
          const sel = s.selection.layerIds;

          const result = removeLayer(s, sel);

          s.selection = { layerIds: [] };

          return result.document;
        },
      };

      stackRef.current.execute(cmd);

      notifyChange();

      notifySelectionChange();
    },

    [notifyChange, notifySelectionChange],
  );

  const handleRemoveLayer = useCallback(
    (layerIds: string[]) => {
      const prevDoc = stateRef.current.document;

      const prevSel = stateRef.current.selection;

      const cmd = {
        name: 'removeLayer',

        execute: (s: EditorState) => {
          const result = removeLayer(s, layerIds);

          s.selection = result.selection;

          return result.document;
        },

        undo: (s: EditorState) => {
          s.selection = prevSel;

          return prevDoc;
        },
      };

      stackRef.current.execute(cmd);

      notifyChange();

      notifySelectionChange();
    },

    [notifyChange, notifySelectionChange],
  );

  const handleMoveLayer = useCallback(
    (layerId: string, x: number, y: number) => {
      const layer = stateRef.current.document.layers[layerId];

      const prevX = layer?.x ?? 0;

      const prevY = layer?.y ?? 0;

      const cmd = {
        name: 'moveLayer',

        execute: (s: EditorState) => moveLayer(s, layerId, x, y),

        undo: (s: EditorState) => moveLayer(s, layerId, prevX, prevY),
      };

      stackRef.current.execute(cmd);

      notifyChange();
    },

    [notifyChange],
  );

  const handleResizeLayer = useCallback(
    (layerId: string, width: number, height: number) => {
      const layer = stateRef.current.document.layers[layerId];

      const prevW = layer?.width ?? 0;

      const prevH = layer?.height ?? 0;

      const cmd = {
        name: 'resizeLayer',

        execute: (s: EditorState) => resizeLayer(s, layerId, width, height),

        undo: (s: EditorState) => resizeLayer(s, layerId, prevW, prevH),
      };

      stackRef.current.execute(cmd);

      notifyChange();
    },

    [notifyChange],
  );

  const handleSetLayerProperty = useCallback(
    (layerId: string, key: string, value: unknown) => {
      const layer = stateRef.current.document.layers[
        layerId
      ] as unknown as Record<string, unknown>;

      const prevValue = layer?.[key];

      const cmd = {
        name: `setLayerProperty:${key}`,

        execute: (s: EditorState) => setLayerProperty(s, layerId, key, value),

        undo: (s: EditorState) => setLayerProperty(s, layerId, key, prevValue),
      };

      stackRef.current.execute(cmd);

      notifyChange();
    },

    [notifyChange],
  );

  const handleSetLayersProperty = useCallback(
    (layerIds: string[], key: string, value: unknown) => {
      const prevDoc = JSON.parse(JSON.stringify(stateRef.current.document));

      const cmd = {
        name: 'setLayersProperty',

        execute: (s: EditorState) => setLayersProperty(s, layerIds, key, value),

        undo: (s: EditorState) => {
          s.document = prevDoc;
          return s.document;
        },
      };

      stackRef.current.execute(cmd);

      notifyChange();
    },

    [notifyChange],
  );

  const handleAppendStyleItem = useCallback(
    (
      layerId: string,
      field: 'fills' | 'strokes' | 'effects',
      item: unknown,
    ) => {
      const prevDoc = stateRef.current.document;
      const run =
        field === 'fills'
          ? appendFill
          : field === 'strokes'
            ? appendStroke
            : appendEffect;
      const cmd = {
        name: `appendStyleItem:${field}`,
        execute: (s: EditorState) => run(s, layerId, item as never),
        undo: (s: EditorState) => {
          s.document = prevDoc;
          return s.document;
        },
      };
      stackRef.current.execute(cmd);
      notifyChange();
    },
    [notifyChange],
  );

  const handleUpdateStyleItem = useCallback(
    (
      layerId: string,
      field: 'fills' | 'strokes' | 'effects',
      index: number,
      patch: unknown,
    ) => {
      const prevDoc = stateRef.current.document;
      const run =
        field === 'fills'
          ? updateFill
          : field === 'strokes'
            ? updateStroke
            : updateEffect;
      const cmd = {
        name: `updateStyleItem:${field}`,
        execute: (s: EditorState) => run(s, layerId, index, patch as never),
        undo: (s: EditorState) => {
          s.document = prevDoc;
          return s.document;
        },
      };
      stackRef.current.execute(cmd);
      notifyChange();
    },
    [notifyChange],
  );

  const handleRemoveStyleItem = useCallback(
    (
      layerId: string,
      field: 'fills' | 'strokes' | 'effects',
      index: number,
    ) => {
      const prevDoc = stateRef.current.document;
      const run =
        field === 'fills'
          ? removeFill
          : field === 'strokes'
            ? removeStroke
            : removeEffect;
      const cmd = {
        name: `removeStyleItem:${field}`,
        execute: (s: EditorState) => run(s, layerId, index),
        undo: (s: EditorState) => {
          s.document = prevDoc;
          return s.document;
        },
      };
      stackRef.current.execute(cmd);
      notifyChange();
    },
    [notifyChange],
  );

  const handleMoveLayerForward = useCallback(
    (layerId: string) => {
      const cmd = {
        name: 'moveLayerForward',

        execute: (s: EditorState) => moveLayerForwardFn(s, layerId),

        undo: (s: EditorState) => moveLayerBackwardFn(s, layerId),
      };

      stackRef.current.execute(cmd);

      notifyChange();
    },
    [notifyChange],
  );

  const handleMoveLayerBackward = useCallback(
    (layerId: string) => {
      const cmd = {
        name: 'moveLayerBackward',

        execute: (s: EditorState) => moveLayerBackwardFn(s, layerId),

        undo: (s: EditorState) => moveLayerForwardFn(s, layerId),
      };

      stackRef.current.execute(cmd);

      notifyChange();
    },
    [notifyChange],
  );

  const handleMoveLayerToFront = useCallback(
    (layerId: string) => {
      // Clone state before moving for undo
      // Actually, let's use a simpler approach: clone state before for undo

      const prevDoc = JSON.parse(JSON.stringify(stateRef.current.document));

      const cmd = {
        name: 'moveLayerToFront',

        execute: (s: EditorState) => moveLayerToFrontFn(s, layerId),

        undo: (s: EditorState) => {
          s.document = prevDoc;

          return s.document;
        },
      };

      stackRef.current.execute(cmd);

      notifyChange();
    },
    [notifyChange],
  );

  const handleMoveLayerToBack = useCallback(
    (layerId: string) => {
      const prevDoc = JSON.parse(JSON.stringify(stateRef.current.document));

      const cmd = {
        name: 'moveLayerToBack',

        execute: (s: EditorState) => moveLayerToBackFn(s, layerId),

        undo: (s: EditorState) => {
          s.document = prevDoc;

          return s.document;
        },
      };

      stackRef.current.execute(cmd);

      notifyChange();
    },
    [notifyChange],
  );

  const handleReorderLayer = useCallback(
    (layerId: string, targetParentId: string | null, targetIndex: number) => {
      const prevDoc = stateRef.current.document;

      const cmd = {
        name: 'reorderLayer',

        execute: (s: EditorState) =>
          reorderLayerFn(s, layerId, targetParentId, targetIndex),

        undo: (s: EditorState) => {
          s.document = prevDoc;

          return s.document;
        },
      };

      stackRef.current.execute(cmd);

      notifyChange();
    },
    [notifyChange],
  );

  // --- duplicate layer handler ---

  const handleDuplicateLayer = useCallback(
    (layerIds: string[]) => {
      const prevDoc = stateRef.current.document;

      const prevSel = stateRef.current.selection;

      const cmd = {
        name: 'duplicateLayer',

        execute: (s: EditorState) => {
          const result = duplicateLayer(s, layerIds);

          s.selection = result.selection;

          return result.document;
        },

        undo: (s: EditorState) => {
          s.selection = prevSel;

          return prevDoc;
        },
      };

      stackRef.current.execute(cmd);

      notifyChange();

      notifySelectionChange();
    },

    [notifyChange, notifySelectionChange],
  );

  // ─── 选区 ───

  const handleSetSelection = useCallback(
    (layerIds: string[]) => {
      stateRef.current.selection = setSelection(stateRef.current, layerIds);

      notifySelectionChange();
    },

    [notifySelectionChange],
  );

  const handleSelectAll = useCallback(() => {
    stateRef.current.selection = selectAll(stateRef.current);

    notifySelectionChange();
  }, [notifySelectionChange]);

  const handleDeselectAll = useCallback(() => {
    stateRef.current.selection = deselectAll(stateRef.current);

    notifySelectionChange();
  }, [notifySelectionChange]);

  // ─── 组合 / Frame ───

  const handleGroupSelection = useCallback(() => {
    const prevDoc = stateRef.current.document;

    const prevSel = stateRef.current.selection;

    const cmd = {
      name: 'groupSelection',

      execute: (s: EditorState) => {
        const result = groupSelection(s);

        s.selection = result.selection;

        return result.document;
      },

      undo: (s: EditorState) => {
        s.selection = prevSel;

        return prevDoc;
      },
    };

    stackRef.current.execute(cmd);

    notifyChange();

    notifySelectionChange();
  }, [notifyChange, notifySelectionChange]);

  const handleUngroupSelection = useCallback(() => {
    const prevDoc = stateRef.current.document;

    const prevSel = stateRef.current.selection;

    const cmd = {
      name: 'ungroupSelection',

      execute: (s: EditorState) => {
        const result = ungroupSelection(s);

        s.selection = result.selection;

        return result.document;
      },

      undo: (s: EditorState) => {
        s.selection = prevSel;

        return prevDoc;
      },
    };

    stackRef.current.execute(cmd);

    notifyChange();

    notifySelectionChange();
  }, [notifyChange, notifySelectionChange]);

  const handleFrameSelection = useCallback(() => {
    const prevDoc = stateRef.current.document;

    const prevSel = stateRef.current.selection;

    const cmd = {
      name: 'frameSelection',

      execute: (s: EditorState) => {
        const result = frameSelection(s);

        s.selection = result.selection;

        return result.document;
      },

      undo: (s: EditorState) => {
        s.selection = prevSel;

        return prevDoc;
      },
    };

    stackRef.current.execute(cmd);

    notifyChange();

    notifySelectionChange();
  }, [notifyChange, notifySelectionChange]);

  // ─── 视口 ───

  const handleReplaceDocument = useCallback(
    (doc: DesignDocument) => {
      const prev = stateRef.current.document;

      const cmd = replaceDocumentFn(prev, doc);

      stackRef.current.execute(cmd);

      stateRef.current.selection = { layerIds: [] };

      notifyChange();

      notifySelectionChange();
    },
    [notifyChange, notifySelectionChange],
  );

  const handleZoomIn = useCallback(() => {
    stateRef.current.viewport = zoomInFn(stateRef.current);

    notifyViewportChange();
  }, [notifyViewportChange]);

  const handleZoomOut = useCallback(() => {
    stateRef.current.viewport = zoomOutFn(stateRef.current);

    notifyViewportChange();
  }, [notifyViewportChange]);

  const handleZoomTo = useCallback(
    (zoom: number) => {
      stateRef.current.viewport = zoomToFn(stateRef.current, zoom);

      notifyViewportChange();
    },

    [notifyViewportChange],
  );

  const handleAlignSelection = useCallback(
    (direction: AlignDirection) => {
      const prevDoc = JSON.parse(JSON.stringify(stateRef.current.document));

      const cmd = {
        name: 'alignSelection',

        execute: (s: EditorState) => alignSelectionFn(s, direction),

        undo: (s: EditorState) => {
          s.document = prevDoc;
          return s.document;
        },
      };

      stackRef.current.execute(cmd);

      notifyChange();
    },

    [notifyChange],
  );

  const handleDistributeSelection = useCallback(
    (direction: DistributeDirection) => {
      const prevDoc = JSON.parse(JSON.stringify(stateRef.current.document));

      const cmd = {
        name: 'distributeSelection',

        execute: (s: EditorState) => distributeSelectionFn(s, direction),

        undo: (s: EditorState) => {
          s.document = prevDoc;
          return s.document;
        },
      };

      stackRef.current.execute(cmd);

      notifyChange();
    },

    [notifyChange],
  );

  const handlePan = useCallback(
    (dx: number, dy: number) => {
      stateRef.current.viewport = panFn(stateRef.current, dx, dy);

      notifyViewportChange();
    },

    [notifyViewportChange],
  );

  const handleSetViewport = useCallback(
    (viewport: Partial<Viewport>) => {
      stateRef.current.viewport = setViewportFn(stateRef.current, viewport);

      notifyViewportChange();
    },

    [notifyViewportChange],
  );

  // ─── 历史 ───

  const handleUndo = useCallback(() => {
    if (stackRef.current.undo()) {
      notifyChange();

      notifySelectionChange();
    }
  }, [notifyChange, notifySelectionChange]);

  const handleRedo = useCallback(() => {
    if (stackRef.current.redo()) {
      notifyChange();

      notifySelectionChange();
    }
  }, [notifyChange, notifySelectionChange]);

  const handleCanUndo = useCallback(() => stackRef.current.canUndo(), []);

  const handleCanRedo = useCallback(() => stackRef.current.canRedo(), []);

  // ─── 事件订阅 ───

  const handleSubscribe = useCallback(
    (
      event: 'change' | 'selectionChange' | 'viewportChange' | 'toolChange',
      callback: () => void,
    ) => {
      return eventsRef.current.on(event, callback);
    },

    [],
  );

  // ─── 快捷键 ───

  // Auto-save

  useEffect(() => {
    if (!projectId) return;

    let saveTimeout: ReturnType<typeof setTimeout> | null = null;

    const off = eventsRef.current.on('change', () => {
      if (saveTimeout) clearTimeout(saveTimeout);

      saveTimeout = setTimeout(() => {
        const doc = stateRef.current.document;

        window.desktopAPI
          .saveProject(projectId, doc, documentThumbnailDataUrl(doc))
          .catch((err) => {
            console.error('Auto-save failed:', err);
          });
      }, 2000);
    });

    return () => {
      off();

      if (saveTimeout) clearTimeout(saveTimeout);
    };
  }, [projectId]);

  // Keyboard shortcuts

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      const shift = e.shiftKey;

      if (meta && e.key === 'z' && !shift) {
        e.preventDefault();

        handleUndo();
      } else if (meta && shift && e.key === 'z') {
        e.preventDefault();

        handleRedo();
      } else if (meta && e.key === 'a') {
        e.preventDefault();

        handleSelectAll();
      } else if (e.key === 'Escape') {
        handleDeselectAll();

        handleSetActiveTool('move');
      } else if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        !isEditingTarget(e.target as HTMLElement)
      ) {
        e.preventDefault();

        const sel = stateRef.current.selection.layerIds;

        if (sel.length > 0) {
          handleRemoveLayer(sel);
        }
      } else if (meta && e.key === 'r') {
        e.preventDefault();

        toggleRulers();
      } else if (meta && e.key === 'd') {
        e.preventDefault();

        const sel = stateRef.current.selection.layerIds;

        if (sel.length > 0) {
          handleDuplicateLayer(sel);
        }
      } else if (meta && e.key === 'g' && !shift) {
        e.preventDefault();

        handleGroupSelection();
      } else if (meta && shift && e.key === 'g') {
        e.preventDefault();

        handleUngroupSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleSelectAll,
    handleDeselectAll,
    handleRemoveLayer,
    handleDuplicateLayer,
    handleGroupSelection,
    handleUngroupSelection,
  ]);

  const api: EditorApi = {
    getState,

    getDocument,

    getSelection,

    getViewport,

    getActiveTool,

    setActiveTool: handleSetActiveTool,

    addLayer: handleAddLayer,

    removeLayer: handleRemoveLayer,

    moveLayer: handleMoveLayer,

    resizeLayer: handleResizeLayer,

    setLayerProperty: handleSetLayerProperty,

    setLayersProperty: handleSetLayersProperty,

    duplicateLayer: handleDuplicateLayer,

    moveLayerForward: handleMoveLayerForward,

    moveLayerBackward: handleMoveLayerBackward,

    moveLayerToFront: handleMoveLayerToFront,

    moveLayerToBack: handleMoveLayerToBack,

    reorderLayer: handleReorderLayer,

    appendStyleItem: handleAppendStyleItem,

    updateStyleItem: handleUpdateStyleItem,

    removeStyleItem: handleRemoveStyleItem,

    setSelection: handleSetSelection,

    selectAll: handleSelectAll,

    deselectAll: handleDeselectAll,

    groupSelection: handleGroupSelection,

    ungroupSelection: handleUngroupSelection,

    frameSelection: handleFrameSelection,

    alignSelection: handleAlignSelection,

    distributeSelection: handleDistributeSelection,

    replaceDocument: handleReplaceDocument,

    zoomIn: handleZoomIn,

    zoomOut: handleZoomOut,

    zoomTo: handleZoomTo,

    pan: handlePan,

    setViewport: handleSetViewport,

    undo: handleUndo,

    redo: handleRedo,

    canUndo: handleCanUndo,

    canRedo: handleCanRedo,

    subscribe: handleSubscribe,

    getShowRulers,

    toggleRulers,
  };

  return (
    <EditorContext.Provider value={api}>{children}</EditorContext.Provider>
  );
}

function isEditingTarget(el: HTMLElement | null): boolean {
  if (!el) return false;

  const tag = el.tagName;

  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

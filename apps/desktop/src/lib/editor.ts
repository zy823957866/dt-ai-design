import { createContext, useContext } from 'react';
import type {
  EditorState,
  Selection,
  Viewport,
  AlignDirection,
  DistributeDirection,
} from '@dt-ai-design/editor-core';
import type {
  DesignDocument,
  LayerTypeString,
  Layer,
} from '@dt-ai-design/design-schema';

/**
 * 编辑器核心 API
 *
 * 所有修改操作都会自动记录到历史栈，支持 undo/redo。
 */
export interface EditorApi {
  // ─── 状态获取 ───
  getState: () => EditorState;
  getDocument: () => DesignDocument;
  getSelection: () => Selection;
  getViewport: () => Viewport;

  // ─── 工具 ───
  getActiveTool: () => string;
  setActiveTool: (tool: string) => void;

  // ─── 图层操作 ───
  addLayer: (
    type: LayerTypeString,
    props?: Partial<Layer>,
    parentId?: string | null,
  ) => void;
  removeLayer: (layerIds: string[]) => void;
  moveLayer: (layerId: string, x: number, y: number) => void;
  resizeLayer: (layerId: string, width: number, height: number) => void;
  setLayerProperty: (layerId: string, key: string, value: unknown) => void;
  setLayersProperty: (layerIds: string[], key: string, value: unknown) => void;
  duplicateLayer: (layerIds: string[]) => void;
  moveLayerForward: (layerId: string) => void;
  moveLayerBackward: (layerId: string) => void;
  moveLayerToFront: (layerId: string) => void;
  moveLayerToBack: (layerId: string) => void;
  /** 拖拽重排/改层级：把图层移动到目标父级下的指定索引 */
  reorderLayer: (
    layerId: string,
    targetParentId: string | null,
    targetIndex: number,
  ) => void;

  // ─── 样式数组（fills/strokes/effects）───
  appendStyleItem: (
    layerId: string,
    field: 'fills' | 'strokes' | 'effects',
    item: unknown,
  ) => void;
  updateStyleItem: (
    layerId: string,
    field: 'fills' | 'strokes' | 'effects',
    index: number,
    patch: unknown,
  ) => void;
  removeStyleItem: (
    layerId: string,
    field: 'fills' | 'strokes' | 'effects',
    index: number,
  ) => void;

  // ─── 选择 ───
  setSelection: (layerIds: string[]) => void;
  selectAll: () => void;
  deselectAll: () => void;

  // ─── 组合 / Frame 操作 ───
  groupSelection: () => void;
  ungroupSelection: () => void;
  frameSelection: () => void;
  alignSelection: (direction: AlignDirection) => void;
  distributeSelection: (direction: DistributeDirection) => void;

  // ─── 文档 ───
  /** 整体替换文档（AI 生成结果应用，可撤销）。 */
  replaceDocument: (doc: DesignDocument) => void;

  // ─── 视口 ───
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (zoom: number) => void;
  pan: (dx: number, dy: number) => void;
  setViewport: (viewport: Partial<Viewport>) => void;

  // ─── 历史 ───
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // ─── 事件 ───
  subscribe: (
    event: 'change' | 'selectionChange' | 'viewportChange' | 'toolChange',
    callback: () => void,
  ) => () => void;

  // ─── UI 状态 ───
  getShowRulers: () => boolean;
  toggleRulers: () => void;
}

export const EditorContext = createContext<EditorApi | null>(null);

export function useEditor(): EditorApi {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return ctx;
}

import { useSyncExternalStore } from 'react';

/**
 * 获取编辑器快照的 hook。
 *
 * 基于 useSyncExternalStore 订阅编辑器的所有状态变化，
 * 每次 document/selection/viewport/tool 变化都会返回新快照。
 * 适合用在「需要用状态派生渲染」的组件里，避免手动订阅 + forceUpdate。
 *
 * 注意：这个 hook 会在任何变化时重渲染，所以尽量用在容器组件，
 * 深层 UI 组件如果只需要部分状态，可以用 selector 自己 memo 一下。
 */
export function useEditorState() {
  const editor = useEditor();

  return useSyncExternalStore(
    (onStoreChange) => {
      const offChange = editor.subscribe('change', onStoreChange);
      const offSelection = editor.subscribe('selectionChange', onStoreChange);
      const offViewport = editor.subscribe('viewportChange', onStoreChange);
      const offTool = editor.subscribe('toolChange', onStoreChange);
      return () => {
        offChange();
        offSelection();
        offViewport();
        offTool();
      };
    },
    () => editor.getState(),
    () => editor.getState(),
  );
}

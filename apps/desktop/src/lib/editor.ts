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

import type { DesignDocument } from '@dt-ai-design/design-schema';

/** 选区状态 */
export interface Selection {
  /** 选中的图层 ID 列表（按选择顺序） */
  layerIds: string[];
}

/** 视口状态 */
export interface Viewport {
  /** 缩放比例，1 = 100% */
  zoom: number;
  /** 水平平移量（像素） */
  panX: number;
  /** 垂直平移量（像素） */
  panY: number;
}

/** 历史记录状态 */
export interface HistoryState {
  /** 撤销栈：可撤销的文档快照 */
  undoStack: DesignDocument[];
  /** 重做栈：可重做的文档快照 */
  redoStack: DesignDocument[];
  /** 最大历史记录数 */
  maxHistory: number;
}

/** 编辑器完整状态 */
export interface EditorState {
  /** 设计文档 */
  document: DesignDocument;
  /** 选区 */
  selection: Selection;
  /** 视口 */
  viewport: Viewport;
  /** 历史记录 */
  history: HistoryState;
}

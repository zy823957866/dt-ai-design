import type { DesignDocument } from '@dt-ai-design/design-schema';
import { createDocument } from '@dt-ai-design/design-schema';
import type { EditorState } from './types';

/**
 * 创建初始编辑器状态
 */
export function createEditorState(doc?: DesignDocument): EditorState {
  const document = doc ?? createDocument('Untitled');
  return {
    document,
    selection: {
      layerIds: [],
    },
    viewport: {
      zoom: 1,
      panX: 0,
      panY: 0,
    },
    history: {
      undoStack: [],
      redoStack: [],
      maxHistory: 50,
    },
  };
}

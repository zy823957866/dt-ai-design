import type { EditorState, Viewport } from './types';

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 32;

/** 放大（1.25 倍） */
export function zoomIn(state: EditorState): Viewport {
  return zoomTo(state, state.viewport.zoom * 1.25);
}

/** 缩小（0.8 倍） */
export function zoomOut(state: EditorState): Viewport {
  return zoomTo(state, state.viewport.zoom * 0.8);
}

/** 缩放到指定比例 */
export function zoomTo(state: EditorState, zoom: number): Viewport {
  const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
  return {
    ...state.viewport,
    zoom: clamped,
  };
}

/** 平移视口 */
export function pan(state: EditorState, dx: number, dy: number): Viewport {
  return {
    ...state.viewport,
    panX: state.viewport.panX + dx,
    panY: state.viewport.panY + dy,
  };
}

/** 设置视口 */
export function setViewport(
  state: EditorState,
  viewport: Partial<Viewport>,
): Viewport {
  return {
    ...state.viewport,
    ...viewport,
  };
}

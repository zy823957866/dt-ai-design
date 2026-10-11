import type { Layer, LayerBounds } from '@dt-ai-design/design-schema';
import type { EditorState, Selection } from './types';

/** 获取所有选中的图层 */
export function getSelectedLayers(state: EditorState): Layer[] {
  return state.selection.layerIds
    .map((id) => state.document.layers[id])
    .filter(Boolean);
}

/** 获取选中图层的整体包围盒 */
export function getSelectedBounds(state: EditorState): LayerBounds | null {
  const layers = getSelectedLayers(state);
  if (layers.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const layer of layers) {
    minX = Math.min(minX, layer.x);
    minY = Math.min(minY, layer.y);
    maxX = Math.max(maxX, layer.x + layer.width);
    maxY = Math.max(maxY, layer.y + layer.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/** 全选 */
export function selectAll(state: EditorState): Selection {
  return {
    layerIds: Object.keys(state.document.layers),
  };
}

/** 取消选择 */
export function deselectAll(_state: EditorState): Selection {
  void _state;
  return { layerIds: [] };
}

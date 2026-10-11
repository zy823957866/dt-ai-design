import type { DesignDocument, Layer, FrameLayer, GroupLayer } from '../types';

/**
 * 深度优先遍历所有图层
 * @param doc 设计文档
 * @param callback 回调函数，参数为 (layer, parentId)
 */
export function traverseLayers(
  doc: DesignDocument,
  callback: (layer: Layer, parentId: string | null) => void,
): void {
  function walk(ids: string[], parentId: string | null): void {
    for (const id of ids) {
      const layer = doc.layers[id];
      if (!layer) continue;
      callback(layer, parentId);
      if (layer.type === 'frame' || layer.type === 'group') {
        const container = layer as FrameLayer | GroupLayer;
        walk(container.children, id);
      }
    }
  }
  walk(doc.rootLayerIds, null);
}

/**
 * 映射所有图层，返回新的 layers Record
 */
export function mapLayers(
  doc: DesignDocument,
  mapper: (layer: Layer, parentId: string | null) => Layer,
): Record<string, Layer> {
  const result: Record<string, Layer> = {};
  traverseLayers(doc, (layer, parentId) => {
    result[layer.id] = mapper(layer, parentId);
  });
  return result;
}

/**
 * 过滤图层，返回匹配的图层数组（按遍历顺序）
 */
export function filterLayers(
  doc: DesignDocument,
  predicate: (layer: Layer, parentId: string | null) => boolean,
): Layer[] {
  const result: Layer[] = [];
  traverseLayers(doc, (layer, parentId) => {
    if (predicate(layer, parentId)) {
      result.push(layer);
    }
  });
  return result;
}

/**
 * 查找某个图层的父图层 id
 */
export function findParentId(
  doc: DesignDocument,
  layerId: string,
): string | null {
  if (doc.rootLayerIds.includes(layerId)) return null;

  for (const layer of Object.values(doc.layers)) {
    if (layer.type === 'frame' || layer.type === 'group') {
      const container = layer as FrameLayer | GroupLayer;
      if (container.children.includes(layerId)) {
        return layer.id;
      }
    }
  }
  return null;
}

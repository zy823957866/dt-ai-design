import type {
  DesignDocument,
  FrameLayer,
  Layer,
} from '@dt-ai-design/design-schema';

import { isContainer } from './geometry';

export interface PruneEmptyResult {
  document: DesignDocument;
  /** 被移除的图层 id（自底向上）。 */
  removed: string[];
}

const hasItems = (value: unknown): boolean =>
  Array.isArray(value) && value.length > 0;

/** 是否为「无样式填充」：无 fills，或仅一个默认白色实心填充。 */
const isDefaultWhiteFill = (
  fills: FrameLayer['fills'] | undefined,
): boolean => {
  if (!Array.isArray(fills) || fills.length === 0) return true;
  if (fills.length !== 1) return false;
  const fill = fills[0];
  return (
    fill.type === 'solid' &&
    (fill.color ?? '').toLowerCase() === '#ffffff' &&
    (fill.opacity ?? 1) === 1
  );
};

/**
 * 空容器判定：没有任何子节点，且不带描边/效果与「非默认白色」填充的
 * frame，或没有子节点的 group —— 这些在画布上不渲染任何有意义的内容。
 */
const isEmptyContainer = (layer: Layer): boolean => {
  if (layer.type === 'frame') {
    return (
      layer.children.length === 0 &&
      !hasItems(layer.strokes) &&
      !hasItems(layer.effects) &&
      isDefaultWhiteFill(layer.fills)
    );
  }
  if (layer.type === 'group') {
    return layer.children.length === 0 && !hasItems(layer.effects);
  }
  return false;
};

/**
 * 自底向上移除空容器图层。删掉子容器后若其父容器变为空，会被继续清理。
 * 只清理 frame/group 容器，不动形状/文本等有内容的图层。
 */
export const pruneEmptyLayers = (
  document: DesignDocument,
): PruneEmptyResult => {
  const doc = structuredClone(document);
  const removed: string[] = [];

  const cleanList = (ids: string[]): string[] =>
    ids.filter((id) => {
      const layer = doc.layers[id];
      if (!layer) return false;
      if (isContainer(layer)) {
        layer.children = cleanList(layer.children);
      }
      if (isEmptyContainer(layer)) {
        removed.push(id);
        delete doc.layers[id];
        return false;
      }
      return true;
    });

  doc.rootLayerIds = cleanList(doc.rootLayerIds);

  const reindex = (ids: string[]): void => {
    ids.forEach((id, index) => {
      const layer = doc.layers[id];
      if (layer) layer.index = index;
    });
  };
  reindex(doc.rootLayerIds);
  for (const layer of Object.values(doc.layers)) {
    if (isContainer(layer)) reindex(layer.children);
  }

  return { document: doc, removed };
};

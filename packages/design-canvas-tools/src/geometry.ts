import type {
  DesignDocument,
  FrameLayer,
  GroupLayer,
  Layer,
} from '@dt-ai-design/design-schema';

import type { CanvasBounds } from './types';

export const isContainer = (layer: {
  type: string;
}): layer is FrameLayer | GroupLayer =>
  layer.type === 'frame' || layer.type === 'group';

/** 沿父链累加得到节点在文档坐标系的包围盒（未考虑自动布局）。 */
export const computeBounds = (
  doc: DesignDocument,
  id: string,
): CanvasBounds => {
  const target = doc.layers[id];
  let x = 0;
  let y = 0;
  let current: Layer | undefined = target;
  while (current) {
    x += current.x ?? 0;
    y += current.y ?? 0;
    current = current.parentId ? doc.layers[current.parentId] : undefined;
  }
  return {
    x,
    y,
    width: target?.width ?? 0,
    height: target?.height ?? 0,
  };
};

/** 检查节点是否被某个裁剪祖先溢出。 */
export const computeOverflow = (
  doc: DesignDocument,
  id: string,
): 'partially clipped' | 'fully clipped' | undefined => {
  const node = computeBounds(doc, id);
  let current: Layer | undefined = doc.layers[id];
  while (current) {
    const parent: Layer | undefined = current.parentId
      ? doc.layers[current.parentId]
      : undefined;
    if (!parent) break;
    if (isContainer(parent)) {
      const clips =
        parent.type === 'frame' &&
        (parent.clipContent || parent.overflow === 'hidden');
      if (clips) {
        const pb = computeBounds(doc, parent.id);
        const withinX =
          node.x >= pb.x && node.x + node.width <= pb.x + pb.width;
        const withinY =
          node.y >= pb.y && node.y + node.height <= pb.y + pb.height;
        if (!withinX || !withinY) {
          const intersects =
            node.x < pb.x + pb.width &&
            node.x + node.width > pb.x &&
            node.y < pb.y + pb.height &&
            node.y + node.height > pb.y;
          return intersects ? 'partially clipped' : 'fully clipped';
        }
      }
    }
    current = parent;
  }
  return undefined;
};

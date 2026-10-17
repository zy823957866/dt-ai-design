import type { DesignDocument } from '@dt-ai-design/design-schema';

import { isContainer } from './geometry';
import type { SerializedNode } from './types';

/** 把扁平图层序列化为嵌套节点树；depth 为剩余可展开层数。 */
export const serializeNode = (
  doc: DesignDocument,
  id: string,
  depth: number,
): SerializedNode => {
  const layer = doc.layers[id];
  const clone: SerializedNode = { ...layer };
  if (isContainer(layer)) {
    if (depth > 0) {
      clone.children = layer.children.map((child) =>
        serializeNode(doc, child, depth - 1),
      );
    } else {
      delete clone.children;
    }
  }
  return clone;
};

/** 序列化整个文档根。 */
export const serializeDocumentRoot = (
  doc: DesignDocument,
  depth: number,
): SerializedNode => ({
  id: 'document',
  type: 'root',
  children: doc.rootLayerIds.map((id) => serializeNode(doc, id, depth)),
});

import type { DesignDocument } from '../types';
import { generateId } from './id';

/**
 * 创建一个空的设计文档
 */
export function createDocument(name = 'Untitled'): DesignDocument {
  const now = Date.now();
  return {
    id: generateId('doc'),
    name,
    version: '1.0.0',
    layers: {},
    rootLayerIds: [],
    components: {},
    variables: {},
    meta: {
      createdAt: now,
      updatedAt: now,
    },
  };
}

/**
 * 更新文档的 updatedAt 时间戳
 */
export function touchDocument(doc: DesignDocument): DesignDocument {
  return {
    ...doc,
    meta: {
      ...doc.meta,
      updatedAt: Date.now(),
    },
  };
}

import { createLayer, cloneLayer } from '@dt-ai-design/design-schema';
import type {
  FillStyle,
  StrokeStyle,
  EffectStyle,
  DesignDocument,
  Layer,
  FrameLayer,
  GroupLayer,
  RectangleLayer,
} from '@dt-ai-design/design-schema';
import type { EditorState, Selection } from './types';
import type { Command } from './command';

/** 图层类型字符串 */
type LayerTypeString =
  | 'rectangle'
  | 'ellipse'
  | 'text'
  | 'image'
  | 'frame'
  | 'group'
  | 'stickyNote'
  | 'path'
  | 'line'
  | 'componentInstance';

// ─── 工具函数 ────────────────────────────────────────────────

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** 找到图层的父 Frame/Group ID */
function findParentId(doc: DesignDocument, layerId: string): string | null {
  for (const [id, layer] of Object.entries(doc.layers)) {
    if (layer.type === 'frame' || layer.type === 'group') {
      const children = (layer as FrameLayer | GroupLayer).children;
      if (children.includes(layerId)) return id;
    }
  }
  if (doc.rootLayerIds.includes(layerId)) return null;
  return null;
}

/** 从父级移除图层 */
function removeFromParent(doc: DesignDocument, layerId: string): void {
  const parentId = findParentId(doc, layerId);
  if (parentId) {
    const parent = doc.layers[parentId] as FrameLayer | GroupLayer;
    const idx = parent.children.indexOf(layerId);
    if (idx !== -1) parent.children.splice(idx, 1);
  } else {
    const idx = doc.rootLayerIds.indexOf(layerId);
    if (idx !== -1) doc.rootLayerIds.splice(idx, 1);
  }
}

/** 添加图层到父级 */
function addToParent(
  doc: DesignDocument,
  layerId: string,
  parentId: string | null,
  index?: number,
): void {
  if (parentId) {
    const parent = doc.layers[parentId] as FrameLayer | GroupLayer;
    if (index !== undefined) {
      parent.children.splice(index, 0, layerId);
    } else {
      parent.children.push(layerId);
    }
  } else if (index !== undefined) {
    doc.rootLayerIds.splice(index, 0, layerId);
  } else {
    doc.rootLayerIds.push(layerId);
  }
}

/** 递归收集图层 ID（含子图层） */
function collectLayerIds(doc: DesignDocument, layerId: string): string[] {
  const result: string[] = [layerId];
  const layer = doc.layers[layerId];
  if (layer && (layer.type === 'frame' || layer.type === 'group')) {
    for (const childId of (layer as FrameLayer | GroupLayer).children) {
      result.push(...collectLayerIds(doc, childId));
    }
  }
  return result;
}

// ─── 添加图层 ────────────────────────────────────────────────

export function addLayer(
  state: EditorState,
  type: LayerTypeString,
  props?: Partial<Layer>,
  parentId?: string | null,
): { document: DesignDocument; selection: Selection } {
  const doc = deepClone(state.document);
  const layer = createLayer(
    type as 'rectangle',
    props as Partial<RectangleLayer>,
  ) as Layer;

  doc.layers[layer.id] = layer;

  const pId = parentId ?? null;
  addToParent(doc, layer.id, pId);

  layer.parentId = pId;
  layer.index = pId
    ? (doc.layers[pId] as FrameLayer | GroupLayer).children.length - 1
    : doc.rootLayerIds.length - 1;

  return {
    document: doc,
    selection: { layerIds: [layer.id] },
  };
}

// ─── 删除图层 ────────────────────────────────────────────────

export function removeLayer(
  state: EditorState,
  layerIds: string[],
): { document: DesignDocument; selection: Selection } {
  const doc = deepClone(state.document);

  const toRemove = new Set<string>();
  for (const id of layerIds) {
    if (doc.layers[id]) {
      collectLayerIds(doc, id).forEach((lid) => toRemove.add(lid));
    }
  }

  for (const id of toRemove) {
    removeFromParent(doc, id);
  }

  for (const id of toRemove) {
    delete doc.layers[id];
  }

  return {
    document: doc,
    selection: { layerIds: [] },
  };
}

// ─── 移动图层（位置） ────────────────────────────────────────

export function moveLayer(
  state: EditorState,
  layerId: string,
  x: number,
  y: number,
): DesignDocument {
  const doc = deepClone(state.document);
  const layer = doc.layers[layerId];
  if (layer) {
    layer.x = x;
    layer.y = y;
  }
  return doc;
}

// ─── 调整尺寸 ────────────────────────────────────────────────

export function resizeLayer(
  state: EditorState,
  layerId: string,
  width: number,
  height: number,
): DesignDocument {
  const doc = deepClone(state.document);
  const layer = doc.layers[layerId];
  if (layer) {
    layer.width = Math.max(0, width);
    layer.height = Math.max(0, height);
  }
  return doc;
}

// ─── 设置图层属性 ────────────────────────────────────────────

export function setLayerProperty(
  state: EditorState,
  layerId: string,
  key: string,
  value: unknown,
): DesignDocument {
  const doc = deepClone(state.document);
  const layer = doc.layers[layerId] as unknown as Record<string, unknown>;
  if (layer) {
    layer[key] = value;
  }
  return doc;
}

// ─── 批量设置图层属性 ────────────────────────────────────────

export function setLayersProperty(
  state: EditorState,
  layerIds: string[],
  key: string,
  value: unknown,
): DesignDocument {
  const doc = deepClone(state.document);
  for (const id of layerIds) {
    const layer = doc.layers[id] as unknown as Record<string, unknown>;
    if (layer) {
      layer[key] = value;
    }
  }
  return doc;
}

// ─── 调整图层层级 ────────────────────────────────────────────

function getSiblings(doc: DesignDocument, layerId: string): string[] {
  const parentId = findParentId(doc, layerId);
  if (parentId) {
    return (doc.layers[parentId] as FrameLayer | GroupLayer).children;
  }
  return doc.rootLayerIds;
}

function setLayerIndex(
  doc: DesignDocument,
  layerId: string,
  newIndex: number,
): void {
  const siblings = getSiblings(doc, layerId);
  const currentIndex = siblings.indexOf(layerId);
  if (currentIndex === -1) return;

  siblings.splice(currentIndex, 1);

  const clampedIndex = Math.max(0, Math.min(newIndex, siblings.length));
  siblings.splice(clampedIndex, 0, layerId);

  siblings.forEach((id, i) => {
    const layer = doc.layers[id];
    if (layer) layer.index = i;
  });
}

export function moveLayerForward(
  state: EditorState,
  layerId: string,
): DesignDocument {
  const doc = deepClone(state.document);
  const siblings = getSiblings(doc, layerId);
  const currentIndex = siblings.indexOf(layerId);
  if (currentIndex < siblings.length - 1) {
    setLayerIndex(doc, layerId, currentIndex + 1);
  }
  return doc;
}

export function moveLayerBackward(
  state: EditorState,
  layerId: string,
): DesignDocument {
  const doc = deepClone(state.document);
  const siblings = getSiblings(doc, layerId);
  const currentIndex = siblings.indexOf(layerId);
  if (currentIndex > 0) {
    setLayerIndex(doc, layerId, currentIndex - 1);
  }
  return doc;
}

export function moveLayerToFront(
  state: EditorState,
  layerId: string,
): DesignDocument {
  const doc = deepClone(state.document);
  const siblings = getSiblings(doc, layerId);
  setLayerIndex(doc, layerId, siblings.length - 1);
  return doc;
}

export function moveLayerToBack(
  state: EditorState,
  layerId: string,
): DesignDocument {
  const doc = deepClone(state.document);
  setLayerIndex(doc, layerId, 0);
  return doc;
}

// ─── 设置选区 ────────────────────────────────────────────────

export function setSelection(
  _state: EditorState,
  layerIds: string[],
): Selection {
  return { layerIds };
}

// ─── 对齐方向类型 ────────────────────────────────────────────

export type AlignDirection =
  'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom';

// ─── 对齐选中图层 ────────────────────────────────────────────

export function alignSelection(
  state: EditorState,
  direction: AlignDirection,
): DesignDocument {
  const doc = deepClone(state.document);
  const ids = state.selection.layerIds.filter((id) => doc.layers[id]);
  if (ids.length < 2) return doc;

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const id of ids) {
    const layer = doc.layers[id];
    minX = Math.min(minX, layer.x);
    minY = Math.min(minY, layer.y);
    maxX = Math.max(maxX, layer.x + layer.width);
    maxY = Math.max(maxY, layer.y + layer.height);
  }

  for (const id of ids) {
    const layer = doc.layers[id];
    switch (direction) {
      case 'left':
        layer.x = minX;
        break;
      case 'centerH':
        layer.x = minX + (maxX - minX - layer.width) / 2;
        break;
      case 'right':
        layer.x = maxX - layer.width;
        break;
      case 'top':
        layer.y = minY;
        break;
      case 'centerV':
        layer.y = minY + (maxY - minY - layer.height) / 2;
        break;
      case 'bottom':
        layer.y = maxY - layer.height;
        break;
    }
  }

  return doc;
}

// ─── 分布方向类型 ────────────────────────────────────────────

export type DistributeDirection = 'horizontal' | 'vertical';

// ─── 分布选中图层 ────────────────────────────────────────────

export function distributeSelection(
  state: EditorState,
  direction: DistributeDirection,
): DesignDocument {
  const doc = deepClone(state.document);
  const ids = state.selection.layerIds.filter((id) => doc.layers[id]);
  if (ids.length < 3) return doc;

  if (direction === 'horizontal') {
    const sorted = [...ids].sort((a, b) => doc.layers[a].x - doc.layers[b].x);
    const first = doc.layers[sorted[0]];
    const last = doc.layers[sorted[sorted.length - 1]];
    const totalSpace = last.x - first.x;
    const totalWidth =
      sorted.reduce((sum, id) => sum + doc.layers[id].width, 0) -
      first.width -
      last.width;
    const gap = (totalSpace - totalWidth) / (sorted.length - 1);

    let cursor = first.x + first.width + gap;
    for (let i = 1; i < sorted.length - 1; i++) {
      const layer = doc.layers[sorted[i]];
      layer.x = cursor;
      cursor += layer.width + gap;
    }
  } else {
    const sorted = [...ids].sort((a, b) => doc.layers[a].y - doc.layers[b].y);
    const first = doc.layers[sorted[0]];
    const last = doc.layers[sorted[sorted.length - 1]];
    const totalSpace = last.y - first.y;
    const totalHeight =
      sorted.reduce((sum, id) => sum + doc.layers[id].height, 0) -
      first.height -
      last.height;
    const gap = (totalSpace - totalHeight) / (sorted.length - 1);

    let cursor = first.y + first.height + gap;
    for (let i = 1; i < sorted.length - 1; i++) {
      const layer = doc.layers[sorted[i]];
      layer.y = cursor;
      cursor += layer.height + gap;
    }
  }

  return doc;
}

// ─── 组合（Group） ───────────────────────────────────────────

export function groupSelection(state: EditorState): {
  document: DesignDocument;
  selection: Selection;
} {
  const selected = state.selection.layerIds.filter(
    (id) => state.document.layers[id],
  );
  if (selected.length < 2) {
    return { document: state.document, selection: state.selection };
  }

  const doc = deepClone(state.document);

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const id of selected) {
    const layer = doc.layers[id];
    minX = Math.min(minX, layer.x);
    minY = Math.min(minY, layer.y);
    maxX = Math.max(maxX, layer.x + layer.width);
    maxY = Math.max(maxY, layer.y + layer.height);
  }

  const group = createLayer('group', {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }) as GroupLayer;

  const firstId = selected[0];
  const parentId = findParentId(state.document, firstId);
  const insertIndex = state.document.layers[firstId].index;

  const sortedIds = [...selected].sort(
    (a, b) => state.document.layers[a].index - state.document.layers[b].index,
  );

  for (const id of sortedIds) {
    removeFromParent(doc, id);
    group.children.push(id);
    doc.layers[id].parentId = group.id;
  }

  group.children.forEach((id, i) => {
    doc.layers[id].index = i;
  });

  doc.layers[group.id] = group;
  addToParent(doc, group.id, parentId, insertIndex);
  group.parentId = parentId;
  group.index = insertIndex;

  const parentChildren = parentId
    ? (doc.layers[parentId] as FrameLayer | GroupLayer).children
    : doc.rootLayerIds;
  parentChildren.forEach((id, i) => {
    doc.layers[id].index = i;
  });

  return {
    document: doc,
    selection: { layerIds: [group.id] },
  };
}

// ─── 解组（Ungroup） ─────────────────────────────────────────

export function ungroupSelection(state: EditorState): {
  document: DesignDocument;
  selection: Selection;
} {
  const groupIds = state.selection.layerIds.filter(
    (id) =>
      state.document.layers[id]?.type === 'group' ||
      state.document.layers[id]?.type === 'frame',
  );
  if (groupIds.length === 0) {
    return { document: state.document, selection: state.selection };
  }

  const doc = deepClone(state.document);
  const newSelection: string[] = [];

  for (const groupId of groupIds) {
    const group = doc.layers[groupId] as GroupLayer | FrameLayer;
    if (!group) continue;

    const parentId = group.parentId;
    const insertIndex = group.index;
    const children = [...group.children];

    for (let i = children.length - 1; i >= 0; i--) {
      const childId = children[i];
      const idx = group.children.indexOf(childId);
      if (idx !== -1) group.children.splice(idx, 1);
      addToParent(doc, childId, parentId, insertIndex);
      doc.layers[childId].parentId = parentId;
      newSelection.push(childId);
    }

    removeFromParent(doc, groupId);
    delete doc.layers[groupId];
  }

  function reindex(children: string[]) {
    children.forEach((id, i) => {
      const layer = doc.layers[id];
      if (layer) layer.index = i;
      if (layer.type === 'frame' || layer.type === 'group') {
        reindex((layer as FrameLayer | GroupLayer).children);
      }
    });
  }
  reindex(doc.rootLayerIds);

  return {
    document: doc,
    selection: { layerIds: newSelection },
  };
}

// ─── 用 Frame 包裹选区 ───────────────────────────────────────

export function frameSelection(state: EditorState): {
  document: DesignDocument;
  selection: Selection;
} {
  const selected = state.selection.layerIds.filter(
    (id) => state.document.layers[id],
  );
  if (selected.length === 0) {
    const frame = createLayer('frame') as FrameLayer;
    const doc = deepClone(state.document);
    doc.layers[frame.id] = frame;
    doc.rootLayerIds.push(frame.id);
    frame.parentId = null;
    frame.index = doc.rootLayerIds.length - 1;
    return {
      document: doc,
      selection: { layerIds: [frame.id] },
    };
  }

  const doc = deepClone(state.document);

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const id of selected) {
    const layer = doc.layers[id];
    minX = Math.min(minX, layer.x);
    minY = Math.min(minY, layer.y);
    maxX = Math.max(maxX, layer.x + layer.width);
    maxY = Math.max(maxY, layer.y + layer.height);
  }

  const frame = createLayer('frame', {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }) as FrameLayer;

  const firstId = selected[0];
  const parentId = findParentId(state.document, firstId);
  const insertIndex = state.document.layers[firstId].index;

  const sortedIds = [...selected].sort(
    (a, b) => state.document.layers[a].index - state.document.layers[b].index,
  );

  for (const id of sortedIds) {
    removeFromParent(doc, id);
    frame.children.push(id);
    doc.layers[id].parentId = frame.id;
  }

  frame.children.forEach((id, i) => {
    doc.layers[id].index = i;
  });

  doc.layers[frame.id] = frame;
  addToParent(doc, frame.id, parentId, insertIndex);
  frame.parentId = parentId;
  frame.index = insertIndex;

  const parentChildren = parentId
    ? (doc.layers[parentId] as FrameLayer | GroupLayer).children
    : doc.rootLayerIds;
  parentChildren.forEach((id, i) => {
    doc.layers[id].index = i;
  });

  return {
    document: doc,
    selection: { layerIds: [frame.id] },
  };
}

// ─── 复制图层 ────────────────────────────────────────────────

export function duplicateLayer(
  state: EditorState,
  layerIds: string[],
): { document: DesignDocument; selection: Selection } {
  const doc = deepClone(state.document);
  const newIds: string[] = [];

  const sorted = [...layerIds].sort(
    (a, b) =>
      (state.document.layers[a]?.index ?? 0) -
      (state.document.layers[b]?.index ?? 0),
  );

  for (const id of sorted) {
    const original = state.document.layers[id];
    if (!original) continue;

    const cloned = cloneLayer(original);
    cloned.x = original.x + 20;
    cloned.y = original.y + 20;

    const parentId = original.parentId;
    doc.layers[cloned.id] = cloned;
    cloned.parentId = parentId;
    cloned.index = original.index + 1 + newIds.length;

    addToParent(doc, cloned.id, parentId, cloned.index);
    newIds.push(cloned.id);

    if (original.type === 'frame' || original.type === 'group') {
      const originalChildren = (original as FrameLayer | GroupLayer).children;
      const clonedChildren: string[] = [];
      const clonedContainer = cloned as FrameLayer | GroupLayer;
      clonedContainer.children = [];

      for (const childId of originalChildren) {
        const child = state.document.layers[childId];
        if (!child) continue;
        const clonedChild = cloneLayer(child);
        clonedChild.parentId = cloned.id;
        clonedChild.index = clonedChildren.length;
        doc.layers[clonedChild.id] = clonedChild;
        clonedContainer.children.push(clonedChild.id);
        clonedChildren.push(clonedChild.id);
      }
    }
  }

  const parentId = state.document.layers[sorted[0]]?.parentId ?? null;
  const siblingIds = parentId
    ? (doc.layers[parentId] as FrameLayer | GroupLayer).children
    : doc.rootLayerIds;
  siblingIds.forEach((id, i) => {
    const layer = doc.layers[id];
    if (layer) layer.index = i;
  });

  return {
    document: doc,
    selection: { layerIds: newIds },
  };
}

// ─── 整体替换文档（AI 生成结果应用） ─────────────────────────

/**
 * 用新文档整体替换当前文档（可撤销，Cmd+Z 可回滚 AI 改动）。
 *
 * @param prev 替换前的文档（用于 undo）
 * @param next 替换后的文档
 */
export function replaceDocument(
  prev: DesignDocument,
  next: DesignDocument,
): Command {
  return {
    name: 'replaceDocument',
    execute: () => next,
    undo: () => prev,
  };
}

// ─── Fill / Stroke / Effect 数组操作 ───

type StyleArrayKey = 'fills' | 'strokes' | 'effects';

function getStyleArray(layer: Layer, key: StyleArrayKey): unknown[] {
  const arr = (layer as unknown as Record<string, unknown>)[key];
  return Array.isArray(arr) ? arr : [];
}

function setStyleArray(
  state: EditorState,
  layerId: string,
  key: StyleArrayKey,
  value: unknown[],
): DesignDocument {
  const doc = deepClone(state.document);
  const layer = doc.layers[layerId];
  if (!layer) return state.document;
  (layer as unknown as Record<string, unknown>)[key] = value;
  return doc;
}

/** 追加一个 fill */
export function appendFill(
  state: EditorState,
  layerId: string,
  fill: FillStyle,
): DesignDocument {
  const layer = state.document.layers[layerId];
  if (!layer) return state.document;
  const fills = [...(getStyleArray(layer, 'fills') as FillStyle[]), fill];
  return setStyleArray(state, layerId, 'fills', fills);
}

/** 更新指定索引的 fill */
export function updateFill(
  state: EditorState,
  layerId: string,
  index: number,
  patch: Partial<FillStyle>,
): DesignDocument {
  const layer = state.document.layers[layerId];
  if (!layer) return state.document;
  const fills = getStyleArray(layer, 'fills') as FillStyle[];
  if (index < 0 || index >= fills.length) return state.document;
  const next = [...fills];
  next[index] = { ...next[index], ...patch };
  return setStyleArray(state, layerId, 'fills', next);
}

/** 删除指定索引的 fill */
export function removeFill(
  state: EditorState,
  layerId: string,
  index: number,
): DesignDocument {
  const layer = state.document.layers[layerId];
  if (!layer) return state.document;
  const fills = getStyleArray(layer, 'fills') as FillStyle[];
  if (index < 0 || index >= fills.length) return state.document;
  const next = fills.filter((_, i) => i !== index);
  return setStyleArray(state, layerId, 'fills', next);
}

/** 追加一个 stroke */
export function appendStroke(
  state: EditorState,
  layerId: string,
  stroke: StrokeStyle,
): DesignDocument {
  const layer = state.document.layers[layerId];
  if (!layer) return state.document;
  const strokes = [
    ...(getStyleArray(layer, 'strokes') as StrokeStyle[]),
    stroke,
  ];
  return setStyleArray(state, layerId, 'strokes', strokes);
}

/** 更新指定索引的 stroke */
export function updateStroke(
  state: EditorState,
  layerId: string,
  index: number,
  patch: Partial<StrokeStyle>,
): DesignDocument {
  const layer = state.document.layers[layerId];
  if (!layer) return state.document;
  const strokes = getStyleArray(layer, 'strokes') as StrokeStyle[];
  if (index < 0 || index >= strokes.length) return state.document;
  const next = [...strokes];
  next[index] = { ...next[index], ...patch };
  return setStyleArray(state, layerId, 'strokes', next);
}

/** 删除指定索引的 stroke */
export function removeStroke(
  state: EditorState,
  layerId: string,
  index: number,
): DesignDocument {
  const layer = state.document.layers[layerId];
  if (!layer) return state.document;
  const strokes = getStyleArray(layer, 'strokes') as StrokeStyle[];
  if (index < 0 || index >= strokes.length) return state.document;
  const next = strokes.filter((_, i) => i !== index);
  return setStyleArray(state, layerId, 'strokes', next);
}

/** 追加一个 effect */
export function appendEffect(
  state: EditorState,
  layerId: string,
  effect: EffectStyle,
): DesignDocument {
  const layer = state.document.layers[layerId];
  if (!layer) return state.document;
  const effects = [
    ...(getStyleArray(layer, 'effects') as EffectStyle[]),
    effect,
  ];
  return setStyleArray(state, layerId, 'effects', effects);
}

/** 更新指定索引的 effect */
export function updateEffect(
  state: EditorState,
  layerId: string,
  index: number,
  patch: Partial<EffectStyle>,
): DesignDocument {
  const layer = state.document.layers[layerId];
  if (!layer) return state.document;
  const effects = getStyleArray(layer, 'effects') as EffectStyle[];
  if (index < 0 || index >= effects.length) return state.document;
  const next = [...effects];
  next[index] = { ...next[index], ...patch };
  return setStyleArray(state, layerId, 'effects', next);
}

/** 删除指定索引的 effect */
export function removeEffect(
  state: EditorState,
  layerId: string,
  index: number,
): DesignDocument {
  const layer = state.document.layers[layerId];
  if (!layer) return state.document;
  const effects = getStyleArray(layer, 'effects') as EffectStyle[];
  if (index < 0 || index >= effects.length) return state.document;
  const next = effects.filter((_, i) => i !== index);
  return setStyleArray(state, layerId, 'effects', next);
}

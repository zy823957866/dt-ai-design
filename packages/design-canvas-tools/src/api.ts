import {
  createLayer,
  generateId,
  type DesignDocument,
  type FrameLayer,
  type GroupLayer,
  type Layer,
  type LayerTypeString,
} from '@dt-ai-design/design-schema';

import { computeBounds, computeOverflow, isContainer } from './geometry';
import { CanvasToolError } from './errors';
import { serializeDocumentRoot, serializeNode } from './serialize';
import type {
  CanvasNodeInput,
  CanvasWarning,
  FindEmptySpaceInput,
  GetContext,
  GetOptions,
  SerializedNode,
} from './types';

export interface CanvasState {
  doc: DesignDocument;
  revision: number;
  placeholders: Set<string>;
  dirty: boolean;
  refs: Record<string, string>;
  output: string[];
  warnings: CanvasWarning[];
  screenshots: string[];
}

const createLayerInternal = createLayer as unknown as (
  type: LayerTypeString,
  props?: Partial<Layer>,
) => Layer;

const mustGet = (state: CanvasState, id: string): Layer => {
  const layer = state.doc.layers[id];
  if (!layer) {
    throw new CanvasToolError('node-not-found', `Node not found: ${id}`);
  }
  return layer;
};

const reindex = (state: CanvasState, ids: string[]): void => {
  ids.forEach((id, index) => {
    const layer = state.doc.layers[id];
    if (layer) layer.index = index;
  });
};

const detach = (state: CanvasState, id: string): void => {
  const layer = state.doc.layers[id];
  if (!layer) return;
  const parentId = layer.parentId;
  if (parentId) {
    const parent = state.doc.layers[parentId];
    if (parent && isContainer(parent)) {
      parent.children = parent.children.filter((child) => child !== id);
      reindex(state, parent.children);
    }
  } else {
    state.doc.rootLayerIds = state.doc.rootLayerIds.filter(
      (child) => child !== id,
    );
    reindex(state, state.doc.rootLayerIds);
  }
  layer.parentId = null;
};

const attachAt = (
  state: CanvasState,
  parentId: string | undefined,
  id: string,
  index?: number,
): void => {
  const layer = mustGet(state, id);
  if (!parentId || parentId === 'document') {
    const list = state.doc.rootLayerIds;
    const at = index ?? list.length;
    list.splice(Math.max(0, Math.min(at, list.length)), 0, id);
    layer.parentId = null;
    reindex(state, list);
    return;
  }
  const parent = mustGet(state, parentId);
  if (!isContainer(parent)) {
    throw new CanvasToolError(
      'not-a-container',
      `Node ${parentId} (${parent.type}) cannot have children.`,
    );
  }
  const container = parent;
  const at = index ?? container.children.length;
  container.children.splice(
    Math.max(0, Math.min(at, container.children.length)),
    0,
    id,
  );
  layer.parentId = parent.id;
  reindex(state, container.children);
};

const removeSubtree = (state: CanvasState, id: string): void => {
  const layer = state.doc.layers[id];
  if (!layer) return;
  if (isContainer(layer)) {
    for (const child of [...layer.children]) removeSubtree(state, child);
  }
  delete state.doc.layers[id];
};

const buildNode = (state: CanvasState, input: CanvasNodeInput): string => {
  if (!input || typeof input !== 'object') {
    throw new CanvasToolError('invalid-node', 'Node data must be an object.');
  }
  const type = input.type;
  if (typeof type !== 'string') {
    throw new CanvasToolError('invalid-node', 'Node data requires a "type".');
  }

  const props: Record<string, unknown> = { ...input };
  const children = props.children;
  const placeholder = props.placeholder;
  delete props.id;
  delete props.children;
  delete props.placeholder;
  let layer: Layer;
  try {
    layer = createLayerInternal(
      type as LayerTypeString,
      props as Partial<Layer>,
    );
  } catch (error) {
    throw new CanvasToolError(
      'invalid-node',
      error instanceof Error ? error.message : 'Unknown layer type.',
    );
  }

  state.doc.layers[layer.id] = layer;
  if (layer.name) state.refs[layer.name] = layer.id;

  if (isContainer(layer)) {
    const container = layer;
    const kids = Array.isArray(children) ? children : [];
    container.children = [];
    kids.forEach((childInput, index) => {
      const childId = buildNode(state, childInput as CanvasNodeInput);
      const child = state.doc.layers[childId];
      child.parentId = layer.id;
      child.index = index;
      container.children.push(childId);
    });
  }

  if (placeholder === true) state.placeholders.add(layer.id);
  return layer.id;
};

const cloneExisting = (
  state: CanvasState,
  id: string,
  idMap: Map<string, string>,
): string => {
  const source = mustGet(state, id);
  const copy = JSON.parse(JSON.stringify(source)) as Layer;
  copy.id = generateId('layer');
  state.doc.layers[copy.id] = copy;
  idMap.set(id, copy.id);
  if (copy.name) state.refs[copy.name] = copy.id;

  if (isContainer(source)) {
    const sourceContainer = source;
    const copyContainer = copy as FrameLayer | GroupLayer;
    copyContainer.children = sourceContainer.children.map((child) =>
      cloneExisting(state, child, idMap),
    );
    for (const child of copyContainer.children) {
      state.doc.layers[child].parentId = copy.id;
    }
  }
  copy.parentId = null;
  return copy.id;
};

const applyDescendants = (
  state: CanvasState,
  idMap: Map<string, string>,
  descendants: Record<string, unknown>,
): void => {
  for (const [key, value] of Object.entries(descendants)) {
    let targetId = idMap.get(key);
    if (!targetId) {
      for (const [newId] of idMap) {
        if (state.doc.layers[newId]?.name === key) {
          targetId = newId;
          break;
        }
      }
    }
    if (!targetId) continue;
    const layer = state.doc.layers[targetId];
    if (!layer || !value || typeof value !== 'object') continue;
    const props: Record<string, unknown> = {
      ...(value as Record<string, unknown>),
    };
    delete props.type;
    delete props.id;
    delete props.children;
    Object.assign(layer, props);
  }
};

const formatValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

export interface CanvasApi {
  document: string;
  Insert(parent: string, node: CanvasNodeInput): string;
  Copy(path: string, parent: string, data?: CanvasNodeInput): string;
  Update(path: string, data: Record<string, unknown>): void;
  Replace(path: string, data: CanvasNodeInput): string;
  Move(path: string, parent?: string, index?: number): void;
  Delete(path: string): void;
  Get(...args: unknown[]): unknown;
  SetVariables(vars: Record<string, unknown>, replace?: boolean): void;
  GetVariables(): {
    variables: Record<string, { type: string; value: unknown }>;
  };
  FindEmptySpace(input: FindEmptySpaceInput): {
    x: number;
    y: number;
    parentId?: string;
  };
  Print(...values: unknown[]): void;
  TakeScreenshot(nodeIds: string[]): void;
}

export const createCanvasApi = (state: CanvasState): CanvasApi => {
  const insert = (parent: string, nodeData: CanvasNodeInput): string => {
    const id = buildNode(state, nodeData);
    attachAt(state, parent, id);
    state.dirty = true;
    return id;
  };

  const update = (path: string, data: Record<string, unknown>): void => {
    const layer = mustGet(state, path);
    const patch: Record<string, unknown> = { ...data };
    const placeholder = patch.placeholder;
    delete patch.id;
    delete patch.type;
    delete patch.children;
    delete patch.placeholder;
    Object.assign(layer, patch);
    if (placeholder === true) state.placeholders.add(layer.id);
    else if (placeholder === false) state.placeholders.delete(layer.id);
    state.dirty = true;
  };

  const remove = (path: string): void => {
    const layer = mustGet(state, path);
    detach(state, layer.id);
    removeSubtree(state, layer.id);
    state.placeholders.delete(layer.id);
    state.dirty = true;
  };

  const move = (path: string, parent?: string, index?: number): void => {
    const layer = mustGet(state, path);
    detach(state, layer.id);
    attachAt(state, parent ?? 'document', layer.id, index);
    state.dirty = true;
  };

  const copy = (
    path: string,
    parent: string,
    data?: CanvasNodeInput,
  ): string => {
    mustGet(state, path);
    const idMap = new Map<string, string>();
    const rootId = cloneExisting(state, path, idMap);
    if (data) {
      const rest: Record<string, unknown> = { ...data };
      const descendants = rest.descendants;
      delete rest.children;
      delete rest.descendants;
      Object.assign(state.doc.layers[rootId], rest);
      if (typeof rest.name === 'string') state.refs[rest.name] = rootId;
      if (descendants && typeof descendants === 'object') {
        applyDescendants(state, idMap, descendants as Record<string, unknown>);
      }
    }
    attachAt(state, parent, rootId);
    state.dirty = true;
    return rootId;
  };

  const replace = (path: string, data: CanvasNodeInput): string => {
    const old = mustGet(state, path);
    const parentId = old.parentId ?? undefined;
    const index = old.index;
    detach(state, old.id);
    removeSubtree(state, old.id);
    const newId = buildNode(state, data);
    attachAt(state, parentId, newId, index);
    state.dirty = true;
    return newId;
  };

  const walk = (
    id: string,
    parentCtx: GetContext | undefined,
    depth: number,
    index: number,
    visit: (node: SerializedNode, ctx: GetContext) => unknown,
    results: unknown[],
  ): void => {
    const serialized = serializeNode(state.doc, id, Number.POSITIVE_INFINITY);
    let skipped = false;
    const ctx: GetContext = {
      node: serialized,
      parentCtx,
      depth,
      index,
      bounds: computeBounds(state.doc, id),
      problems: computeOverflow(state.doc, id),
      skipChildren: () => {
        skipped = true;
      },
    };
    const result = visit(serialized, ctx);
    if (result !== undefined) results.push(result);
    const layer = state.doc.layers[id];
    if (layer && isContainer(layer) && !skipped) {
      layer.children.forEach((child, childIndex) =>
        walk(child, ctx, depth + 1, childIndex, visit, results),
      );
    }
  };

  const get = (...args: unknown[]): unknown => {
    const visit = args.find((arg) => typeof arg === 'function') as
      ((node: SerializedNode, ctx: GetContext) => unknown) | undefined;
    const path = args.find((arg) => typeof arg === 'string') as
      string | undefined;
    const options = (args.find(
      (arg) => arg !== null && typeof arg === 'object',
    ) ?? {}) as GetOptions;

    if (visit) {
      const results: unknown[] = [];
      if (!path || path === 'document') {
        state.doc.rootLayerIds.forEach((id, index) =>
          walk(id, undefined, 0, index, visit, results),
        );
      } else {
        walk(path, undefined, 0, 0, visit, results);
      }
      return results;
    }

    const depth = options.depth ?? Number.POSITIVE_INFINITY;
    if (!path || path === 'document') {
      return serializeDocumentRoot(state.doc, depth);
    }
    mustGet(state, path);
    return serializeNode(state.doc, path, depth);
  };

  const setVariables = (
    vars: Record<string, unknown>,
    replaceAll?: boolean,
  ): void => {
    if (!vars || typeof vars !== 'object') {
      throw new CanvasToolError(
        'invalid-variables',
        'Variables must be an object.',
      );
    }
    if (replaceAll) state.doc.variables = {};
    for (const [name, definition] of Object.entries(vars)) {
      if (!definition || typeof definition !== 'object') {
        throw new CanvasToolError(
          'invalid-variables',
          `Variable "${name}" must be an object with type and value.`,
        );
      }
      const { type, value } = definition as { type?: unknown; value?: unknown };
      if (
        typeof type !== 'string' ||
        !['color', 'number', 'string', 'boolean'].includes(type)
      ) {
        throw new CanvasToolError(
          'invalid-variables',
          `Variable "${name}" must have a valid type.`,
        );
      }
      const existing = state.doc.variables[name];
      state.doc.variables[name] = {
        id: existing?.id ?? generateId('var'),
        name,
        type: type as 'color' | 'number' | 'string' | 'boolean',
        value,
      };
    }
    state.dirty = true;
  };

  const getVariables = () => {
    const variables: Record<string, { type: string; value: unknown }> = {};
    for (const [name, variable] of Object.entries(state.doc.variables)) {
      variables[name] = { type: variable.type, value: variable.value };
    }
    return { variables };
  };

  const findEmptySpace = (input: FindEmptySpaceInput) => {
    const roots = state.doc.rootLayerIds
      .map((id) => state.doc.layers[id])
      .filter((layer): layer is Layer => Boolean(layer));
    if (roots.length === 0) return { x: 0, y: 0, parentId: 'document' };

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const root of roots) {
      minX = Math.min(minX, root.x);
      minY = Math.min(minY, root.y);
      maxX = Math.max(maxX, root.x + root.width);
      maxY = Math.max(maxY, root.y + root.height);
    }

    const padding = input.padding ?? 0;
    const { width, height, direction = 'right' } = input;
    const positions: Record<string, { x: number; y: number }> = {
      left: { x: minX - padding - width, y: minY },
      right: { x: maxX + padding, y: minY },
      top: { x: minX, y: minY - padding - height },
      bottom: { x: minX, y: maxY + padding },
    };
    const position = positions[direction] ?? positions.right;
    return { ...position, parentId: 'document' };
  };

  const print = (...values: unknown[]): void => {
    state.output.push(values.map(formatValue).join(' '));
  };

  const takeScreenshot = (nodeIds: string[]): void => {
    for (const id of nodeIds) state.screenshots.push(id);
  };

  return {
    document: 'document',
    Insert: insert,
    Copy: copy,
    Update: update,
    Replace: replace,
    Move: move,
    Delete: remove,
    Get: get,
    SetVariables: setVariables,
    GetVariables: getVariables,
    FindEmptySpace: findEmptySpace,
    Print: print,
    TakeScreenshot: takeScreenshot,
  };
};

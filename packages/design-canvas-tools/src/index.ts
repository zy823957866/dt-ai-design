export { createCanvasSession } from './session';
export { createCanvasApi, type CanvasApi, type CanvasState } from './api';
export { CanvasToolError } from './errors';
export { computeBounds, computeOverflow, isContainer } from './geometry';
export { serializeDocumentRoot, serializeNode } from './serialize';
export { pruneEmptyLayers } from './prune';
export type { PruneEmptyResult } from './prune';
export type {
  CanvasBounds,
  CanvasEdit,
  CanvasNodeInput,
  CanvasSession,
  CanvasWarning,
  ExecuteOptions,
  ExecuteResult,
  FindEmptySpaceInput,
  GetContext,
  GetOptions,
  SerializedNode,
} from './types';

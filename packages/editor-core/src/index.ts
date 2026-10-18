export type { EditorState, Selection, Viewport, HistoryState } from './types';
export type { Command } from './command';
export { createEditorState } from './state';
export { CommandStack } from './command';
export {
  addLayer,
  removeLayer,
  moveLayer,
  resizeLayer,
  setLayerProperty,
  setLayersProperty,
  moveLayerForward,
  moveLayerBackward,
  moveLayerToFront,
  moveLayerToBack,
  reorderLayer,
  setSelection,
  groupSelection,
  ungroupSelection,
  frameSelection,
  duplicateLayer,
  alignSelection,
  distributeSelection,
  replaceDocument,
  appendFill,
  updateFill,
  removeFill,
  appendStroke,
  updateStroke,
  removeStroke,
  appendEffect,
  updateEffect,
  removeEffect,
  type AlignDirection,
  type DistributeDirection,
} from './commands';
export { zoomIn, zoomOut, zoomTo, pan, setViewport } from './viewport';
export {
  getSelectedLayers,
  getSelectedBounds,
  selectAll,
  deselectAll,
} from './selection';
export { createEventEmitter, type EditorEventMap } from './events';

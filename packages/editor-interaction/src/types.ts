import type { LayerTypeString } from '@dt-ai-design/design-schema';

// ������ Tool ID ������

export type CanvasToolId =
  | 'select'
  | 'hand'
  | 'zoom'
  | 'rectangle'
  | 'ellipse'
  | 'triangle'
  | 'frame'
  | 'text'
  | 'sticky'
  | 'pen';

// ������ Interaction Mode ������

export type InteractionMode =
  | 'idle'
  | 'creatingShape'
  | 'movingLayer'
  | 'resizingLayer'
  | 'marqueeSelecting'
  | 'panning'
  | 'drawingPen'
  | 'textEditing';

// ������ Pointer / Canvas Coordinates ������

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface ScreenPoint {
  clientX: number;
  clientY: number;
}

// ������ Hit Test Result ������

export interface HitResult {
  layerId: string;
  type: 'layer' | 'handle' | 'empty';
  handleId?: string;
}

// ������ Events (input to the interaction state machine) ������

export type InteractionEvent =
  | {
      type: 'pointerDown';
      point: CanvasPoint;
      hit: HitResult;
      shiftKey: boolean;
      metaKey: boolean;
    }
  | {
      type: 'pointerMove';
      point: CanvasPoint;
      buttons: number;
      shiftKey: boolean;
    }
  | { type: 'pointerUp'; point: CanvasPoint; hit: HitResult }
  | { type: 'pointerCancel' }
  | { type: 'keyDown'; key: string; metaKey: boolean; shiftKey: boolean }
  | { type: 'keyUp'; key: string; metaKey: boolean; shiftKey: boolean }
  | { type: 'selectTool'; tool: CanvasToolId }
  | { type: 'setSelection'; layerIds: string[] }
  | { type: 'escape' };

// ������ Commands (output from the interaction state machine) ������

export type InteractionCommand =
  | { type: 'selectLayer'; layerIds: string[]; additive: boolean }
  | { type: 'deselectAll' }
  | { type: 'showCreationOverlay'; bounds: CreationBounds; tool: CanvasToolId }
  | { type: 'updateCreationOverlay'; bounds: CreationBounds }
  | { type: 'clearCreationOverlay' }
  | {
      type: 'createLayer';
      layerType: LayerTypeString;
      bounds: { x: number; y: number; width: number; height: number };
    }
  | { type: 'moveLayer'; layerIds: string[]; dx: number; dy: number }
  | {
      type: 'resizeLayer';
      layerId: string;
      dx: number;
      dy: number;
      handle: string;
    }
  | { type: 'updateMarquee'; bounds: CreationBounds; additive: boolean }
  | { type: 'endMarquee' }
  | { type: 'setActiveTool'; tool: CanvasToolId }
  | { type: 'startPan' }
  | { type: 'pan'; dx: number; dy: number }
  | { type: 'endPan' }
  | { type: 'startTextEdit'; layerId: string }
  | { type: 'endTextEdit' };

// ������ Draft State (in-progress drag data) ������

export interface InteractionDraft {
  startPoint: CanvasPoint;
  currentPoint: CanvasPoint;
  initialLayerPositions?: Map<string, { x: number; y: number }>;
  targetLayerIds?: string[];
  handleId?: string;
}

// ������ Full Interaction State ������

export interface InteractionState {
  activeTool: CanvasToolId;
  mode: InteractionMode;
  selectedLayerIds: string[];
  draft: InteractionDraft | null;
  isSpacePressed: boolean;
  creationBounds: CreationBounds | null;
  marqueeBounds: CreationBounds | null;
  textEditingLayerId: string | null;
}

// ������ Creation Bounds ������

export interface CreationBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ������ Interaction Instance ������

export interface EditorInteraction {
  getState: () => InteractionState;
  dispatch: (event: InteractionEvent) => InteractionCommand[];
  subscribe: (callback: () => void) => () => void;
}

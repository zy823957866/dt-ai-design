import type { LayerTypeString } from '@dt-ai-design/design-schema';
import type {
  InteractionState,
  InteractionEvent,
  InteractionCommand,
  CanvasPoint,
  CreationBounds,
} from './types';

interface ReduceResult {
  state: InteractionState;
  commands: InteractionCommand[];
}

const DRAG_THRESHOLD = 3;

function pointDelta(
  a: CanvasPoint,
  b: CanvasPoint,
): { dx: number; dy: number } {
  return { dx: a.x - b.x, dy: a.y - b.y };
}

function boundsFromPoints(
  start: CanvasPoint,
  end: CanvasPoint,
): CreationBounds {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  return { x, y, width, height };
}

function isShapeTool(tool: string): boolean {
  return ['rectangle', 'ellipse', 'polygon', 'frame', 'browser'].includes(tool);
}

/** 工具 → 图层类型（用于 createLayer 命令） */
export function toolToLayerType(tool: string): LayerTypeString | null {
  if (tool === 'rectangle') return 'rectangle';
  if (tool === 'ellipse') return 'ellipse';
  if (tool === 'polygon') return 'polygon';
  if (tool === 'frame') return 'frame';
  if (tool === 'browser') return 'browser';
  if (tool === 'sticky') return 'stickyNote';
  if (tool === 'path' || tool === 'pen') return 'path';
  return null;
}

export function reduceInteraction(
  state: InteractionState,
  event: InteractionEvent,
): ReduceResult {
  const commands: InteractionCommand[] = [];

  switch (event.type) {
    // ������ Tool switching ������
    case 'selectTool': {
      const next: InteractionState = {
        ...state,
        activeTool: event.tool,
        mode: state.mode === 'idle' ? 'idle' : state.mode,
        draft: state.mode === 'idle' ? null : state.draft,
        creationBounds:
          state.mode === 'creatingShape' ? state.creationBounds : null,
      };
      commands.push({ type: 'setActiveTool', tool: event.tool });
      return { state: next, commands };
    }

    // ������ External selection sync ������
    case 'setSelection': {
      return {
        state: { ...state, selectedLayerIds: event.layerIds },
        commands: [],
      };
    }

    // ������ Escape / cancel ������
    case 'escape': {
      if (state.mode !== 'idle') {
        const resetCommands: InteractionCommand[] = [];
        if (state.mode === 'creatingShape') {
          resetCommands.push({ type: 'clearCreationOverlay' });
        }
        return {
          state: {
            ...state,
            mode: 'idle',
            draft: null,
            creationBounds: null,
            textEditingLayerId: null,
            activeTool: 'move',
          },
          commands: [
            ...resetCommands,
            { type: 'setActiveTool', tool: 'move' },
            { type: 'deselectAll' },
          ],
        };
      }
      return {
        state: { ...state, selectedLayerIds: [], textEditingLayerId: null },
        commands: [{ type: 'deselectAll' }],
      };
    }

    // ������ Keyboard ������
    case 'keyDown': {
      if (event.key === ' ' && !state.isSpacePressed && state.mode === 'idle') {
        return { state: { ...state, isSpacePressed: true }, commands: [] };
      }
      return { state, commands };
    }

    case 'keyUp': {
      if (event.key === ' ') {
        return { state: { ...state, isSpacePressed: false }, commands: [] };
      }
      return { state, commands };
    }

    // ������ Pointer Down ������
    case 'pointerDown': {
      const isPanning = state.activeTool === 'hand' || state.isSpacePressed;

      // Panning (hand tool or space drag)
      if (isPanning) {
        return {
          state: {
            ...state,
            mode: 'panning',
            draft: {
              startPoint: event.point,
              currentPoint: event.point,
            },
          },
          commands: [{ type: 'startPan' }],
        };
      }

      // Shape creation tools
      if (isShapeTool(state.activeTool) && event.hit.type === 'empty') {
        return {
          state: {
            ...state,
            mode: 'creatingShape',
            draft: {
              startPoint: event.point,
              currentPoint: event.point,
            },
            creationBounds: {
              x: event.point.x,
              y: event.point.y,
              width: 0,
              height: 0,
            },
          },
          commands: [
            {
              type: 'showCreationOverlay',
              bounds: {
                x: event.point.x,
                y: event.point.y,
                width: 0,
                height: 0,
              },
              tool: state.activeTool,
            },
          ],
        };
      }

      // Resize handle
      if (
        state.activeTool === 'move' &&
        event.hit.type === 'handle' &&
        event.hit.handleId
      ) {
        return {
          state: {
            ...state,
            mode: 'resizingLayer',
            draft: {
              startPoint: event.point,
              currentPoint: event.point,
              targetLayerIds: [event.hit.layerId],
              handleId: event.hit.handleId,
            },
          },
          commands: [],
        };
      }

      // Click on layer (select tool)
      if (state.activeTool === 'move' && event.hit.type === 'layer') {
        const alreadySelected = state.selectedLayerIds.includes(
          event.hit.layerId,
        );

        let newSelection = state.selectedLayerIds;
        if (!alreadySelected) {
          newSelection = event.shiftKey
            ? [...state.selectedLayerIds, event.hit.layerId]
            : [event.hit.layerId];
          commands.push({
            type: 'selectLayer',
            layerIds: newSelection,
            additive: event.shiftKey,
          });
        } else if (event.shiftKey) {
          newSelection = state.selectedLayerIds.filter(
            (id) => id !== event.hit.layerId,
          );
          commands.push({
            type: 'selectLayer',
            layerIds: newSelection,
            additive: true,
          });
          // Clicking already-selected + shift = deselect; don't enter drag
          return {
            state: { ...state, selectedLayerIds: newSelection },
            commands,
          };
        }

        return {
          state: {
            ...state,
            selectedLayerIds: newSelection,
            mode: 'movingLayer',
            draft: {
              startPoint: event.point,
              currentPoint: event.point,
              targetLayerIds: newSelection,
            },
          },
          commands,
        };
      }

      // Click on empty canvas (select tool) �� marquee selection
      if (state.activeTool === 'move' && event.hit.type === 'empty') {
        if (!event.shiftKey && state.selectedLayerIds.length > 0) {
          commands.push({ type: 'deselectAll' });
        }

        return {
          state: {
            ...state,
            selectedLayerIds: event.shiftKey ? state.selectedLayerIds : [],
            mode: 'marqueeSelecting',
            draft: {
              startPoint: event.point,
              currentPoint: event.point,
            },
            marqueeBounds: {
              x: event.point.x,
              y: event.point.y,
              width: 0,
              height: 0,
            },
          },
          commands,
        };
      }

      return { state, commands };
    }

    // ������ Pointer Move ������
    case 'pointerMove': {
      if (!state.draft) return { state, commands };

      if (state.mode === 'panning') {
        const moveDx = event.point.x - state.draft.currentPoint.x;
        const moveDy = event.point.y - state.draft.currentPoint.y;

        return {
          state: {
            ...state,
            draft: { ...state.draft, currentPoint: event.point },
          },
          commands: [{ type: 'pan', dx: moveDx, dy: moveDy }],
        };
      }

      if (state.mode === 'creatingShape') {
        const bounds = boundsFromPoints(state.draft.startPoint, event.point);
        return {
          state: {
            ...state,
            draft: { ...state.draft, currentPoint: event.point },
            creationBounds: bounds,
          },
          commands: [{ type: 'updateCreationOverlay', bounds }],
        };
      }

      if (state.mode === 'movingLayer' && state.draft.targetLayerIds) {
        const { dx, dy } = pointDelta(event.point, state.draft.startPoint);
        const moved =
          Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD;
        if (!moved) return { state, commands };

        const moveDx = event.point.x - state.draft.currentPoint.x;
        const moveDy = event.point.y - state.draft.currentPoint.y;

        return {
          state: {
            ...state,
            draft: { ...state.draft, currentPoint: event.point },
          },
          commands: [
            {
              type: 'moveLayer',
              layerIds: state.draft.targetLayerIds,
              dx: moveDx,
              dy: moveDy,
            },
          ],
        };
      }

      if (state.mode === 'resizingLayer' && state.draft.targetLayerIds) {
        const ddx = event.point.x - state.draft.currentPoint.x;
        const ddy = event.point.y - state.draft.currentPoint.y;
        return {
          state: {
            ...state,
            draft: { ...state.draft, currentPoint: event.point },
          },
          commands: [
            {
              type: 'resizeLayer',
              layerId: state.draft.targetLayerIds[0],
              handle: state.draft.handleId!,
              dx: ddx,
              dy: ddy,
            },
          ],
        };
      }

      if (state.mode === 'marqueeSelecting') {
        const bounds = boundsFromPoints(state.draft.startPoint, event.point);
        return {
          state: {
            ...state,
            draft: { ...state.draft, currentPoint: event.point },
            creationBounds: bounds,
          },
          commands: [
            { type: 'updateMarquee', bounds, additive: event.shiftKey },
          ],
        };
      }

      return { state, commands };
    }

    // ������ Pointer Up / Cancel ������
    case 'pointerUp':
    case 'pointerCancel': {
      if (state.mode === 'panning') {
        return {
          state: { ...state, mode: 'idle', draft: null },
          commands: [{ type: 'endPan' }],
        };
      }

      if (state.mode === 'creatingShape' && state.draft) {
        const raw = boundsFromPoints(
          state.draft.startPoint,
          state.draft.currentPoint,
        );
        // 点击（几乎无拖拽）按默认尺寸创建；拖拽则按拖拽范围创建
        const isClick = raw.width <= 4 && raw.height <= 4;
        const bounds: CreationBounds = isClick
          ? {
              x: state.draft.startPoint.x,
              y: state.draft.startPoint.y,
              width: 100,
              height: 100,
            }
          : raw;

        const endCommands: InteractionCommand[] = [
          { type: 'clearCreationOverlay' },
        ];

        const layerType = toolToLayerType(state.activeTool);
        if (layerType) {
          endCommands.push({
            type: 'createLayer',
            layerType,
            bounds,
          });
        }

        return {
          state: {
            ...state,
            mode: 'idle',
            draft: null,
            creationBounds: null,
            activeTool: 'move',
          },
          commands: [...endCommands, { type: 'setActiveTool', tool: 'move' }],
        };
      }

      if (state.mode === 'movingLayer') {
        return {
          state: { ...state, mode: 'idle', draft: null },
          commands: [],
        };
      }

      if (state.mode === 'resizingLayer') {
        return {
          state: { ...state, mode: 'idle', draft: null },
          commands: [],
        };
      }

      if (state.mode === 'marqueeSelecting') {
        return {
          state: { ...state, mode: 'idle', draft: null, marqueeBounds: null },
          commands: [{ type: 'endMarquee' }],
        };
      }

      return { state, commands };
    }

    default:
      return { state, commands };
  }
}

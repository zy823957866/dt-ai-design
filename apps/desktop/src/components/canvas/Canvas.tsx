import './canvas-ruler.css';
import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useEditor } from '@/lib/editor';
import { useEditorInteraction } from '@/components/editor/EditorInteractionProvider';
import {
  CanvasRuler,
  CanvasRulerCorner,
  DEFAULT_RULER_THICKNESS as RULER_OFFSET,
} from '@dt-ai-design/canvas-ruler';
import type {
  HitResult,
  InteractionCommand,
} from '@dt-ai-design/editor-interaction';
import { CanvasDocumentRenderer } from './CanvasDocumentRenderer';
import { CanvasCreationOverlay } from './CanvasCreationOverlay';
import { ViewportSelectionOverlay } from './ViewportSelectionOverlay';
import type {
  Layer,
  FrameLayer,
  GroupLayer,
  TextLayer,
} from '@dt-ai-design/design-schema';

// ─── Shared Helpers ───

function getLayerTransform(layer: Layer): string {
  const cx = layer.x + layer.width / 2;
  const cy = layer.y + layer.height / 2;
  const rotation = layer.rotation || 0;
  if (rotation === 0) return '';
  return `rotate(${rotation} ${cx} ${cy})`;
}

function textAlignToAnchor(
  align: string | undefined,
): 'start' | 'middle' | 'end' {
  switch (align) {
    case 'center':
      return 'middle';
    case 'right':
      return 'end';
    default:
      return 'start';
  }
}

// ─── Main Canvas Component ───

export function Canvas() {
  const editor = useEditor();
  const { state: interactionState, dispatch: interactionDispatch } =
    useEditorInteraction();

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState(0);

  useMemo(
    () => editor.subscribe('change', () => forceUpdate((t) => t + 1)),
    [editor],
  );
  useMemo(
    () => editor.subscribe('selectionChange', () => forceUpdate((t) => t + 1)),
    [editor],
  );
  useMemo(
    () => editor.subscribe('viewportChange', () => forceUpdate((t) => t + 1)),
    [editor],
  );

  const doc = editor.getDocument();
  const viewport = editor.getViewport();
  const selection = editor.getSelection();
  const [showRulers, setShowRulers] = useState(editor.getShowRulers());
  useEffect(() => {
    const handler = () => setShowRulers(editor.getShowRulers());
    try {
      const off = (
        editor as unknown as {
          subscribe: (evt: string, cb: () => void) => () => void;
        }
      ).subscribe('rulerToggle', handler);
      return off;
    } catch {
      return () => {};
    }
  }, [editor]);

  const activeTool = interactionState.activeTool;
  const interactionMode = interactionState.mode;
  const isSpacePressed = interactionState.isSpacePressed;
  const creationBounds = interactionState.creationBounds;
  const marqueeBounds = interactionState.marqueeBounds;

  const hoveredLayerRef = useRef<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [smartGuides, setSmartGuides] = useState<
    Array<{ type: 'v' | 'h'; pos: number; start: number; end: number }>
  >([]);

  const initialDragPositionsRef = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );
  const marqueeInitialRef = useRef<string[]>([]);
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const canvasOffset = showRulers ? RULER_OFFSET : 0;
  const rulerWidth = Math.max(0, containerSize.width - RULER_OFFSET);
  const rulerHeight = Math.max(0, containerSize.height - RULER_OFFSET);

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      return {
        x: (clientX - rect.left - viewport.panX) / viewport.zoom,
        y: (clientY - rect.top - viewport.panY) / viewport.zoom,
      };
    },
    [viewport],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.min(
          Math.max(viewport.zoom * (1 + delta), 0.1),
          16,
        );
        const zoomRatio = newZoom / viewport.zoom;
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          const newPanX = mouseX - (mouseX - viewport.panX) * zoomRatio;
          const newPanY = mouseY - (mouseY - viewport.panY) * zoomRatio;
          editor.setViewport({
            zoom: newZoom,
            panX: newPanX,
            panY: newPanY,
          });
        }
      } else {
        editor.pan(-e.deltaX, -e.deltaY);
      }
    },
    [editor, viewport],
  );

  const computeSmartGuides = useCallback(
    (
      movingId: string,
      newX: number,
      newY: number,
    ): Array<{ type: 'v' | 'h'; pos: number; start: number; end: number }> => {
      const guides: Array<{
        type: 'v' | 'h';
        pos: number;
        start: number;
        end: number;
      }> = [];
      const movingLayer = doc.layers[movingId];
      if (!movingLayer) return guides;
      const threshold = 4 / viewport.zoom;
      const movingCX = newX + movingLayer.width / 2;
      const movingCY = newY + movingLayer.height / 2;
      const movingRight = newX + movingLayer.width;
      const movingBottom = newY + movingLayer.height;

      function checkLayer(layer: Layer): void {
        if (layer.id === movingId || !layer.visible || layer.locked) return;
        const otherCX = layer.x + layer.width / 2;
        const otherCY = layer.y + layer.height / 2;
        const otherRight = layer.x + layer.width;
        const otherBottom = layer.y + layer.height;
        const guideEnd = Math.max(layer.y + layer.height, movingBottom);
        const guideStart = Math.min(layer.y, newY);
        const guideEndH = Math.max(layer.x + layer.width, movingRight);
        const guideStartH = Math.min(layer.x, newX);
        if (Math.abs(newX - layer.x) < threshold) {
          guides.push({
            type: 'v',
            pos: layer.x,
            start: guideStart,
            end: guideEnd,
          });
        }
        if (Math.abs(movingRight - otherRight) < threshold) {
          guides.push({
            type: 'v',
            pos: otherRight,
            start: guideStart,
            end: guideEnd,
          });
        }
        if (Math.abs(movingCX - otherCX) < threshold) {
          guides.push({
            type: 'v',
            pos: otherCX,
            start: guideStart,
            end: guideEnd,
          });
        }
        if (Math.abs(newY - layer.y) < threshold) {
          guides.push({
            type: 'h',
            pos: layer.y,
            start: guideStartH,
            end: guideEndH,
          });
        }
        if (Math.abs(movingBottom - otherBottom) < threshold) {
          guides.push({
            type: 'h',
            pos: otherBottom,
            start: guideStartH,
            end: guideEndH,
          });
        }
        if (Math.abs(movingCY - otherCY) < threshold) {
          guides.push({
            type: 'h',
            pos: otherCY,
            start: guideStartH,
            end: guideEndH,
          });
        }
      }
      function checkChildren(ids: string[]): void {
        for (const id of ids) {
          const layer = doc.layers[id];
          if (!layer) continue;
          checkLayer(layer);
          if (layer.type === 'frame' || layer.type === 'group') {
            const children = (layer as FrameLayer | GroupLayer).children;
            if (children) checkChildren(children);
          }
        }
      }
      checkChildren(doc.rootLayerIds);
      return guides;
    },
    [doc, viewport.zoom],
  );
  // ─── Hit test ───
  const hitTestAtPoint = useCallback(
    (canvasX: number, canvasY: number): HitResult => {
      function hitLayer(layer: Layer): boolean {
        if (!layer.visible || layer.locked) return false;
        const transform = getLayerTransform(layer);
        if (transform) {
          const cx = layer.x + layer.width / 2;
          const cy = layer.y + layer.height / 2;
          const dx = canvasX - cx;
          const dy = canvasY - cy;
          const cos = Math.cos(0);
          const sin = Math.sin(0);
          const localX = dx * cos + dy * sin + cx;
          const localY = -dx * sin + dy * cos + cy;
          return (
            localX >= layer.x &&
            localX <= layer.x + layer.width &&
            localY >= layer.y &&
            localY <= layer.y + layer.height
          );
        }
        return (
          canvasX >= layer.x &&
          canvasX <= layer.x + layer.width &&
          canvasY >= layer.y &&
          canvasY <= layer.y + layer.height
        );
      }

      function hitTestChildren(ids: string[]): string | null {
        for (let i = ids.length - 1; i >= 0; i--) {
          const id = ids[i];
          const layer = doc.layers[id];
          if (!layer) continue;
          if (layer.type === 'frame' || layer.type === 'group') {
            const children = (layer as FrameLayer | GroupLayer).children;
            if (children) {
              const childHit = hitTestChildren(children);
              if (childHit) return childHit;
            }
          }
          if (hitLayer(layer)) return layer.id;
        }
        return null;
      }

      const hitId = hitTestChildren(doc.rootLayerIds);
      if (hitId) {
        return { layerId: hitId, type: 'layer' };
      }
      return { layerId: '', type: 'empty' };
    },
    [doc],
  );

  // ─── Command execution: bridge interaction commands to editor-core ───
  const executeCommands = useCallback(
    (commands: InteractionCommand[]) => {
      for (const cmd of commands) {
        switch (cmd.type) {
          case 'setActiveTool':
            editor.setActiveTool(cmd.tool);
            break;
          case 'selectLayer':
            editor.setSelection(cmd.layerIds);
            break;
          case 'deselectAll':
            editor.deselectAll();
            break;
          case 'startPan':
          case 'endPan':
            break;
          case 'pan':
            // dx/dy 已是屏幕像素增量，与 handleMouseMove 的平移拦截路径一致
            editor.pan(cmd.dx, cmd.dy);
            break;
          case 'moveLayer': {
            for (const id of cmd.layerIds) {
              const layer = doc.layers[id];
              if (layer) {
                const newX = layer.x + cmd.dx;
                const newY = layer.y + cmd.dy;
                editor.moveLayer(id, newX, newY);
                if (cmd.layerIds.length === 1) {
                  const guides = computeSmartGuides(id, newX, newY);
                  setSmartGuides(guides);
                }
              }
            }
            break;
          }
          case 'resizeLayer': {
            const layer = doc.layers[cmd.layerId];
            if (!layer) break;
            const handle = cmd.handle;
            let newX = layer.x;
            let newY = layer.y;
            let newW = layer.width;
            let newH = layer.height;
            const dx = cmd.dx;
            const dy = cmd.dy;
            if (handle.includes('r')) {
              newW = Math.max(1, layer.width + dx);
            }
            if (handle.includes('l')) {
              newW = Math.max(1, layer.width - dx);
              newX = layer.x + layer.width - newW;
            }
            if (handle.includes('b')) {
              newH = Math.max(1, layer.height + dy);
            }
            if (handle.includes('t')) {
              newH = Math.max(1, layer.height - dy);
              newY = layer.y + layer.height - newH;
            }
            editor.moveLayer(cmd.layerId, newX, newY);
            editor.resizeLayer(cmd.layerId, newW, newH);
            break;
          }
          case 'updateMarquee': {
            const intersecting: string[] = [];
            const { x, y, width, height } = cmd.bounds;
            const right = x + width;
            const bottom = y + height;
            function checkLayers(ids: string[]): void {
              for (const id of ids) {
                const layer = doc.layers[id];
                if (!layer || !layer.visible || layer.locked) continue;
                const layerRight = layer.x + layer.width;
                const layerBottom = layer.y + layer.height;
                if (
                  layer.x < right &&
                  layerRight > x &&
                  layer.y < bottom &&
                  layerBottom > y
                ) {
                  intersecting.push(id);
                }
                if (layer.type === 'frame' || layer.type === 'group') {
                  const children = (layer as FrameLayer | GroupLayer).children;
                  if (children) checkLayers(children);
                }
              }
            }
            checkLayers(doc.rootLayerIds);
            if (cmd.additive && marqueeInitialRef.current.length > 0) {
              const combined = new Set([
                ...marqueeInitialRef.current,
                ...intersecting,
              ]);
              editor.setSelection([...combined]);
            } else {
              editor.setSelection(intersecting);
            }
            break;
          }
          case 'endMarquee':
            marqueeInitialRef.current = [];
            break;
          case 'showCreationOverlay':
          case 'updateCreationOverlay':
          case 'clearCreationOverlay':
            break;
          default:
            break;
        }
      }
    },
    [editor, doc, computeSmartGuides],
  );
  // ─── Pointer event handlers (delegated to interaction state machine) ───
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setMouseCanvasPos(canvasPos);

      if (activeTool === 'zoom' && e.button === 0) {
        const delta = e.altKey || e.shiftKey ? -0.1 : 0.1;
        const newZoom = Math.min(
          Math.max(viewport.zoom * (1 + delta), 0.1),
          16,
        );
        const zoomRatio = newZoom / viewport.zoom;
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          const newPanX = mouseX - (mouseX - viewport.panX) * zoomRatio;
          const newPanY = mouseY - (mouseY - viewport.panY) * zoomRatio;
          editor.setViewport({
            zoom: newZoom,
            panX: newPanX,
            panY: newPanY,
          });
        }
        return;
      }

      // Middle-click always pans
      if (e.button === 1) {
        const emptyHit: HitResult = { layerId: '', type: 'empty' };
        const commands = interactionDispatch({
          type: 'pointerDown',
          point: { x: e.clientX, y: e.clientY },
          hit: emptyHit,
          shiftKey: e.shiftKey,
          metaKey: e.metaKey || e.ctrlKey,
        });
        // Pan with screen coordinates
        for (const cmd of commands) {
          if (cmd.type === 'pan') {
            editor.pan(cmd.dx, cmd.dy);
          }
        }
        return;
      }

      if (e.button !== 0) return;

      const hit = hitTestAtPoint(canvasPos.x, canvasPos.y);

      // 手型工具 / 空格拖拽会进入平移模式：平移全程使用屏幕坐标（与 pointerMove 的
      // panning 分支一致），若此处传世界坐标，首次移动会算出 clientX - worldX 的巨
      // 大增量，导致画布内容瞬间飞向右下角
      const willPan = activeTool === 'hand' || isSpacePressed;

      // Save initial positions for move/smart guides
      if (
        activeTool === 'select' &&
        hit.type === 'layer' &&
        !e.shiftKey &&
        !willPan
      ) {
        const alreadySelected = selection.layerIds.includes(hit.layerId);
        const selIds = alreadySelected ? selection.layerIds : [hit.layerId];
        initialDragPositionsRef.current = new Map();
        for (const id of selIds) {
          const l = doc.layers[id];
          if (l) initialDragPositionsRef.current.set(id, { x: l.x, y: l.y });
        }
      } else if (activeTool === 'select' && hit.type === 'empty' && !willPan) {
        marqueeInitialRef.current = e.shiftKey ? [...selection.layerIds] : [];
      }

      const commands = interactionDispatch({
        type: 'pointerDown',
        point: willPan ? { x: e.clientX, y: e.clientY } : canvasPos,
        hit,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey || e.ctrlKey,
      });

      executeCommands(commands);
    },
    [
      editor,
      viewport,
      activeTool,
      isSpacePressed,
      selection.layerIds,
      screenToCanvas,
      hitTestAtPoint,
      doc,
      interactionDispatch,
      executeCommands,
    ],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setMouseCanvasPos(canvasPos);

      if (interactionMode === 'idle') return;

      const commands = interactionDispatch({
        type: 'pointerMove',
        point:
          interactionMode === 'panning'
            ? { x: e.clientX, y: e.clientY }
            : canvasPos,
        buttons: e.buttons,
        shiftKey: e.shiftKey,
      });

      for (const cmd of commands) {
        if (cmd.type === 'pan' && interactionMode === 'panning') {
          editor.pan(cmd.dx, cmd.dy);
        } else {
          executeCommands([cmd]);
        }
      }
    },
    [
      interactionMode,
      screenToCanvas,
      interactionDispatch,
      editor,
      executeCommands,
    ],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (interactionMode === 'idle') return;

      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      const hit = hitTestAtPoint(canvasPos.x, canvasPos.y);

      const commands = interactionDispatch({
        type: 'pointerUp',
        point:
          interactionMode === 'panning'
            ? { x: e.clientX, y: e.clientY }
            : canvasPos,
        hit,
      });

      executeCommands(commands);
      setSmartGuides([]);
      initialDragPositionsRef.current = new Map();
    },
    [
      interactionMode,
      screenToCanvas,
      hitTestAtPoint,
      interactionDispatch,
      executeCommands,
    ],
  );

  const handleLayerEnter = useCallback((layerId: string) => {
    hoveredLayerRef.current = layerId;
    forceUpdate((t) => t + 1);
  }, []);

  const handleLayerLeave = useCallback(() => {
    hoveredLayerRef.current = null;
    forceUpdate((t) => t + 1);
  }, []);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: string, layerId: string) => {
      e.stopPropagation();
      if (activeTool !== 'select') return;
      const layer = doc.layers[layerId];
      if (!layer) return;
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      interactionDispatch({
        type: 'pointerDown',
        point: canvasPos,
        hit: { layerId, type: 'handle', handleId: handle },
        shiftKey: e.shiftKey,
        metaKey: e.metaKey || e.ctrlKey,
      });
    },
    [activeTool, doc, screenToCanvas, interactionDispatch],
  );

  const handleTextDoubleClick = useCallback(
    (e: React.MouseEvent, layerId: string) => {
      e.stopPropagation();
      const layer = doc.layers[layerId];
      if (!layer || layer.type !== 'text' || layer.locked) return;
      if (!selection.layerIds.includes(layerId)) {
        editor.setSelection([layerId]);
      }
      setEditingTextId(layerId);
    },
    [doc, selection, editor],
  );

  const finishTextEditing = useCallback(
    (cancel = false) => {
      if (!editingTextId) return;
      const textarea = textareaRef.current;
      if (!cancel && textarea) {
        editor.setLayerProperty(editingTextId, 'content', textarea.value);
      }
      setEditingTextId(null);
    },
    [editingTextId, editor],
  );

  useEffect(() => {
    if (editingTextId && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editingTextId]);

  // 键盘：Ctrl+= / Ctrl+- / Ctrl+0 控制画布缩放（应用菜单已移除 zoom role）
  const zoomAtCenter = useCallback(
    (factor: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const newZoom = Math.min(Math.max(viewport.zoom * (1 + factor), 0.1), 16);
      if (newZoom === viewport.zoom) return;
      const zoomRatio = newZoom / viewport.zoom;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      editor.setViewport({
        zoom: newZoom,
        panX: cx - (cx - viewport.panX) * zoomRatio,
        panY: cy - (cy - viewport.panY) * zoomRatio,
      });
    },
    [editor, viewport],
  );

  const resetZoomAtCenter = useCallback(() => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    editor.setViewport({
      zoom: 1,
      panX: cx - (cx - viewport.panX) / viewport.zoom,
      panY: cy - (cy - viewport.panY) / viewport.zoom,
    });
  }, [editor, viewport]);

  useEffect(() => {
    const handleZoomKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }
      const key = e.key;
      if (key === '=' || key === '+') {
        e.preventDefault();
        zoomAtCenter(0.1);
      } else if (key === '-' || key === '_') {
        e.preventDefault();
        zoomAtCenter(-0.1);
      } else if (key === '0') {
        e.preventDefault();
        resetZoomAtCenter();
      }
    };
    window.addEventListener('keydown', handleZoomKeyDown);
    return () => window.removeEventListener('keydown', handleZoomKeyDown);
  }, [zoomAtCenter, resetZoomAtCenter]);

  // Keyboard: space bar for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !e.repeat) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        interactionDispatch({
          type: 'keyDown',
          key: ' ',
          metaKey: false,
          shiftKey: false,
        });
      } else if (e.key === 'Escape') {
        interactionDispatch({ type: 'escape' });
        setEditingTextId(null);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        interactionDispatch({
          type: 'keyUp',
          key: ' ',
          metaKey: false,
          shiftKey: false,
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [interactionDispatch]);

  const hoveredId = hoveredLayerRef.current;

  const getCanvasCursor = () => {
    if (interactionMode === 'panning') return 'grabbing';
    if (activeTool === 'hand' || interactionState.isSpacePressed) return 'grab';
    if (activeTool === 'zoom') return 'zoom-in';
    if (['rectangle', 'ellipse', 'frame', 'triangle'].includes(activeTool))
      return 'crosshair';
    return 'default';
  };
  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-bg-canvas h-full"
      style={{ cursor: getCanvasCursor() }}
      onWheel={handleWheel}
    >
      {/* Rulers */}
      {showRulers && (
        <>
          <div
            className="absolute left-0 top-0 z-10"
            style={{ width: RULER_OFFSET, height: RULER_OFFSET }}
          >
            <CanvasRulerCorner thickness={RULER_OFFSET} />
          </div>
          <div
            className="absolute left-0 z-10"
            style={{ top: RULER_OFFSET, left: 0, width: RULER_OFFSET }}
          >
            <CanvasRuler
              axis="vertical"
              zoom={viewport.zoom}
              viewportSize={rulerHeight}
              worldStart={-viewport.panY / viewport.zoom}
              worldEnd={
                rulerHeight / viewport.zoom - viewport.panY / viewport.zoom
              }
              thickness={RULER_OFFSET}
              mousePos={
                mouseCanvasPos
                  ? mouseCanvasPos.y * viewport.zoom + viewport.panY
                  : null
              }
            />
          </div>
          <div
            className="absolute left-0 top-0 z-10"
            style={{
              top: 0,
              left: RULER_OFFSET,
              right: 0,
              height: RULER_OFFSET,
            }}
          >
            <CanvasRuler
              axis="horizontal"
              zoom={viewport.zoom}
              viewportSize={rulerWidth}
              worldStart={-viewport.panX / viewport.zoom}
              worldEnd={
                rulerWidth / viewport.zoom - viewport.panX / viewport.zoom
              }
              thickness={RULER_OFFSET}
              mousePos={
                mouseCanvasPos
                  ? mouseCanvasPos.x * viewport.zoom + viewport.panX
                  : null
              }
            />
          </div>
        </>
      )}

      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle, var(--color-border) 1px, transparent 1px)',
          backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
          backgroundPosition: `${viewport.panX + canvasOffset}px ${viewport.panY + canvasOffset}px`,
          marginLeft: canvasOffset,
          marginTop: canvasOffset,
        }}
      />

      <svg
        ref={svgRef}
        className="absolute h-full w-full"
        style={{ top: canvasOffset, left: canvasOffset, right: 0, bottom: 0 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g
          transform={`translate(${viewport.panX}, ${viewport.panY}) scale(${viewport.zoom})`}
        >
          <CanvasDocumentRenderer
            doc={doc}
            selectedIds={selection.layerIds}
            hoveredId={hoveredId}
            onLayerClick={() => {}}
            onLayerDoubleClick={handleTextDoubleClick}
            onLayerEnter={handleLayerEnter}
            onLayerLeave={handleLayerLeave}
          />

          {/* Smart guides */}
          {smartGuides.map((guide, i) => (
            <line
              key={i}
              x1={guide.type === 'v' ? guide.pos : guide.start}
              y1={guide.type === 'h' ? guide.pos : guide.start}
              x2={guide.type === 'v' ? guide.pos : guide.end}
              y2={guide.type === 'h' ? guide.pos : guide.end}
              stroke="#f43f5e"
              strokeWidth={1 / viewport.zoom}
              style={{ pointerEvents: 'none' }}
            />
          ))}

          {/* Marquee selection rectangle */}
          {interactionMode === 'marqueeSelecting' && marqueeBounds && (
            <rect
              x={marqueeBounds.x}
              y={marqueeBounds.y}
              width={marqueeBounds.width}
              height={marqueeBounds.height}
              fill="rgba(139, 92, 246, 0.1)"
              stroke="#8b5cf6"
              strokeWidth={1 / viewport.zoom}
              strokeDasharray={`${4 / viewport.zoom} ${2 / viewport.zoom}`}
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* Creation preview (shape tools) */}
          {interactionMode === 'creatingShape' && creationBounds && (
            <rect
              x={creationBounds.x}
              y={creationBounds.y}
              width={creationBounds.width}
              height={creationBounds.height}
              fill="rgba(139, 92, 246, 0.15)"
              stroke="#8b5cf6"
              strokeWidth={1 / viewport.zoom}
              strokeDasharray={`${4 / viewport.zoom} ${2 / viewport.zoom}`}
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* Hover highlight */}
          {hoveredId &&
            !selection.layerIds.includes(hoveredId) &&
            (() => {
              const layer = doc.layers[hoveredId];
              if (!layer || !layer.visible) return null;
              return (
                <rect
                  x={layer.x}
                  y={layer.y}
                  width={layer.width}
                  height={layer.height}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth={1 / viewport.zoom}
                  strokeDasharray={`${3 / viewport.zoom} ${2 / viewport.zoom}`}
                  style={{ pointerEvents: 'none' }}
                  transform={getLayerTransform(layer)}
                />
              );
            })()}
        </g>
      </svg>

      {/* Hover highlight (screen-space) */}
      {hoveredId &&
        !selection.layerIds.includes(hoveredId) &&
        (() => {
          const layer = doc.layers[hoveredId];
          if (!layer || !layer.visible) return null;
          const hx = layer.x * viewport.zoom + viewport.panX + canvasOffset;
          const hy = layer.y * viewport.zoom + viewport.panY + canvasOffset;
          const hw = layer.width * viewport.zoom;
          const hh = layer.height * viewport.zoom;
          const hasRot = (layer.rotation || 0) !== 0;
          return (
            <div
              style={{
                position: 'absolute',
                left: `${hx}px`,
                top: `${hy}px`,
                width: `${hw}px`,
                height: `${hh}px`,
                border: '1px dashed #60a5fa',
                boxSizing: 'border-box',
                pointerEvents: 'none',
                zIndex: 14,
                transformOrigin: 'center center',
                transform: hasRot ? `rotate(${layer.rotation}deg)` : undefined,
              }}
            />
          );
        })()}

      {/* Marquee selection (screen-space) */}
      {interactionMode === 'marqueeSelecting' && marqueeBounds && (
        <div
          style={{
            position: 'absolute',
            left: `${marqueeBounds.x * viewport.zoom + viewport.panX + canvasOffset}px`,
            top: `${marqueeBounds.y * viewport.zoom + viewport.panY + canvasOffset}px`,
            width: `${Math.max(marqueeBounds.width * viewport.zoom, 0)}px`,
            height: `${Math.max(marqueeBounds.height * viewport.zoom, 0)}px`,
            border: '1px dashed #8b5cf6',
            background: 'rgba(139, 92, 246, 0.1)',
            boxSizing: 'border-box',
            pointerEvents: 'none',
            zIndex: 16,
          }}
        />
      )}

      {/* Selection overlay (screen-space) */}
      <ViewportSelectionOverlay
        layers={
          selection.layerIds
            .map((id) => doc.layers[id])
            .filter(Boolean) as Layer[]
        }
        panX={viewport.panX + canvasOffset}
        panY={viewport.panY + canvasOffset}
        zoom={viewport.zoom}
        showHandles={
          activeTool === 'select' &&
          selection.layerIds.length === 1 &&
          interactionMode === 'idle'
        }
        onHandleDown={(e, handle, layerId) => {
          e.preventDefault();
          handleResizeStart(e, handle, layerId);
        }}
      />

      {/* Creation overlay (screen-space */}
      {interactionMode === 'creatingShape' && creationBounds && (
        <CanvasCreationOverlay
          tool={activeTool}
          bounds={creationBounds}
          panX={viewport.panX + canvasOffset}
          panY={viewport.panY + canvasOffset}
          zoom={viewport.zoom}
        />
      )}

      {/* Text inline editor */}
      {editingTextId &&
        (() => {
          const textLayer = doc.layers[editingTextId] as TextLayer;
          if (!textLayer) return null;
          const fill = textLayer.fills?.[0];
          const anchor = textAlignToAnchor(textLayer.textAlign);
          const editorLeft =
            viewport.panX + textLayer.x * viewport.zoom + canvasOffset;
          const editorTop =
            viewport.panY + textLayer.y * viewport.zoom + canvasOffset;
          const editorWidth = textLayer.width * viewport.zoom;
          const editorHeight = textLayer.fontSize * viewport.zoom * 1.5;
          let inputLeft = editorLeft;
          let textAlignStyle: 'left' | 'center' | 'right' = 'left';
          if (anchor === 'middle') {
            inputLeft = editorLeft + editorWidth / 2;
            textAlignStyle = 'center';
          } else if (anchor === 'end') {
            inputLeft = editorLeft + editorWidth;
            textAlignStyle = 'right';
          }
          return (
            <textarea
              ref={textareaRef}
              defaultValue={textLayer.content || ''}
              onBlur={() => finishTextEditing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  finishTextEditing(true);
                } else if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  finishTextEditing(false);
                }
              }}
              style={{
                position: 'absolute',
                left: inputLeft + 'px',
                top: editorTop + 'px',
                width: Math.max(editorWidth, 50) + 'px',
                height: Math.max(editorHeight, 24) + 'px',
                transform:
                  anchor === 'middle'
                    ? 'translateX(-50%)'
                    : anchor === 'end'
                      ? 'translateX(-100%)'
                      : 'none',
                fontSize: textLayer.fontSize * viewport.zoom + 'px',
                fontWeight: textLayer.fontWeight,
                fontFamily: textLayer.fontFamily || 'var(--font-sans)',
                color: fill?.color || '#e4e4e7',
                textAlign: textAlignStyle,
                letterSpacing: textLayer.letterSpacing
                  ? textLayer.letterSpacing * viewport.zoom + 'px'
                  : undefined,
                background: 'transparent',
                border: '1px solid #8b5cf6',
                outline: 'none',
                padding: '0',
                margin: '0',
                resize: 'none',
                overflow: 'visible',
                whiteSpace: 'pre',
                zIndex: 100,
                lineHeight: 1,
                caretColor: '#8b5cf6',
              }}
            />
          );
        })()}
    </div>
  );
}

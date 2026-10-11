import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useEditor } from '@/lib/editor';
import {
  HorizontalRuler,
  VerticalRuler,
  RulerCorner,
  RULER_OFFSET,
} from './Ruler';
import type {
  Layer,
  FrameLayer,
  RectangleLayer,
  EllipseLayer,
  TextLayer,
  GroupLayer,
  StickyNoteLayer,
  LayerTypeString,
  EffectStyle,
  StrokeStyle,
  DesignDocument,
} from '@dt-ai-design/design-schema';
import { createLayer } from '@dt-ai-design/design-schema';
type LayerWithEffects = Layer & { effects?: EffectStyle[] };
// --- Rendering Helpers ---
function getLayerTransform(layer: Layer): string {
  const cx = layer.x + layer.width / 2;
  const cy = layer.y + layer.height / 2;
  const rotation = layer.rotation || 0;
  if (rotation === 0) return '';
  return `rotate(${rotation} ${cx} ${cy})`;
}
function getStrokeDasharray(
  stroke: StrokeStyle | undefined,
): string | undefined {
  if (!stroke || !stroke.style || stroke.style === 'solid') return undefined;
  if (stroke.style === 'dashed')
    return `${stroke.width * 3} ${stroke.width * 2}`;
  if (stroke.style === 'dotted') return `${stroke.width} ${stroke.width * 1.5}`;
  return undefined;
}
function getShadowFilterId(layerId: string): string {
  return `shadow-${layerId}`;
}
function getFilterUrl(layer: Layer): string {
  const effects = (layer as LayerWithEffects).effects;
  if (!effects || effects.length === 0) return '';
  const hasShadow = effects.some((e) => e.type === 'dropShadow');
  if (hasShadow) return `url(#${getShadowFilterId(layer.id)})`;
  return '';
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
function LayerFilters({ layer }: { layer: Layer }) {
  const effects = (layer as LayerWithEffects).effects;
  if (!effects || effects.length === 0) return null;
  const shadows = effects.filter((e) => e.type === 'dropShadow');
  if (shadows.length === 0) return null;
  return (
    <filter
      id={getShadowFilterId(layer.id)}
      x="-50%"
      y="-50%"
      width="200%"
      height="200%"
    >
      {shadows.map((shadow, i: number) => (
        <feDropShadow
          key={i}
          dx={shadow.x || 0}
          dy={shadow.y || 0}
          stdDeviation={(shadow.blur || 0) / 2}
          floodColor={shadow.color || '#000000'}
          floodOpacity={shadow.opacity ?? 0.25}
        />
      ))}
    </filter>
  );
}
// --- Main Canvas Component ---
export function Canvas() {
  const editor = useEditor();
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
  useMemo(
    () => editor.subscribe('toolChange', () => forceUpdate((t) => t + 1)),
    [editor],
  );
  const doc = editor.getDocument();
  const viewport = editor.getViewport();
  const selection = editor.getSelection();
  const activeTool = editor.getActiveTool();
  const showRulers = editor.getShowRulers();
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialPositions: new Map<string, { x: number; y: number }>(),
    moved: false,
  });
  const panStateRef = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  });
  const marqueeRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    initialSelection: [] as string[],
  });
  const resizeRef = useRef({
    active: false,
    handle: '',
    layerId: '',
    startX: 0,
    startY: 0,
    startBounds: { x: 0, y: 0, width: 0, height: 0 },
  });
  const drawRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    layerId: null as string | null,
  });
  const hoveredLayerRef = useRef<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const spacePressedRef = useRef(false);
  const [mouseCanvasPos, setMouseCanvasPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [smartGuides, setSmartGuides] = useState<
    Array<{ type: 'v' | 'h'; pos: number; start: number; end: number }>
  >([]);
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      )
        return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta) return;
      if (e.code === 'Space' && !e.repeat) {
        spacePressedRef.current = true;
        forceUpdate((t) => t + 1);
        return;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressedRef.current = false;
        forceUpdate((t) => t + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [editor]);
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.min(Math.max(viewport.zoom * (1 + delta), 0.1), 16);
      const zoomRatio = newZoom / viewport.zoom;
      const newPanX = mouseX - (mouseX - viewport.panX) * zoomRatio;
      const newPanY = mouseY - (mouseY - viewport.panY) * zoomRatio;
      editor.setViewport({ zoom: newZoom, panX: newPanX, panY: newPanY });
    },
    [editor, viewport],
  );
  const computeSmartGuides = useCallback(
    (movingLayerId: string, newX: number, newY: number) => {
      const guides: Array<{
        type: 'v' | 'h';
        pos: number;
        start: number;
        end: number;
      }> = [];
      const threshold = 5 / viewport.zoom;
      const movingLayer = doc.layers[movingLayerId];
      if (!movingLayer) return guides;
      const newW = movingLayer.width;
      const newH = movingLayer.height;
      const movingEdges = {
        left: newX,
        right: newX + newW,
        centerX: newX + newW / 2,
        top: newY,
        bottom: newY + newH,
        centerY: newY + newH / 2,
      };
      function checkLayer(id: string) {
        if (id === movingLayerId) return;
        const layer = doc.layers[id];
        if (!layer || !layer.visible) return;
        const fixedEdges = {
          left: layer.x,
          right: layer.x + layer.width,
          centerX: layer.x + layer.width / 2,
          top: layer.y,
          bottom: layer.y + layer.height,
          centerY: layer.y + layer.height / 2,
        };
        for (const mk of ['left', 'right', 'centerX'] as const) {
          for (const fk of ['left', 'right', 'centerX'] as const) {
            if (Math.abs(movingEdges[mk] - fixedEdges[fk]) < threshold) {
              guides.push({
                type: 'v',
                pos: fixedEdges[fk],
                start: Math.min(fixedEdges.top, movingEdges.top),
                end: Math.max(fixedEdges.bottom, movingEdges.bottom),
              });
            }
          }
        }
        for (const mk of ['top', 'bottom', 'centerY'] as const) {
          for (const fk of ['top', 'bottom', 'centerY'] as const) {
            if (Math.abs(movingEdges[mk] - fixedEdges[fk]) < threshold) {
              guides.push({
                type: 'h',
                pos: fixedEdges[fk],
                start: Math.min(fixedEdges.left, movingEdges.left),
                end: Math.max(fixedEdges.right, movingEdges.right),
              });
            }
          }
        }
        if (layer.type === 'frame' || layer.type === 'group') {
          const children = (layer as FrameLayer | GroupLayer).children;
          if (children) children.forEach(checkLayer);
        }
      }
      doc.rootLayerIds.forEach(checkLayer);
      return guides;
    },
    [doc, viewport.zoom],
  );
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
          editor.setViewport({ zoom: newZoom, panX: newPanX, panY: newPanY });
        }
        return;
      }
      if (
        e.button === 1 ||
        (e.button === 0 && spacePressedRef.current) ||
        activeTool === 'hand'
      ) {
        panStateRef.current = {
          isPanning: true,
          startX: e.clientX,
          startY: e.clientY,
          startPanX: viewport.panX,
          startPanY: viewport.panY,
        };
        return;
      }
      if (e.button !== 0) return;
      if (['rectangle', 'ellipse', 'frame', 'text'].includes(activeTool)) {
        const toolType = activeTool as LayerTypeString;
        const newLayer = createLayer(toolType as 'rectangle', {
          x: canvasPos.x,
          y: canvasPos.y,
          width: 1,
          height: 1,
        });
        editor.addLayer(toolType, newLayer);
        drawRef.current = {
          active: true,
          startX: canvasPos.x,
          startY: canvasPos.y,
          endX: canvasPos.x,
          endY: canvasPos.y,
          layerId: newLayer.id,
        };
        return;
      }
      if (activeTool === 'select' && e.target === svgRef.current) {
        marqueeRef.current = {
          active: true,
          startX: canvasPos.x,
          startY: canvasPos.y,
          endX: canvasPos.x,
          endY: canvasPos.y,
          initialSelection: e.shiftKey ? [...selection.layerIds] : [],
        };
        if (!e.shiftKey) {
          editor.deselectAll();
        }
        return;
      }
    },
    [editor, viewport, activeTool, selection.layerIds, screenToCanvas],
  );
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setMouseCanvasPos(canvasPos);
      if (panStateRef.current.isPanning) {
        const dx = e.clientX - panStateRef.current.startX;
        const dy = e.clientY - panStateRef.current.startY;
        editor.setViewport({
          panX: panStateRef.current.startPanX + dx,
          panY: panStateRef.current.startPanY + dy,
        });
        return;
      }
      if (marqueeRef.current.active) {
        marqueeRef.current.endX = canvasPos.x;
        marqueeRef.current.endY = canvasPos.y;
        const mx = Math.min(marqueeRef.current.startX, marqueeRef.current.endX);
        const my = Math.min(marqueeRef.current.startY, marqueeRef.current.endY);
        const mw = Math.abs(
          marqueeRef.current.endX - marqueeRef.current.startX,
        );
        const mh = Math.abs(
          marqueeRef.current.endY - marqueeRef.current.startY,
        );
        const intersecting: string[] = [];
        const initial = marqueeRef.current.initialSelection;
        function checkLayers(ids: string[]): void {
          for (const id of ids) {
            const layer = doc.layers[id];
            if (!layer || !layer.visible || layer.locked) continue;
            const layerRight = layer.x + layer.width;
            const layerBottom = layer.y + layer.height;
            const marqueeRight = mx + mw;
            const marqueeBottom = my + mh;
            if (
              layer.x < marqueeRight &&
              layerRight > mx &&
              layer.y < marqueeBottom &&
              layerBottom > my
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
        if (initial.length > 0) {
          const combined = new Set([...initial, ...intersecting]);
          editor.setSelection([...combined]);
        } else {
          editor.setSelection(intersecting);
        }
        forceUpdate((t) => t + 1);
        return;
      }
      if (resizeRef.current.active) {
        const { handle, startBounds, layerId } = resizeRef.current;
        let newX = startBounds.x;
        let newY = startBounds.y;
        let newW = startBounds.width;
        let newH = startBounds.height;
        const dx = canvasPos.x - resizeRef.current.startX;
        const dy = canvasPos.y - resizeRef.current.startY;
        if (handle.includes('r')) {
          newW = Math.max(1, startBounds.width + dx);
        }
        if (handle.includes('l')) {
          newW = Math.max(1, startBounds.width - dx);
          newX = startBounds.x + startBounds.width - newW;
        }
        if (handle.includes('b')) {
          newH = Math.max(1, startBounds.height + dy);
        }
        if (handle.includes('t')) {
          newH = Math.max(1, startBounds.height - dy);
          newY = startBounds.y + startBounds.height - newH;
        }
        if (e.shiftKey && ['tl', 'tr', 'bl', 'br'].includes(handle)) {
          const ratio = startBounds.width / startBounds.height;
          if (Math.abs(newW / newH - ratio) > 0.01) {
            if (Math.abs(dx) > Math.abs(dy)) {
              newH = newW / ratio;
              if (handle.includes('t')) {
                newY = startBounds.y + startBounds.height - newH;
              }
            } else {
              newW = newH * ratio;
              if (handle.includes('l')) {
                newX = startBounds.x + startBounds.width - newW;
              }
            }
          }
        }
        editor.moveLayer(layerId, newX, newY);
        editor.resizeLayer(layerId, newW, newH);
        return;
      }
      if (drawRef.current.active && drawRef.current.layerId) {
        drawRef.current.endX = canvasPos.x;
        drawRef.current.endY = canvasPos.y;
        const x = Math.min(drawRef.current.startX, drawRef.current.endX);
        const y = Math.min(drawRef.current.startY, drawRef.current.endY);
        const w = Math.max(
          1,
          Math.abs(drawRef.current.endX - drawRef.current.startX),
        );
        const h = Math.max(
          1,
          Math.abs(drawRef.current.endY - drawRef.current.startY),
        );
        const layerId = drawRef.current.layerId;
        editor.moveLayer(layerId, x, y);
        editor.resizeLayer(layerId, w, h);
        forceUpdate((t) => t + 1);
        return;
      }
      if (dragStateRef.current.isDragging) {
        const startCanvasPos = screenToCanvas(
          dragStateRef.current.startX,
          dragStateRef.current.startY,
        );
        const dx = canvasPos.x - startCanvasPos.x;
        const dy = canvasPos.y - startCanvasPos.y;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          dragStateRef.current.moved = true;
        }
        if (dragStateRef.current.initialPositions.size === 1) {
          const [firstId, firstPos] = Array.from(
            dragStateRef.current.initialPositions,
          )[0];
          const guides = computeSmartGuides(
            firstId,
            firstPos.x + dx,
            firstPos.y + dy,
          );
          setSmartGuides(guides);
        }
        for (const [layerId, pos] of dragStateRef.current.initialPositions) {
          editor.moveLayer(layerId, pos.x + dx, pos.y + dy);
        }
      }
    },
    [editor, screenToCanvas, doc, activeTool, computeSmartGuides],
  );
  const handleMouseUp = useCallback(() => {
    panStateRef.current.isPanning = false;
    dragStateRef.current.isDragging = false;
    marqueeRef.current.active = false;
    resizeRef.current.active = false;
    setSmartGuides([]);
    if (drawRef.current.active) {
      drawRef.current.active = false;
      if (drawRef.current.layerId) {
        editor.setActiveTool('select');
      }
    }
  }, [editor]);
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
      resizeRef.current = {
        active: true,
        handle,
        layerId,
        startX: canvasPos.x,
        startY: canvasPos.y,
        startBounds: {
          x: layer.x,
          y: layer.y,
          width: layer.width,
          height: layer.height,
        },
      };
    },
    [activeTool, doc, screenToCanvas],
  );
  const handleLayerClick = useCallback(
    (e: React.MouseEvent, layerId: string) => {
      e.stopPropagation();
      if (panStateRef.current.isPanning) return;
      if (activeTool !== 'select') return;
      const layer = doc.layers[layerId];
      if (!layer || layer.locked) return;
      if (e.shiftKey) {
        const current = selection.layerIds;
        if (current.includes(layerId)) {
          editor.setSelection(current.filter((id) => id !== layerId));
        } else {
          editor.setSelection([...current, layerId]);
        }
      } else if (!selection.layerIds.includes(layerId)) {
        editor.setSelection([layerId]);
      }
      dragStateRef.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        initialPositions: new Map(),
        moved: false,
      };
      const sel = selection.layerIds.includes(layerId)
        ? selection.layerIds
        : [layerId];
      for (const id of sel) {
        const l = doc.layers[id];
        if (l) {
          dragStateRef.current.initialPositions.set(id, { x: l.x, y: l.y });
        }
      }
    },
    [doc, selection, editor, activeTool],
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
  const topLevelLayers = useMemo(() => {
    return doc.rootLayerIds.map((id) => doc.layers[id]).filter(Boolean);
  }, [doc]);
  const hoveredId = hoveredLayerRef.current;
  const getCanvasCursor = () => {
    if (panStateRef.current.isPanning) return 'grabbing';
    if (activeTool === 'hand' || spacePressedRef.current) return 'grab';
    if (activeTool === 'zoom') return 'zoom-in';
    if (['rectangle', 'ellipse', 'frame', 'text'].includes(activeTool))
      return 'crosshair';
    return 'default';
  };
  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-bg-canvas"
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
            <RulerCorner />
          </div>
          <div
            className="absolute left-0 z-10"
            style={{ top: RULER_OFFSET, left: 0, width: RULER_OFFSET }}
          >
            <VerticalRuler
              viewport={viewport}
              containerWidth={containerSize.width - RULER_OFFSET}
              containerHeight={containerSize.height - RULER_OFFSET}
              mousePos={mouseCanvasPos}
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
            <HorizontalRuler
              viewport={viewport}
              containerWidth={containerSize.width - RULER_OFFSET}
              containerHeight={containerSize.height - RULER_OFFSET}
              mousePos={mouseCanvasPos}
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
          {/* SVG filter definitions */}
          <defs>
            {topLevelLayers.map((layer) => (
              <LayerFilters key={`f-${layer.id}`} layer={layer} />
            ))}
          </defs>
          {topLevelLayers.map((layer) => (
            <LayerNode
              key={layer.id}
              layer={layer}
              doc={doc}
              selected={selection.layerIds.includes(layer.id)}
              hovered={hoveredId === layer.id}
              onClick={(e) => handleLayerClick(e, layer.id)}
              onDoubleClick={(e) => handleTextDoubleClick(e, layer.id)}
              onMouseEnter={() => handleLayerEnter(layer.id)}
              onMouseLeave={handleLayerLeave}
            />
          ))}
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
          {/* Selection handles */}
          {selection.layerIds.map((id) => {
            const layer = doc.layers[id];
            if (!layer) return null;
            return (
              <SelectionHandles
                key={id}
                layer={layer}
                onHandleDown={(e, handle) => handleResizeStart(e, handle, id)}
                showHandles={
                  activeTool === 'select' && selection.layerIds.length === 1
                }
                zoom={viewport.zoom}
              />
            );
          })}
          {/* Marquee selection */}
          {marqueeRef.current.active &&
            (() => {
              const mx = Math.min(
                marqueeRef.current.startX,
                marqueeRef.current.endX,
              );
              const my = Math.min(
                marqueeRef.current.startY,
                marqueeRef.current.endY,
              );
              const mw = Math.abs(
                marqueeRef.current.endX - marqueeRef.current.startX,
              );
              const mh = Math.abs(
                marqueeRef.current.endY - marqueeRef.current.startY,
              );
              return (
                <rect
                  x={mx}
                  y={my}
                  width={mw}
                  height={mh}
                  fill="rgba(139, 92, 246, 0.1)"
                  stroke="#8b5cf6"
                  strokeWidth={1 / viewport.zoom}
                  strokeDasharray={`${4 / viewport.zoom} ${2 / viewport.zoom}`}
                  style={{ pointerEvents: 'none' }}
                />
              );
            })()}
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
// --- Layer Node Components ---
interface LayerNodeProps {
  layer: Layer;
  doc: DesignDocument;
  selected: boolean;
  hovered: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}
function LayerNode({
  layer,
  doc,
  selected,
  hovered,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
}: LayerNodeProps) {
  if (!layer.visible) return null;
  if (layer.type === 'frame') {
    return (
      <FrameLayerNode
        layer={layer as FrameLayer}
        doc={doc}
        selected={selected}
        hovered={hovered}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }
  if (layer.type === 'group') {
    return (
      <GroupLayerNode
        layer={layer as GroupLayer}
        doc={doc}
        selected={selected}
        hovered={hovered}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }
  if (layer.type === 'rectangle') {
    return (
      <RectangleLayerNode
        layer={layer as RectangleLayer}
        selected={selected}
        hovered={hovered}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }
  if (layer.type === 'ellipse') {
    return (
      <EllipseLayerNode
        layer={layer as EllipseLayer}
        selected={selected}
        hovered={hovered}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }
  if (layer.type === 'text') {
    return (
      <TextLayerNode
        layer={layer as TextLayer}
        selected={selected}
        hovered={hovered}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }
  if (layer.type === 'stickyNote') {
    return (
      <StickyNoteLayerNode
        layer={layer as StickyNoteLayer}
        selected={selected}
        hovered={hovered}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }
  return (
    <rect
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      fill="#666"
      opacity={layer.opacity}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: layer.locked ? 'not-allowed' : 'move' }}
    />
  );
}
function FrameLayerNode({
  layer,
  doc,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
}: {
  layer: FrameLayer;
  doc: DesignDocument;
  selected: boolean;
  hovered: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const fill = layer.fills?.[0];
  const stroke = layer.strokes?.[0];
  const transform = getLayerTransform(layer);
  const filter = getFilterUrl(layer);
  const strokeDasharray = getStrokeDasharray(stroke);
  return (
    <g
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      transform={transform}
      style={{ cursor: layer.locked ? 'not-allowed' : 'move' }}
    >
      <rect
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        fill={fill?.color || '#1e1e24'}
        stroke={stroke?.color || 'transparent'}
        strokeWidth={stroke?.width || 0}
        strokeDasharray={strokeDasharray}
        rx={layer.cornerRadius || 0}
        ry={layer.cornerRadius || 0}
        opacity={layer.opacity}
        filter={filter || undefined}
      />
      {layer.children?.map((childId: string) => {
        const child = doc.layers[childId];
        if (!child) return null;
        return (
          <LayerNode
            key={childId}
            layer={child}
            doc={doc}
            selected={false}
            hovered={false}
            onClick={(e) => {
              e.stopPropagation();
              onClick(e);
            }}
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
          />
        );
      })}
      <text
        x={layer.x + 4}
        y={layer.y - 6}
        fontSize={11}
        fill="#6b7280"
        fontFamily="var(--font-sans)"
      >
        {layer.name}
      </text>
    </g>
  );
}
function GroupLayerNode({
  layer,
  doc,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
}: {
  layer: GroupLayer;
  doc: DesignDocument;
  selected: boolean;
  hovered: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const transform = getLayerTransform(layer);
  const filter = getFilterUrl(layer);
  return (
    <g
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      transform={transform}
      style={{ cursor: layer.locked ? 'not-allowed' : 'move' }}
      opacity={layer.opacity}
      filter={filter || undefined}
    >
      {layer.children?.map((childId: string) => {
        const child = doc.layers[childId];
        if (!child) return null;
        return (
          <LayerNode
            key={childId}
            layer={child}
            doc={doc}
            selected={false}
            hovered={false}
            onClick={(e) => {
              e.stopPropagation();
              onClick(e);
            }}
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
          />
        );
      })}
    </g>
  );
}
function RectangleLayerNode({
  layer,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
}: {
  layer: RectangleLayer;
  selected: boolean;
  hovered: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const fill = layer.fills?.[0];
  const stroke = layer.strokes?.[0];
  const transform = getLayerTransform(layer);
  const filter = getFilterUrl(layer);
  const strokeDasharray = getStrokeDasharray(stroke);
  return (
    <g transform={transform} onDoubleClick={onDoubleClick}>
      <rect
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        fill={fill?.color || 'transparent'}
        fillOpacity={fill?.opacity ?? layer.opacity}
        stroke={stroke?.color || 'transparent'}
        strokeWidth={stroke?.width || 0}
        strokeDasharray={strokeDasharray}
        rx={layer.cornerRadius || 0}
        ry={layer.cornerRadius || 0}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ cursor: layer.locked ? 'not-allowed' : 'move' }}
        filter={filter || undefined}
      />
    </g>
  );
}
function EllipseLayerNode({
  layer,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
}: {
  layer: EllipseLayer;
  selected: boolean;
  hovered: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const fill = layer.fills?.[0];
  const stroke = layer.strokes?.[0];
  const cx = layer.x + layer.width / 2;
  const cy = layer.y + layer.height / 2;
  const rx = layer.width / 2;
  const ry = layer.height / 2;
  const transform = getLayerTransform(layer);
  const filter = getFilterUrl(layer);
  const strokeDasharray = getStrokeDasharray(stroke);
  return (
    <g transform={transform}>
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={fill?.color || 'transparent'}
        fillOpacity={fill?.opacity ?? layer.opacity}
        stroke={stroke?.color || 'transparent'}
        strokeWidth={stroke?.width || 0}
        strokeDasharray={strokeDasharray}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ cursor: layer.locked ? 'not-allowed' : 'move' }}
        filter={filter || undefined}
      />
    </g>
  );
}
function TextLayerNode({
  layer,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
}: {
  layer: TextLayer;
  selected: boolean;
  hovered: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const fill = layer.fills?.[0];
  const transform = getLayerTransform(layer);
  const filter = getFilterUrl(layer);
  const anchor = textAlignToAnchor(layer.textAlign);
  const textX =
    anchor === 'middle'
      ? layer.x + layer.width / 2
      : anchor === 'end'
        ? layer.x + layer.width
        : layer.x;
  return (
    <g transform={transform} onDoubleClick={onDoubleClick}>
      <text
        x={textX}
        y={layer.y + layer.fontSize}
        fontSize={layer.fontSize}
        fontWeight={layer.fontWeight}
        fontFamily={layer.fontFamily || 'var(--font-sans)'}
        fill={fill?.color || '#e4e4e7'}
        opacity={layer.opacity}
        textAnchor={anchor}
        style={{
          cursor: layer.locked ? 'not-allowed' : 'move',
          userSelect: 'none',
          letterSpacing: layer.letterSpacing
            ? `${layer.letterSpacing}px`
            : undefined,
          textDecoration:
            layer.textDecoration === 'none' ? undefined : layer.textDecoration,
          textTransform: layer.textTransform || undefined,
        }}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        filter={filter || undefined}
      >
        {layer.content || 'Text'}
      </text>
    </g>
  );
}
function StickyNoteLayerNode({
  layer,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
}: {
  layer: StickyNoteLayer;
  selected: boolean;
  hovered: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const transform = getLayerTransform(layer);
  const filter = getFilterUrl(layer);
  return (
    <g
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      transform={transform}
      style={{ cursor: layer.locked ? 'not-allowed' : 'move' }}
      opacity={layer.opacity}
      filter={filter || undefined}
    >
      <rect
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        fill={layer.color || '#f59e0b'}
        rx={4}
        ry={4}
      />
      <text
        x={layer.x + 8}
        y={layer.y + layer.fontSize + 8}
        fontSize={layer.fontSize}
        fill={layer.textColor || '#1f2937'}
        fontFamily="var(--font-sans)"
      >
        {layer.content || ''}
      </text>
    </g>
  );
}
// --- Selection Handles ---
function SelectionHandles({
  layer,
  onHandleDown,
  showHandles,
  zoom,
}: {
  layer: Layer;
  onHandleDown: (e: React.MouseEvent, handle: string) => void;
  showHandles: boolean;
  zoom: number;
}) {
  const transform = getLayerTransform(layer);
  const x = layer.x;
  const y = layer.y;
  const w = layer.width;
  const h = layer.height;
  const handleSize = 6 / zoom;
  const handles = [
    {
      id: 'tl',
      x: x - handleSize / 2,
      y: y - handleSize / 2,
      cursor: 'nwse-resize',
    },
    {
      id: 'tr',
      x: x + w - handleSize / 2,
      y: y - handleSize / 2,
      cursor: 'nesw-resize',
    },
    {
      id: 'bl',
      x: x - handleSize / 2,
      y: y + h - handleSize / 2,
      cursor: 'nesw-resize',
    },
    {
      id: 'br',
      x: x + w - handleSize / 2,
      y: y + h - handleSize / 2,
      cursor: 'nwse-resize',
    },
    {
      id: 'tc',
      x: x + w / 2 - handleSize / 2,
      y: y - handleSize / 2,
      cursor: 'ns-resize',
    },
    {
      id: 'bc',
      x: x + w / 2 - handleSize / 2,
      y: y + h - handleSize / 2,
      cursor: 'ns-resize',
    },
    {
      id: 'ml',
      x: x - handleSize / 2,
      y: y + h / 2 - handleSize / 2,
      cursor: 'ew-resize',
    },
    {
      id: 'mr',
      x: x + w - handleSize / 2,
      y: y + h / 2 - handleSize / 2,
      cursor: 'ew-resize',
    },
  ];
  return (
    <g transform={transform} style={{ pointerEvents: 'none' }}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="none"
        stroke="#8b5cf6"
        strokeWidth={1.5 / zoom}
        strokeDasharray={`${4 / zoom} ${2 / zoom}`}
      />
      {showHandles &&
        handles.map((h) => (
          <rect
            key={h.id}
            x={h.x}
            y={h.y}
            width={handleSize}
            height={handleSize}
            fill="#141418"
            stroke="#8b5cf6"
            strokeWidth={1 / zoom}
            style={{ pointerEvents: 'auto', cursor: h.cursor }}
            onMouseDown={(e) => onHandleDown(e, h.id)}
          />
        ))}
    </g>
  );
}

import type { CSSProperties } from 'react';
import type { Layer } from '@dt-ai-design/design-schema';

export interface ViewportSelectionOverlayProps {
  layers: Layer[];
  panX: number;
  panY: number;
  zoom: number;
  offsetX?: number;
  offsetY?: number;
  showHandles?: boolean;
  onHandleDown?: (e: React.MouseEvent, handle: string, layerId: string) => void;
  onSelectionDown?: (e: React.MouseEvent) => void;
}

const HANDLE_SIZE = 6;

const HANDLE_POSITIONS = [
  { id: 'tl', x: -0.5, y: -0.5, cursor: 'nwse-resize' },
  { id: 'tr', x: 0.5, y: -0.5, cursor: 'nesw-resize' },
  { id: 'bl', x: -0.5, y: 0.5, cursor: 'nesw-resize' },
  { id: 'br', x: 0.5, y: 0.5, cursor: 'nwse-resize' },
  { id: 'tc', x: 0, y: -0.5, cursor: 'ns-resize' },
  { id: 'bc', x: 0, y: 0.5, cursor: 'ns-resize' },
  { id: 'ml', x: -0.5, y: 0, cursor: 'ew-resize' },
  { id: 'mr', x: 0.5, y: 0, cursor: 'ew-resize' },
];

/**
 * Screen-space selection overlay with selection outline and resize handles.
 *
 * Lives outside the SVG so handles stay at a constant pixel size
 * and get crisp rendering regardless of zoom level.
 */
export function ViewportSelectionOverlay({
  layers,
  panX,
  panY,
  zoom,
  offsetX = 0,
  offsetY = 0,
  showHandles = true,
  onHandleDown,
}: ViewportSelectionOverlayProps) {
  if (layers.length === 0) return null;

  return (
    <>
      {layers.map((layer) => {
        const screenX = layer.x * zoom + panX + offsetX;
        const screenY = layer.y * zoom + panY + offsetY;
        const screenW = layer.width * zoom;
        const screenH = layer.height * zoom;
        const hasRotation = (layer.rotation || 0) !== 0;

        const outlineStyle: CSSProperties = {
          position: 'absolute',
          left: `${screenX}px`,
          top: `${screenY}px`,
          width: `${screenW}px`,
          height: `${screenH}px`,
          border: '1.5px dashed #8b5cf6',
          boxSizing: 'border-box',
          pointerEvents: 'none',
          zIndex: 15,
          transformOrigin: 'center center',
          transform: hasRotation ? `rotate(${layer.rotation}deg)` : undefined,
        };

        return (
          <div key={layer.id} style={outlineStyle} aria-hidden="true">
            {showHandles &&
              layers.length === 1 &&
              HANDLE_POSITIONS.map((h) => {
                const hx = screenW / 2 + h.x * (screenW + HANDLE_SIZE);
                const hy = screenH / 2 + h.y * (screenH + HANDLE_SIZE);
                const handleStyle: CSSProperties = {
                  position: 'absolute',
                  left: `${hx - HANDLE_SIZE / 2}px`,
                  top: `${hy - HANDLE_SIZE / 2}px`,
                  width: `${HANDLE_SIZE}px`,
                  height: `${HANDLE_SIZE}px`,
                  background: '#141418',
                  border: '1px solid #8b5cf6',
                  boxSizing: 'border-box',
                  cursor: h.cursor,
                  pointerEvents: 'auto',
                };
                return (
                  <div
                    key={h.id}
                    style={handleStyle}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onHandleDown?.(e, h.id, layer.id);
                    }}
                  />
                );
              })}
          </div>
        );
      })}
    </>
  );
}

import type { CSSProperties } from 'react';
import type {
  CreationBounds,
  CanvasToolId,
} from '@dt-ai-design/editor-interaction';

export interface CanvasCreationOverlayProps {
  tool: CanvasToolId;
  bounds: CreationBounds;
  panX: number;
  panY: number;
  zoom: number;
  offsetX?: number;
  offsetY?: number;
}

/**
 * Screen-space overlay for shape creation preview.
 *
 * Renders a dashed rectangle that follows the mouse when creating shapes.
 * Lives outside the SVG so it stays crisp regardless of zoom level.
 */
export function CanvasCreationOverlay({
  tool,
  bounds,
  panX,
  panY,
  zoom,
  offsetX = 0,
  offsetY = 0,
}: CanvasCreationOverlayProps) {
  const screenX = bounds.x * zoom + panX + offsetX;
  const screenY = bounds.y * zoom + panY + offsetY;
  const screenW = bounds.width * zoom;
  const screenH = bounds.height * zoom;

  const style: CSSProperties = {
    position: 'absolute',
    left: `${screenX}px`,
    top: `${screenY}px`,
    width: `${Math.max(screenW, 0)}px`,
    height: `${Math.max(screenH, 0)}px`,
    border: '1px dashed #8b5cf6',
    background: 'rgba(139, 92, 246, 0.12)',
    pointerEvents: 'none',
    zIndex: 20,
    boxSizing: 'border-box',
  };

  let shapeStyle: CSSProperties = {};

  if (tool === 'ellipse') {
    shapeStyle = { borderRadius: '50%' };
  } else if (tool === 'rectangle' || tool === 'frame') {
    shapeStyle = {};
  }

  return <div style={{ ...style, ...shapeStyle }} aria-hidden="true" />;
}

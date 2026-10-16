import type { CSSProperties } from 'react';

import type {
  Layer,
  FrameLayer,
  RectangleLayer,
  EllipseLayer,
  PolygonLayer,
  TextLayer,
  GroupLayer,
  StickyNoteLayer,
  BrowserLayer,
  StrokeStyle,
  EffectStyle,
  CornerRadius,
  DesignDocument,
} from '@dt-ai-design/design-schema';

type LayerWithEffects = Layer & { effects?: EffectStyle[] };

export interface CanvasDocumentRendererProps {
  doc: DesignDocument;
  selectedIds: string[];
  hoveredId: string | null;
  onLayerClick: (e: React.MouseEvent, layerId: string) => void;
  onLayerDoubleClick: (e: React.MouseEvent, layerId: string) => void;
  onLayerEnter: (layerId: string) => void;
  onLayerLeave: () => void;
}

// ─── Rendering Helpers ───

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

function getCornerRadius(value: CornerRadius): number {
  return typeof value === 'number' ? value : (value?.topLeft ?? 0);
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

// ─── Layer Node Components ───

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

  const common = { onClick, onDoubleClick, onMouseEnter, onMouseLeave };

  switch (layer.type) {
    case 'frame':
      return (
        <FrameLayerNode
          layer={layer as FrameLayer}
          doc={doc}
          selected={selected}
          hovered={hovered}
          {...common}
        />
      );
    case 'group':
      return (
        <GroupLayerNode
          layer={layer as GroupLayer}
          doc={doc}
          selected={selected}
          hovered={hovered}
          {...common}
        />
      );
    case 'rectangle':
      return (
        <RectangleLayerNode
          layer={layer as RectangleLayer}
          selected={selected}
          hovered={hovered}
          {...common}
        />
      );
    case 'ellipse':
      return (
        <EllipseLayerNode
          layer={layer as EllipseLayer}
          selected={selected}
          hovered={hovered}
          {...common}
        />
      );
    case 'polygon':
      return (
        <PolygonLayerNode
          layer={layer as PolygonLayer}
          selected={selected}
          hovered={hovered}
          {...common}
        />
      );
    case 'browser':
      return (
        <BrowserLayerNode
          layer={layer as BrowserLayer}
          selected={selected}
          hovered={hovered}
          {...common}
        />
      );
    case 'text':
      return (
        <TextLayerNode
          layer={layer as TextLayer}
          selected={selected}
          hovered={hovered}
          {...common}
        />
      );
    case 'stickyNote':
      return (
        <StickyNoteLayerNode
          layer={layer as StickyNoteLayer}
          selected={selected}
          hovered={hovered}
          {...common}
        />
      );
    default:
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
        rx={getCornerRadius(layer.cornerRadius)}
        ry={getCornerRadius(layer.cornerRadius)}
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
        rx={getCornerRadius(layer.cornerRadius)}
        ry={getCornerRadius(layer.cornerRadius)}
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

function polygonPoints(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  count: number,
): string {
  const n = Math.max(3, Math.min(60, Math.round(count) || 3));
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    pts.push(`${cx + rx * Math.cos(angle)},${cy + ry * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

function PolygonLayerNode({
  layer,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
}: {
  layer: PolygonLayer;
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
  const transform = getLayerTransform(layer);
  const filter = getFilterUrl(layer);
  const strokeDasharray = getStrokeDasharray(stroke);

  return (
    <g transform={transform}>
      <polygon
        points={polygonPoints(
          cx,
          cy,
          layer.width / 2,
          layer.height / 2,
          layer.polygonCount,
        )}
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

function BrowserLayerNode({
  layer,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
}: {
  layer: BrowserLayer;
  selected: boolean;
  hovered: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const transform = getLayerTransform(layer);

  return (
    <g transform={transform}>
      <foreignObject
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        style={{ pointerEvents: 'none' }}
        opacity={layer.opacity}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            background: '#ffffff',
            borderRadius: 4,
          }}
        >
          {layer.url ? (
            <iframe
              src={layer.url}
              title={layer.name}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                zoom: layer.zoom || 1,
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
              }}
            >
              Browser · 设置 URL
            </div>
          )}
        </div>
      </foreignObject>
      <rect
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        fill="transparent"
        stroke="rgba(124,58,237,0.4)"
        strokeWidth={1}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ cursor: layer.locked ? 'not-allowed' : 'move' }}
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

  const textStyle: CSSProperties = {
    cursor: layer.locked ? 'not-allowed' : 'move',
    userSelect: 'none',
    letterSpacing: layer.letterSpacing ? `${layer.letterSpacing}px` : undefined,
    textDecoration:
      layer.textDecoration === 'none' ? undefined : layer.textDecoration,
    textTransform: layer.textTransform || undefined,
  };

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
        style={textStyle}
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

// ─── Document Renderer (Main Export) ───

/**
 * Pure SVG renderer for the canvas document.
 *
 * Renders all layers from the document tree. No interaction state is kept here --
 * all user input events are forwarded via props to the parent.
 */
export function CanvasDocumentRenderer({
  doc,
  selectedIds,
  hoveredId,
  onLayerClick,
  onLayerDoubleClick,
  onLayerEnter,
  onLayerLeave,
}: CanvasDocumentRendererProps) {
  const topLevelLayers = doc.rootLayerIds
    .map((id) => doc.layers[id])
    .filter(Boolean);

  return (
    <>
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
          selected={selectedIds.includes(layer.id)}
          hovered={hoveredId === layer.id}
          onClick={(e) => onLayerClick(e, layer.id)}
          onDoubleClick={(e) => onLayerDoubleClick(e, layer.id)}
          onMouseEnter={() => onLayerEnter(layer.id)}
          onMouseLeave={onLayerLeave}
        />
      ))}
    </>
  );
}

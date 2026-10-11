import type { Viewport } from '@dt-ai-design/editor-core';

interface RulerProps {
  viewport: Viewport;
  containerWidth: number;
  containerHeight: number;
  mousePos: { x: number; y: number } | null;
}

const RULER_SIZE = 22;

// Calculate appropriate tick spacing based on zoom level
function getTickStep(zoom: number): number {
  const targetPixelsPerTick = 80;
  const rawStep = targetPixelsPerTick / zoom;
  const niceSteps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
  for (const step of niceSteps) {
    if (step >= rawStep) return step;
  }
  return 5000;
}

function getMinorTickStep(majorStep: number): number {
  if (majorStep >= 100) return majorStep / 10;
  if (majorStep >= 10) return majorStep / 5;
  return majorStep / 2;
}

export function HorizontalRuler({
  viewport,
  containerWidth,
  mousePos,
}: RulerProps) {
  const { zoom, panX } = viewport;
  const step = getTickStep(zoom);
  const minorStep = getMinorTickStep(step);

  // Calculate visible range in canvas coordinates
  const startX = -panX / zoom;
  const endX = (containerWidth - panX) / zoom;

  // Round start to nearest step
  const firstMajor = Math.floor(startX / step) * step;
  const firstMinor = Math.floor(startX / minorStep) * minorStep;

  const ticks = [];
  const minorTicks = [];

  // Major ticks with labels
  for (let val = firstMajor; val <= endX; val += step) {
    const screenX = val * zoom + panX + RULER_SIZE;
    const label = Math.round(val);
    ticks.push(
      <g key={`major-${val}`}>
        <line
          x1={screenX}
          y1={RULER_SIZE}
          x2={screenX}
          y2={RULER_SIZE - 8}
          stroke="var(--color-border-strong)"
          strokeWidth={1}
        />
        <text
          x={screenX + 3}
          y={12}
          fill="var(--color-text-tertiary)"
          fontSize="10"
          fontFamily="var(--font-mono)"
        >
          {label}
        </text>
      </g>,
    );
  }

  // Minor ticks
  for (let val = firstMinor; val <= endX; val += minorStep) {
    const screenX = val * zoom + panX + RULER_SIZE;
    const isMajor = Math.abs(val % step) < 0.001;
    if (!isMajor) {
      minorTicks.push(
        <line
          key={`minor-${val}`}
          x1={screenX}
          y1={RULER_SIZE}
          x2={screenX}
          y2={RULER_SIZE - 4}
          stroke="var(--color-border)"
          strokeWidth={1}
        />,
      );
    }
  }

  return (
    <div className="pointer-events-none absolute left-5 top-0 right-0 z-10 h-5 border-b border-border bg-bg-panel-deep">
      <svg className="h-full w-full overflow-hidden">
        {minorTicks}
        {ticks}
        {mousePos && (
          <line
            x1={mousePos.x + RULER_SIZE}
            y1={0}
            x2={mousePos.x + RULER_SIZE}
            y2={RULER_SIZE}
            stroke="#8b5cf6"
            strokeWidth={1}
          />
        )}
      </svg>
    </div>
  );
}

export function VerticalRuler({
  viewport,
  containerHeight,
  mousePos,
}: RulerProps) {
  const { zoom, panY } = viewport;
  const step = getTickStep(zoom);
  const minorStep = getMinorTickStep(step);

  const startY = -panY / zoom;
  const endY = (containerHeight - panY) / zoom;

  const firstMajor = Math.floor(startY / step) * step;
  const firstMinor = Math.floor(startY / minorStep) * minorStep;

  const ticks = [];
  const minorTicks = [];

  for (let val = firstMajor; val <= endY; val += step) {
    const screenY = val * zoom + panY + RULER_SIZE;
    const label = Math.round(val);
    ticks.push(
      <g key={`major-${val}`}>
        <line
          x1={RULER_SIZE}
          y1={screenY}
          x2={RULER_SIZE - 8}
          y2={screenY}
          stroke="var(--color-border-strong)"
          strokeWidth={1}
        />
        <text
          x={2}
          y={screenY + 3}
          fill="var(--color-text-tertiary)"
          fontSize="10"
          fontFamily="var(--font-mono)"
          transform={`rotate(-90, 2, ${screenY + 3})`}
        >
          {label}
        </text>
      </g>,
    );
  }

  for (let val = firstMinor; val <= endY; val += minorStep) {
    const screenY = val * zoom + panY + RULER_SIZE;
    const isMajor = Math.abs(val % step) < 0.001;
    if (!isMajor) {
      minorTicks.push(
        <line
          key={`minor-${val}`}
          x1={RULER_SIZE}
          y1={screenY}
          x2={RULER_SIZE - 4}
          y2={screenY}
          stroke="var(--color-border)"
          strokeWidth={1}
        />,
      );
    }
  }

  return (
    <div className="pointer-events-none absolute left-0 top-5 bottom-0 z-10 w-5 border-r border-border bg-bg-panel-deep">
      <svg className="h-full w-full overflow-hidden">
        {minorTicks}
        {ticks}
        {mousePos && (
          <line
            x1={0}
            y1={mousePos.y + RULER_SIZE}
            x2={RULER_SIZE}
            y2={mousePos.y + RULER_SIZE}
            stroke="#8b5cf6"
            strokeWidth={1}
          />
        )}
      </svg>
    </div>
  );
}

export function RulerCorner() {
  return (
    <div className="absolute left-0 top-0 z-20 h-5 w-5 border-b border-r border-border bg-bg-panel-deep" />
  );
}

export const RULER_OFFSET = RULER_SIZE;

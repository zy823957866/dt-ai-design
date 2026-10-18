import { MousePointer2 } from 'lucide-react';
import type { ReactNode } from 'react';

import type { DesignDocument } from '@dt-ai-design/design-schema';

import { useEditor } from '@/lib/editor';
import { useGenerationController } from '@/lib/generation';
import type { CanvasAgentItem } from '@/lib/useCanvasAgent';

import { getAgentVisual } from './agents';

export interface CanvasAgentOverlayProps {
  zoom: number;
  panX: number;
  panY: number;
  offset: number;
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 沿父链累加得到节点在文档坐标系的包围盒。 */
const absoluteBounds = (doc: DesignDocument, id: string): Bounds | null => {
  const layer = doc.layers[id];
  if (!layer) return null;
  let x = layer.x;
  let y = layer.y;
  let parentId = layer.parentId;
  while (parentId) {
    const parent = doc.layers[parentId];
    if (!parent) break;
    x += parent.x;
    y += parent.y;
    parentId = parent.parentId;
  }
  return { x, y, width: layer.width, height: layer.height };
};

const firstRefId = (item?: CanvasAgentItem): string | undefined => {
  if (!item || item.kind !== 'tool' || !item.refs) return undefined;
  const ids = Object.values(item.refs);
  return ids[ids.length - 1];
};

interface ActiveAgent {
  agentId: string;
  regionId?: string;
  item?: CanvasAgentItem;
}

/**
 * 生成过程可视化（屏幕空间，Pencil 风格）。
 *
 * 单/多智能体各一个光标（指针 + 名字胶囊，orbit 动画），并在其正在绘制的
 * 区域上叠加「发光描边 + 扫过式扫描线」。
 */
export function CanvasAgentOverlay({
  zoom,
  panX,
  panY,
  offset,
}: CanvasAgentOverlayProps) {
  const editor = useEditor();
  const { items, agents, isRunning } = useGenerationController();

  if (!isRunning) return null;

  const doc = editor.getDocument();

  const active = new Map<string, ActiveAgent>();
  for (const agent of agents) {
    active.set(agent.agentId, {
      agentId: agent.agentId,
      regionId: agent.regionId,
    });
  }
  for (const item of items) {
    if (item.kind !== 'tool' || !item.agentId) continue;
    const current: ActiveAgent = active.get(item.agentId) ?? {
      agentId: item.agentId,
    };
    current.regionId = current.regionId ?? item.regionId;
    current.item = item;
    active.set(item.agentId, current);
  }
  if (active.size === 0) active.set('designer', { agentId: 'designer' });

  const layers: ReactNode[] = [];

  for (const agent of active.values()) {
    const regionId = agent.regionId;
    let bounds = regionId ? absoluteBounds(doc, regionId) : null;
    if (!bounds) {
      const refId = firstRefId(agent.item);
      bounds = refId ? absoluteBounds(doc, refId) : null;
    }
    if (!bounds) {
      const pageId = doc.rootLayerIds.find(
        (id) => doc.layers[id]?.type === 'frame',
      );
      bounds = pageId ? absoluteBounds(doc, pageId) : null;
    }
    if (!bounds) continue;

    const visual = getAgentVisual(agent.agentId);
    const color = visual.color;
    const screenX = bounds.x * zoom + panX + offset;
    const screenY = bounds.y * zoom + panY + offset;
    const screenW = Math.max(bounds.width * zoom, 8);
    const screenH = Math.max(bounds.height * zoom, 8);
    const running =
      !agent.item ||
      (agent.item.kind === 'tool' && agent.item.status === 'running');

    layers.push(
      <div
        key={agent.agentId}
        style={{
          position: 'absolute',
          left: `${screenX}px`,
          top: `${screenY}px`,
          width: `${screenW}px`,
          height: `${screenH}px`,
          pointerEvents: 'none',
          zIndex: 18,
        }}
      >
        {/* 发光描边 */}
        <div
          className="editor-agent-scan-border"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '6px',
            border: `1.5px solid ${color}`,
            boxShadow: `0 0 0 1px ${color}33, 0 0 18px ${color}66`,
          }}
        />
        {/* 扫过式扫描线（被区域裁切） */}
        {running && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              className="editor-agent-scan-sweep"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '28%',
                background: `linear-gradient(180deg, transparent, ${color}55, transparent)`,
              }}
            />
          </div>
        )}
        {/* 光标 + 名字胶囊 */}
        <div
          className="editor-agent-cursor-orbit"
          style={{
            position: 'absolute',
            left: `${screenW * 0.5}px`,
            top: `${screenH * 0.5}px`,
          }}
        >
          <MousePointer2
            aria-hidden="true"
            size={18}
            fill={color}
            stroke="#ffffff"
            strokeWidth={1.5}
            style={{ filter: 'drop-shadow(0 1px 2px #00000033)' }}
          />
          <span
            style={{
              position: 'absolute',
              top: '14px',
              left: '12px',
              whiteSpace: 'nowrap',
              backgroundColor: color,
              color: '#ffffff',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '11px',
              lineHeight: '14px',
              fontWeight: 500,
              boxShadow: '0 2px 7px #0000001f',
            }}
          >
            {visual.name}
          </span>
        </div>
      </div>,
    );
  }

  if (layers.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      data-agent-overlay="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      {layers}
    </div>
  );
}

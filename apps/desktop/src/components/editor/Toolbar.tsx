import {
  MousePointer2,
  Hand,
  Square,
  Circle,
  Triangle,
  Frame,
  Type,
  StickyNote,
  PenTool,
} from 'lucide-react';
import { useEditor } from '@/lib/editor';
import type { LayerTypeString } from '@dt-ai-design/design-schema';

interface ToolItem {
  id: string;
  icon: typeof Square;
  label: string;
  creates?: LayerTypeString;
}

const tools: ToolItem[] = [
  { id: 'select', icon: MousePointer2, label: 'Move' },
  { id: 'hand', icon: Hand, label: 'Hand' },
  { id: 'rectangle', icon: Square, label: 'Rectangle', creates: 'rectangle' },
  { id: 'ellipse', icon: Circle, label: 'Ellipse', creates: 'ellipse' },
  { id: 'triangle', icon: Triangle, label: 'Triangle' },
  { id: 'frame', icon: Frame, label: 'Frame', creates: 'frame' },
  { id: 'text', icon: Type, label: 'Text', creates: 'text' },
  { id: 'sticky', icon: StickyNote, label: 'Sticky' },
  { id: 'pen', icon: PenTool, label: 'Pen' },
];

export function Toolbar() {
  const editor = useEditor();
  const activeTool = editor.getActiveTool();

  const handleTool = (tool: ToolItem) => {
    if (tool.creates) {
      const viewport = editor.getViewport();
      const centerX = -viewport.panX / viewport.zoom + 400 / viewport.zoom;
      const centerY = -viewport.panY / viewport.zoom + 300 / viewport.zoom;
      const defaults: Record<
        string,
        { width: number; height: number; fill?: string }
      > = {
        rectangle: { width: 100, height: 80, fill: '#7C3AED' },
        ellipse: { width: 100, height: 80, fill: '#7C3AED' },
        frame: { width: 300, height: 200 },
        text: { width: 120, height: 30 },
      };
      const d = defaults[tool.creates] || { width: 100, height: 80 };
      editor.addLayer(tool.creates, {
        x: centerX - d.width / 2,
        y: centerY - d.height / 2,
        width: d.width,
        height: d.height,
        name: `${tool.creates.charAt(0).toUpperCase() + tool.creates.slice(1)} ${Date.now()}`,
        ...(d.fill ? { fill: { type: 'solid', color: d.fill } } : {}),
      } as never);
    }
    editor.setActiveTool(tool.id);
  };

  return (
    <div className="absolute left-[34px] top-7 z-30 flex h-[283px] w-[109px] flex-col gap-[2px] rounded-xl border border-border bg-bg-panel p-1.5 shadow-popover">
      {tools.map((tool, i) => {
        const Icon = tool.icon;
        const selected = activeTool === tool.id;
        return (
          <div key={tool.id}>
            {i === 2 && (
              <div className="mx-auto my-0.5 h-px w-[22px] bg-border" />
            )}
            <button
              type="button"
              onClick={() => handleTool(tool)}
              className={`flex h-[27px] items-center gap-1.5 rounded-md pl-2.5 pr-2 text-xs transition-colors ${
                selected
                  ? 'bg-accent-soft text-accent-text'
                  : 'text-text-secondary hover:bg-bg-hover'
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${selected ? 'text-accent-strong' : ''}`}
              />
              {tool.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}

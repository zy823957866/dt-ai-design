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
  ZoomIn,
} from 'lucide-react';
import { useEditorInteraction } from './EditorInteractionProvider';

interface ToolItem {
  id: string;
  icon: typeof Square;
  label: string;
}

const tools: ToolItem[] = [
  { id: 'select', icon: MousePointer2, label: 'Move' },
  { id: 'hand', icon: Hand, label: 'Hand' },
  { id: 'zoom', icon: ZoomIn, label: 'Zoom' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'ellipse', icon: Circle, label: 'Ellipse' },
  { id: 'triangle', icon: Triangle, label: 'Triangle' },
  { id: 'frame', icon: Frame, label: 'Frame' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'sticky', icon: StickyNote, label: 'Sticky' },
  { id: 'pen', icon: PenTool, label: 'Pen' },
];

export function Toolbar() {
  const { state, dispatch } = useEditorInteraction();
  const activeTool = state.activeTool;

  const handleTool = (tool: ToolItem) => {
    dispatch({ type: 'selectTool', tool: tool.id as typeof activeTool });
  };

  return (
    <div className="absolute left-[34px] top-7 z-30 flex h-[309px] w-[109px] flex-col gap-[2px] rounded-xl border border-border bg-bg-panel p-1.5 shadow-popover">
      {tools.map((tool, i) => {
        const Icon = tool.icon;
        const selected = activeTool === tool.id;
        return (
          <div key={tool.id}>
            {i === 3 && (
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

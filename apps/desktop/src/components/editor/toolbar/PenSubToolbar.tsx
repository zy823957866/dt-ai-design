import { PenTool, MousePointer2, Scissors, Check } from 'lucide-react';
import { useEditorInteraction } from '../EditorInteractionProvider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CanvasToolId } from '@dt-ai-design/editor-interaction';

const PEN_TOOLS: Array<{
  id: CanvasToolId;
  label: string;
  shortcut: string;
  icon: typeof PenTool;
}> = [
  { id: 'pen', label: 'Pen', shortcut: 'P', icon: PenTool },
  {
    id: 'pen_move',
    label: 'Select points',
    shortcut: 'V',
    icon: MousePointer2,
  },
  { id: 'pen_cut', label: 'Cut', shortcut: 'X', icon: Scissors },
];

export function PenSubToolbar() {
  const { state, dispatch } = useEditorInteraction();
  if (!['pen', 'pen_move', 'pen_cut'].includes(state.activeTool)) return null;

  return (
    <div className="absolute left-[80px] top-7 z-30 flex flex-col items-center gap-1 rounded-xl border border-border bg-bg-panel p-1 shadow-popover">
      {PEN_TOOLS.map((t) => {
        const Icon = t.icon;
        return (
          <Tooltip key={t.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => dispatch({ type: 'selectTool', tool: t.id })}
                className={`flex h-7 w-7 items-center justify-center rounded-md ${
                  state.activeTool === t.id
                    ? 'bg-accent-soft text-accent-text'
                    : 'text-text-secondary hover:bg-bg-hover'
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {t.label} · {t.shortcut}
            </TooltipContent>
          </Tooltip>
        );
      })}
      <div className="h-px w-4 bg-border" />
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => dispatch({ type: 'selectTool', tool: 'move' })}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-bg-hover"
          >
            <Check className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          Done · Enter
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

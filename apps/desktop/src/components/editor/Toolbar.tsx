import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useEditorInteraction } from './EditorInteractionProvider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TOOL_GROUPS, type ToolDef } from './toolbar/toolConfig';
import type { CanvasToolId } from '@dt-ai-design/editor-interaction';

const IS_DESKTOP = true;

export function Toolbar() {
  const { state, dispatch } = useEditorInteraction();
  const activeTool = state.activeTool;
  const [openFlyout, setOpenFlyout] = useState<string | null>(null);

  const select = (id: CanvasToolId) =>
    dispatch({ type: 'selectTool', tool: id });

  return (
    <div className="absolute left-[34px] top-7 z-30 flex w-[38px] flex-col gap-[2px] rounded-xl border border-border bg-bg-panel p-1.5 shadow-popover">
      {TOOL_GROUPS.filter((g) => !g.desktopOnly || IS_DESKTOP).map((group) => (
        <div key={group.id}>
          {group.separatorBefore && (
            <div className="mx-auto my-0.5 h-px w-[22px] bg-border" />
          )}
          {group.flyout ? (
            <FlyoutGroup
              group={group}
              activeTool={activeTool}
              open={openFlyout === group.id}
              setOpen={(v) => setOpenFlyout(v ? group.id : null)}
              onSelect={select}
            />
          ) : (
            group.tools.map((tool) => (
              <ToolButton
                key={tool.id}
                tool={tool}
                active={activeTool === tool.id}
                onSelect={() => tool.enabled && select(tool.id)}
              />
            ))
          )}
        </div>
      ))}
    </div>
  );
}

function ToolButton({
  tool,
  active,
  onSelect,
}: {
  tool: ToolDef;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = tool.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={!tool.enabled}
          onClick={onSelect}
          className={`flex h-[27px] w-full items-center justify-center rounded-md transition-colors ${
            active
              ? 'bg-accent-soft text-accent-text'
              : tool.enabled
                ? 'text-text-secondary hover:bg-bg-hover'
                : 'text-text-tertiary/40 cursor-not-allowed'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {tool.label}
        {tool.shortcut ? ` · ${tool.shortcut}` : ''}
        {tool.enabled ? '' : '（未实现）'}
      </TooltipContent>
    </Tooltip>
  );
}

function FlyoutGroup({
  group,
  activeTool,
  open,
  setOpen,
  onSelect,
}: {
  group: { id: string; tools: ToolDef[]; pinned?: number };
  activeTool: CanvasToolId;
  open: boolean;
  setOpen: (v: boolean) => void;
  onSelect: (id: CanvasToolId) => void;
}) {
  const pinned = group.tools.slice(0, group.pinned ?? 1);
  const rest = group.tools.slice(group.pinned ?? 1);

  return (
    <div className="flex items-center gap-[2px]">
      {pinned.map((tool) => (
        <div key={tool.id} className="flex-1">
          <ToolButton
            tool={tool}
            active={activeTool === tool.id}
            onSelect={() => tool.enabled && onSelect(tool.id)}
          />
        </div>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-[27px] w-3 items-center justify-center rounded-sm text-text-tertiary hover:bg-bg-hover"
          >
            <ChevronRight className="h-3 w-3 rotate-90" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" sideOffset={8} className="w-40 p-1">
          {rest.map((tool) => {
            const RIcon = tool.icon;
            return (
              <button
                key={tool.id}
                type="button"
                disabled={!tool.enabled}
                onClick={() => {
                  if (!tool.enabled) return;
                  onSelect(tool.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs text-text-secondary hover:bg-bg-hover disabled:opacity-40"
              >
                <RIcon className="h-3.5 w-3.5" />
                {tool.label}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>
    </div>
  );
}

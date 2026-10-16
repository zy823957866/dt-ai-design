# 计划 B：工具栏对齐 pen.dev（editor-interaction + desktop）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用具分组、Primitives Flyout、Pen 子工具栏与快捷键替换现有硬编码工具栏，并把工具 id 对齐 pen.dev（`select`→`move`，移除 `triangle`，新增 scale/comment/polygon/icon/script/browser）。

**Architecture:** 先在 `@dt-ai-design/editor-interaction` 扩展类型与 reducer，再在 desktop 侧以数据驱动配置渲染工具栏。占位工具（polygon/icon/script/browser/comment）按钮存在但 `enabled:false`。

**Tech Stack:** TypeScript、React 19、Vitest、lucide-react、shadcn/ui。

## Global Constraints

- 工具 id 唯一来源：`packages/editor-interaction/src/types.ts` 的 `CanvasToolId`。
- `move` 行为等同原 `select`（选择/移动/框选/缩放控制点）；`hand`/`zoom` 行为不变。
- 创建图层的 `layerType` 只允许 `LayerTypeString`；`sticky` 工具映射为 `stickyNote`。
- 每个任务结束必须：`pnpm --filter @dt-ai-design/editor-interaction typecheck` + `test:run` 通过；涉及 desktop 的任务再跑 `pnpm --filter @dt-ai-design/desktop typecheck`。
- 禁止新增第三方依赖。

---

## File Structure

- Modify: `packages/editor-interaction/src/types.ts` — `CanvasToolId`
- Modify: `packages/editor-interaction/src/state/initialState.ts` — 默认工具
- Modify: `packages/editor-interaction/src/reducer.ts` — 重命名 + shape 判断 + 工具→图层类型
- Create: `packages/editor-interaction/src/tests/reducer.test.ts`
- Modify: `apps/desktop/src/components/editor/EditorProvider.tsx` — 默认 'move'
- Modify: `apps/desktop/src/components/canvas/Canvas.tsx` — 'select'→'move'、shape 列表
- Create: `apps/desktop/src/components/editor/toolbar/toolConfig.ts`
- Create: `apps/desktop/src/components/editor/toolbar/PenSubToolbar.tsx`
- Create: `apps/desktop/src/components/editor/toolbar/useToolShortcuts.ts`
- Modify: `apps/desktop/src/components/editor/Toolbar.tsx` — 重写

---

### Task 1: 扩展 CanvasToolId 并重命名 select→move

**Files:**

- Modify: `packages/editor-interaction/src/types.ts:5-15`
- Modify: `packages/editor-interaction/src/state/initialState.ts:5`
- Modify: `packages/editor-interaction/src/reducer.ts:35-37, 85, 164, 184, 231, 385, 387`
- Test: `packages/editor-interaction/src/tests/reducer.test.ts`

**Interfaces:**

- Produces:
  - `CanvasToolId = 'move' | 'scale' | 'hand' | 'comment' | 'zoom' | 'rectangle' | 'ellipse' | 'polygon' | 'icon' | 'script' | 'pen' | 'pen_move' | 'pen_cut' | 'text' | 'frame' | 'sticky' | 'browser'`
  - `toolToLayerType(tool: CanvasToolId): LayerTypeString | null`
  - `isShapeTool(tool: CanvasToolId): boolean`（rectangle/ellipse/frame）

- [ ] **Step 1: 写失败测试**

Create `packages/editor-interaction/src/tests/reducer.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { reduceInteraction } from '../reducer';
import { createInitialInteractionState } from '../state/initialState';

describe('reduceInteraction tool handling', () => {
  it('defaults to move tool', () => {
    expect(createInitialInteractionState().activeTool).toBe('move');
  });

  it('switches to move and emits setActiveTool', () => {
    const s = createInitialInteractionState();
    const { state, commands } = reduceInteraction(s, {
      type: 'selectTool',
      tool: 'move',
    });
    expect(state.activeTool).toBe('move');
    expect(commands).toEqual([{ type: 'setActiveTool', tool: 'move' }]);
  });

  it('enters creatingShape for rectangle on empty canvas', () => {
    const s = {
      ...createInitialInteractionState(),
      activeTool: 'rectangle' as const,
    };
    const { state } = reduceInteraction(s, {
      type: 'pointerDown',
      point: { x: 0, y: 0 },
      hit: { layerId: '', type: 'empty' },
      shiftKey: false,
      metaKey: false,
    });
    expect(state.mode).toBe('creatingShape');
  });

  it('escape resets to move tool', () => {
    const s = {
      ...createInitialInteractionState(),
      activeTool: 'rectangle' as const,
      mode: 'creatingShape' as const,
    };
    const { state } = reduceInteraction(s, { type: 'escape' });
    expect(state.activeTool).toBe('move');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @dt-ai-design/editor-interaction test:run -- reducer`
Expected: FAIL（`activeTool` 为 `'select'`）

- [ ] **Step 3: 改 CanvasToolId**

`packages/editor-interaction/src/types.ts` 中把 `CanvasToolId`（5–15 行）替换为：

```ts
export type CanvasToolId =
  | 'move'
  | 'scale'
  | 'hand'
  | 'comment'
  | 'zoom'
  | 'rectangle'
  | 'ellipse'
  | 'polygon'
  | 'icon'
  | 'script'
  | 'pen'
  | 'pen_move'
  | 'pen_cut'
  | 'text'
  | 'frame'
  | 'sticky'
  | 'browser';
```

- [ ] **Step 4: 改默认工具**

`packages/editor-interaction/src/state/initialState.ts:5`：`activeTool: 'select',` → `activeTool: 'move',`

- [ ] **Step 5: 改 reducer**

`packages/editor-interaction/src/reducer.ts`：

- `isShapeTool`（35–37 行）改为：

```ts
function isShapeTool(tool: string): boolean {
  return ['rectangle', 'ellipse', 'frame'].includes(tool);
}

/** 工具 → 图层类型（用于 createLayer 命令） */
export function toolToLayerType(tool: string): LayerTypeString | null {
  if (tool === 'rectangle') return 'rectangle';
  if (tool === 'ellipse') return 'ellipse';
  if (tool === 'frame') return 'frame';
  if (tool === 'sticky') return 'stickyNote';
  if (tool === 'path' || tool === 'pen') return 'path';
  return null;
}
```

- 把 `'select'` 引用全部改为 `'move'`：85 行 `tool: 'select'` → `tool: 'move'`；164、184、231 行 `state.activeTool === 'select'` → `'move'`；385、387 行同理。
- 创建命令（372–376 行）改为使用映射并跳过不支持的工具：

```ts
const layerType = toolToLayerType(state.activeTool);
if (isMeaningful && layerType) {
  endCommands.push({
    type: 'createLayer',
    layerType,
    bounds,
  });
}
```

- 提交 `selectTool`/`pointerUp` 中的 `setActiveTool` 用 `'move'`。

- [ ] **Step 6: 运行测试确认通过**

Run: `pnpm --filter @dt-ai-design/editor-interaction test:run`
Expected: PASS

- [ ] **Step 7: 提交**

```bash
git add packages/editor-interaction/src/types.ts packages/editor-interaction/src/state/initialState.ts packages/editor-interaction/src/reducer.ts packages/editor-interaction/src/tests/reducer.test.ts
git commit -m "refactor(editor-interaction): rename select to move, extend CanvasToolId"
```

---

### Task 2: 同步 desktop 使用点（select→move、shape 列表）

**Files:**

- Modify: `apps/desktop/src/components/editor/EditorProvider.tsx:85,748,759`
- Modify: `apps/desktop/src/components/canvas/Canvas.tsx:496,509,618,775,1005`
- Modify: `apps/desktop/src/components/editor/EditorInteractionProvider.tsx`（类型转换保持）

- [ ] **Step 1: 改 EditorProvider**

`apps/desktop/src/components/editor/EditorProvider.tsx`：

- 85 行 `useRef<string>('select')` → `useRef<string>('move')`。
- 748 行 `handleSetActiveTool('select')` → `handleSetActiveTool('move')`。
- 759 行 快捷键映射中 `v: 'select',` → `v: 'move',`。

- [ ] **Step 2: 改 Canvas**

`apps/desktop/src/components/canvas/Canvas.tsx`：

- 496、509、618、1005 行 `activeTool === 'select'` → `activeTool === 'move'`。
- 775 行 `['rectangle', 'ellipse', 'frame', 'triangle'].includes(activeTool)` → `['rectangle', 'ellipse', 'frame'].includes(activeTool)`。

- [ ] **Step 3: typecheck**

Run: `pnpm --filter @dt-ai-design/desktop typecheck`
Expected: PASS（无残留 `'select'`/`'triangle'`）。若报错按提示修正。

- [ ] **Step 4: 提交**

```bash
git add apps/desktop/src/components/editor/EditorProvider.tsx apps/desktop/src/components/canvas/Canvas.tsx
git commit -m "refactor(desktop): use move tool id across editor"
```

---

### Task 3: 工具栏配置 + 重写 Toolbar + Flyout

**Files:**

- Create: `apps/desktop/src/components/editor/toolbar/toolConfig.ts`
- Modify: `apps/desktop/src/components/editor/Toolbar.tsx`

**Interfaces:**

- Consumes: `CanvasToolId`（Task 1）、`useEditorInteraction`（现有）
- Produces: `TOOL_GROUPS: ToolGroup[]`

- [ ] **Step 1: 写配置**

Create `apps/desktop/src/components/editor/toolbar/toolConfig.ts`:

```ts
import type { CanvasToolId } from '@dt-ai-design/editor-interaction';
import {
  MousePointer2,
  Scaling,
  Hand,
  MessageSquare,
  Square,
  Circle,
  Pentagon,
  Frame as FrameIcon,
  Type as TypeIcon,
  StickyNote,
  PenTool,
  Globe,
  Box,
  Code2,
  type LucideIcon,
} from 'lucide-react';

export interface ToolDef {
  id: CanvasToolId;
  label: string;
  shortcut: string;
  enabled: boolean;
  icon: LucideIcon;
}

export interface ToolGroup {
  id: string;
  tools: ToolDef[];
  /** 前面显示分隔线 */
  separatorBefore?: boolean;
  /** 主按钮展示前 N 个，其余进 flyout */
  pinned?: number;
  flyout?: boolean;
  desktopOnly?: boolean;
}

export const TOOL_GROUPS: ToolGroup[] = [
  {
    id: 'move',
    tools: [
      {
        id: 'move',
        label: 'Move',
        shortcut: 'V',
        enabled: true,
        icon: MousePointer2,
      },
      {
        id: 'scale',
        label: 'Scale',
        shortcut: 'K',
        enabled: true,
        icon: Scaling,
      },
    ],
  },
  {
    id: 'primitives',
    separatorBefore: true,
    flyout: true,
    pinned: 2,
    tools: [
      {
        id: 'rectangle',
        label: 'Rectangle',
        shortcut: 'R',
        enabled: true,
        icon: Square,
      },
      {
        id: 'ellipse',
        label: 'Ellipse',
        shortcut: 'O',
        enabled: true,
        icon: Circle,
      },
      {
        id: 'polygon',
        label: 'Polygon',
        shortcut: '',
        enabled: false,
        icon: Pentagon,
      },
      { id: 'icon', label: 'Icon', shortcut: '', enabled: false, icon: Box },
      {
        id: 'script',
        label: 'Script',
        shortcut: '',
        enabled: false,
        icon: Code2,
      },
    ],
  },
  {
    id: 'pen',
    separatorBefore: true,
    tools: [
      { id: 'pen', label: 'Pen', shortcut: 'P', enabled: true, icon: PenTool },
    ],
  },
  {
    id: 'text',
    tools: [
      {
        id: 'text',
        label: 'Text',
        shortcut: 'T',
        enabled: true,
        icon: TypeIcon,
      },
    ],
  },
  {
    id: 'frame',
    tools: [
      {
        id: 'frame',
        label: 'Frame',
        shortcut: 'F',
        enabled: true,
        icon: FrameIcon,
      },
    ],
  },
  {
    id: 'sticky',
    tools: [
      {
        id: 'sticky',
        label: 'Sticky Note',
        shortcut: 'N',
        enabled: true,
        icon: StickyNote,
      },
    ],
  },
  {
    id: 'browser',
    desktopOnly: true,
    tools: [
      {
        id: 'browser',
        label: 'Browser',
        shortcut: '',
        enabled: false,
        icon: Globe,
      },
    ],
  },
  {
    id: 'hand',
    separatorBefore: true,
    tools: [
      { id: 'hand', label: 'Hand', shortcut: 'H', enabled: true, icon: Hand },
    ],
  },
  {
    id: 'comment',
    tools: [
      {
        id: 'comment',
        label: 'Comment',
        shortcut: 'C',
        enabled: false,
        icon: MessageSquare,
      },
    ],
  },
];

export const SHAPE_TOOLS = ['rectangle', 'ellipse', 'frame'] as const;
```

- [ ] **Step 2: 重写 Toolbar**

Replace `apps/desktop/src/components/editor/Toolbar.tsx`:

```tsx
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
  const primary = pinned.find((t) => t.id === activeTool) ?? pinned[0];
  const Icon = primary.icon;

  return (
    <div className="flex items-center gap-[2px]">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onSelect(primary.id)}
            className={`flex h-[27px] flex-1 items-center justify-center rounded-md transition-colors ${
              activeTool === primary.id
                ? 'bg-accent-soft text-accent-text'
                : 'text-text-secondary hover:bg-bg-hover'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {primary.label} · {primary.shortcut}
        </TooltipContent>
      </Tooltip>
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
```

- [ ] **Step 3: typecheck**

Run: `pnpm --filter @dt-ai-design/desktop typecheck`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add apps/desktop/src/components/editor/toolbar/toolConfig.ts apps/desktop/src/components/editor/Toolbar.tsx
git commit -m "feat(desktop): data-driven toolbar with primitives flyout"
```

---

### Task 4: Pen 子工具栏 + 工具快捷键

**Files:**

- Create: `apps/desktop/src/components/editor/toolbar/PenSubToolbar.tsx`
- Create: `apps/desktop/src/components/editor/toolbar/useToolShortcuts.ts`
- Modify: `apps/desktop/src/components/editor/Toolbar.tsx`（渲染 PenSubToolbar）
- Modify: `apps/desktop/src/components/editor/EditorCanvasStage.tsx`（挂载 useToolShortcuts）

**Interfaces:**

- Consumes: `useEditorInteraction`、`TOOL_GROUPS`
- Produces: `<PenSubToolbar />`、`useToolShortcuts()`（副作用 hook）

- [ ] **Step 1: Pen 子工具栏**

Create `apps/desktop/src/components/editor/toolbar/PenSubToolbar.tsx`:

```tsx
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
```

- [ ] **Step 2: 快捷键 hook**

Create `apps/desktop/src/components/editor/toolbar/useToolShortcuts.ts`:

```ts
import { useEffect } from 'react';
import { useEditorInteraction } from '../EditorInteractionProvider';
import { TOOL_GROUPS } from './toolConfig';
import type { CanvasToolId } from '@dt-ai-design/editor-interaction';

export function useToolShortcuts() {
  const { dispatch } = useEditorInteraction();

  useEffect(() => {
    const map = new Map<string, CanvasToolId>();
    for (const g of TOOL_GROUPS) {
      for (const t of g.tools) {
        if (t.enabled && t.shortcut) map.set(t.shortcut.toUpperCase(), t.id);
      }
    }
    map.set('Z', 'zoom');

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') {
        dispatch({ type: 'escape' });
        return;
      }
      const tool = map.get(e.key.toUpperCase());
      if (tool) {
        e.preventDefault();
        dispatch({ type: 'selectTool', tool });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);
}
```

- [ ] **Step 3: 挂载并移除旧的工具快捷键**

在 `apps/desktop/src/components/editor/EditorCanvasStage.tsx` 顶部的组件体内调用 `useToolShortcuts();`，并在 `Toolbar.tsx` 中渲染 `<PenSubToolbar />`（放在主工具栏之后、同一父层）。

同时**删除** `apps/desktop/src/components/editor/EditorProvider.tsx` 中旧的工具按键分支（约 749–780 行的 `toolMap` 块，仅保留 `Escape` 分支），避免与新 hook 冲突。

- [ ] **Step 4: typecheck**

Run: `pnpm --filter @dt-ai-design/desktop typecheck`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add apps/desktop/src/components/editor/toolbar/PenSubToolbar.tsx apps/desktop/src/components/editor/toolbar/useToolShortcuts.ts apps/desktop/src/components/editor/Toolbar.tsx apps/desktop/src/components/editor/EditorCanvasStage.tsx
git commit -m "feat(desktop): pen sub-toolbar and tool keyboard shortcuts"
```

---

## Self-Review

- **Spec coverage**：spec §4.1（CanvasToolId）、§4.2（toolConfig）、§4.3（Toolbar/PenSubToolbar/快捷键）、§4.4（可用性/占位）均覆盖。
- **Placeholder scan**：无 TBD/TODO。
- **Type consistency**：`CanvasToolId` 在 types/reducer/toolConfig/canvas 一致；`toolToLayerType` 返回 `LayerTypeString | null`；占位工具 `enabled:false` 不 dispatch。

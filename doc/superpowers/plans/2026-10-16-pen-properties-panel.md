# 计划 C：属性面板对齐 pen.dev（声明式 Section 注册表）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `PropertiesPanel.tsx` 从 462 行单文件重构为声明式 Section 注册表，并实现 Position / Layout / Appearance / Fill / Stroke / Typography / Effects / Export / Metadata / Alignment 十个 Section。

**Architecture:** 新增 `PropertySection` 接口与 `registry.ts`；`PropertiesPanel` 仅负责折叠态、Header、Design/Dev Tab 与遍历注册表。Section 直接读 `editor.getDocument()` 并通过 `editor.setLayerProperty` / 新增的样式数组方法写回。删除旧的 react-hook-form 桥（`properties/nodeToFormValues.ts`、`properties/formValuesToPatch.ts`）。

**Tech Stack:** React 19、react-hook-form（移除）、shadcn/ui、lucide-react、Tailwind。

## Global Constraints

- 依赖计划 A（`FrameLayout` 单轴、`layerPosition`、四角圆角、BlendMode 18 项）与计划 B（`move` 工具 id）。
- 写路径必须经 `EditorApi`（保证 undo 与订阅通知）。
- 多选：`isMulti` 时值不一致显示空态；写入应用到所有选中图层。
- 保留现有设计 token（`bg-bg-input`/`text-text-secondary`/`accent-*` 等）。
- 每个任务结束必须：`pnpm --filter @dt-ai-design/desktop typecheck` 通过；Task 8 跑全仓 `pnpm typecheck` + `pnpm lint`。
- 禁止新增第三方依赖。

---

## File Structure

- Modify: `apps/desktop/src/lib/editor.ts` — 新增样式数组方法
- Modify: `apps/desktop/src/components/editor/EditorProvider.tsx` — 实现样式数组方法
- Create: `apps/desktop/src/components/editor/properties/PropertySection.ts`
- Create: `apps/desktop/src/components/editor/properties/registry.tsx`
- Create: `apps/desktop/src/components/editor/properties/controls/SectionHeader.tsx`
- Create: `apps/desktop/src/components/editor/properties/controls/NumberField.tsx`
- Create: `apps/desktop/src/components/editor/properties/controls/SegmentedControl.tsx`
- Create: `apps/desktop/src/components/editor/properties/controls/SelectField.tsx`
- Create: `apps/desktop/src/components/editor/properties/controls/CheckboxField.tsx`
- Create: `apps/desktop/src/components/editor/properties/controls/ColorField.tsx`
- Create: `apps/desktop/src/components/editor/properties/sections/*.tsx`（10 个）
- Modify: `apps/desktop/src/components/editor/PropertiesPanel.tsx` — 重写为遍历注册表
- Delete: `apps/desktop/src/components/editor/properties/nodeToFormValues.ts`
- Delete: `apps/desktop/src/components/editor/properties/formValuesToPatch.ts`

---

### Task 1: EditorApi 新增样式数组方法

**Files:**

- Modify: `apps/desktop/src/lib/editor.ts`
- Modify: `apps/desktop/src/components/editor/EditorProvider.tsx`

**Interfaces:**

- Produces:

  ```ts
  export type StyleField = 'fills' | 'strokes' | 'effects';
  // EditorApi 新增：
  appendStyleItem(layerId: string, field: StyleField, item: unknown): void;
  updateStyleItem(layerId: string, field: StyleField, index: number, patch: unknown): void;
  removeStyleItem(layerId: string, field: StyleField, index: number): void;
  ```

- [ ] **Step 1: 扩展接口（lib/editor.ts）**

在 `EditorApi` 的「图层操作」区块末尾加：

```ts
  // ─── 样式数组（fills/strokes/effects）───
  appendStyleItem: (
    layerId: string,
    field: 'fills' | 'strokes' | 'effects',
    item: unknown,
  ) => void;
  updateStyleItem: (
    layerId: string,
    field: 'fills' | 'strokes' | 'effects',
    index: number,
    patch: unknown,
  ) => void;
  removeStyleItem: (
    layerId: string,
    field: 'fills' | 'strokes' | 'effects',
    index: number,
  ) => void;
```

- [ ] **Step 2: 实现（EditorProvider.tsx）**

在 `EditorProvider.tsx` 顶部 import 处补充 editor-core 的样式数组命令（若已存在则跳过）：

```ts
import {
  appendFill,
  updateFill,
  removeFill,
  appendStroke,
  updateStroke,
  removeStroke,
  appendEffect,
  updateEffect,
  removeEffect,
} from '@dt-ai-design/editor-core';
```

在 `handleSetLayerProperty` 附近新增三个 handler（遵循现有 `stackRef.current.execute` + `notifyChange` 模式）：

```ts
const handleAppendStyleItem = useCallback(
  (layerId: string, field: 'fills' | 'strokes' | 'effects', item: unknown) => {
    const prevDoc = stateRef.current.document;
    const run =
      field === 'fills'
        ? appendFill
        : field === 'strokes'
          ? appendStroke
          : appendEffect;
    const cmd = {
      name: `appendStyleItem:${field}`,
      execute: (s: EditorState) => run(s, layerId, item as never),
      undo: (s: EditorState) => {
        s.document = prevDoc;
        return s.document;
      },
    };
    stackRef.current.execute(cmd);
    notifyChange();
  },
  [notifyChange],
);

const handleUpdateStyleItem = useCallback(
  (
    layerId: string,
    field: 'fills' | 'strokes' | 'effects',
    index: number,
    patch: unknown,
  ) => {
    const prevDoc = stateRef.current.document;
    const run =
      field === 'fills'
        ? updateFill
        : field === 'strokes'
          ? updateStroke
          : updateEffect;
    const cmd = {
      name: `updateStyleItem:${field}`,
      execute: (s: EditorState) => run(s, layerId, index, patch as never),
      undo: (s: EditorState) => {
        s.document = prevDoc;
        return s.document;
      },
    };
    stackRef.current.execute(cmd);
    notifyChange();
  },
  [notifyChange],
);

const handleRemoveStyleItem = useCallback(
  (layerId: string, field: 'fills' | 'strokes' | 'effects', index: number) => {
    const prevDoc = stateRef.current.document;
    const run =
      field === 'fills'
        ? removeFill
        : field === 'strokes'
          ? removeStroke
          : removeEffect;
    const cmd = {
      name: `removeStyleItem:${field}`,
      execute: (s: EditorState) => run(s, layerId, index),
      undo: (s: EditorState) => {
        s.document = prevDoc;
        return s.document;
      },
    };
    stackRef.current.execute(cmd);
    notifyChange();
  },
  [notifyChange],
);
```

在构造 `EditorApi` 对象（提供 `setLayerProperty` 处）加入：

```ts
    appendStyleItem: handleAppendStyleItem,
    updateStyleItem: handleUpdateStyleItem,
    removeStyleItem: handleRemoveStyleItem,
```

- [ ] **Step 3: typecheck**

Run: `pnpm --filter @dt-ai-design/desktop typecheck`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add apps/desktop/src/lib/editor.ts apps/desktop/src/components/editor/EditorProvider.tsx
git commit -m "feat(desktop): expose style-array editor commands"
```

---

### Task 2: Section 基础设施与共享控件

**Files:**

- Create: `PropertySection.ts`, `controls/SectionHeader.tsx`, `controls/NumberField.tsx`, `controls/SegmentedControl.tsx`, `controls/SelectField.tsx`, `controls/CheckboxField.tsx`, `controls/ColorField.tsx`（均在 `apps/desktop/src/components/editor/properties/`）

**Interfaces:**

- Produces:

  ```ts
  export interface PropertyContextValue {
    editor: EditorApi;
    layer: Layer | null;
    layers: Layer[];
    isMulti: boolean;
  }
  export interface PropertySection {
    id: string;
    title: string;
    isAvailable(ctx: PropertyContextValue): boolean;
    Component: React.FC<{ ctx: PropertyContextValue }>;
  }
  ```

- [ ] **Step 1: PropertySection.ts**

```ts
import type { ComponentType } from 'react';
import type { Layer } from '@dt-ai-design/design-schema';
import type { EditorApi } from '@/lib/editor';

export interface PropertyContextValue {
  editor: EditorApi;
  layer: Layer | null;
  layers: Layer[];
  isMulti: boolean;
}

export interface PropertySection {
  id: string;
  title: string;
  isAvailable(ctx: PropertyContextValue): boolean;
  Component: ComponentType<{ ctx: PropertyContextValue }>;
}
```

- [ ] **Step 2: controls/SectionHeader.tsx**

```tsx
import type { ReactNode } from 'react';

export function SectionHeader({
  label,
  action,
}: {
  label: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2 mt-4 flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
      {action}
    </div>
  );
}
```

- [ ] **Step 3: controls/NumberField.tsx**

```tsx
import { useEffect, useRef, useState } from 'react';

interface NumberFieldProps {
  label?: string;
  value: number | undefined;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
}

export function NumberField({
  label,
  value,
  onCommit,
  min,
  max,
  step = 1,
  suffix,
  disabled,
}: NumberFieldProps) {
  const [text, setText] = useState(value === undefined ? '' : String(value));
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startValRef = useRef(0);

  useEffect(() => {
    setText(value === undefined ? '' : String(Number(value.toFixed(2))));
  }, [value]);

  const clamp = (n: number) => {
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startValRef.current = value ?? 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const delta = (e.clientX - startXRef.current) * step;
    onCommit(clamp(Math.round((startValRef.current + delta) * 100) / 100));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div className="flex h-7 items-center gap-1 rounded-md bg-bg-input px-2">
      {label && (
        <span
          className="cursor-ew-resize select-none text-[10.5px] text-text-tertiary"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {label}
        </span>
      )}
      <input
        type="text"
        value={text}
        disabled={disabled}
        placeholder={value === undefined ? 'Mixed' : ''}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = Number(text);
          if (!Number.isNaN(n)) onCommit(clamp(n));
          else setText(value === undefined ? '' : String(value));
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          else if (e.key === 'ArrowUp') {
            e.preventDefault();
            onCommit(clamp((value ?? 0) + step * (e.shiftKey ? 10 : 1)));
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            onCommit(clamp((value ?? 0) - step * (e.shiftKey ? 10 : 1)));
          }
        }}
        className="h-6 w-full min-w-0 border-0 bg-transparent p-0 text-[11.5px] text-text-primary outline-none"
      />
      {suffix && (
        <span className="text-[10.5px] text-text-tertiary">{suffix}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 4: controls/SegmentedControl.tsx**

```tsx
export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T | undefined;
  options: SegmentOption<T>[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`h-[26px] flex-1 rounded-md text-[11.5px] transition-colors disabled:opacity-40 ${
            value === o.value
              ? 'border border-accent bg-accent-soft text-accent-text'
              : 'text-text-secondary hover:bg-bg-hover'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: controls/SelectField.tsx**

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export function SelectField<T extends string>({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: T | undefined;
  options: SelectOption<T>[];
  onChange: (v: T) => void;
  placeholder?: string;
}) {
  return (
    <Select value={value ?? ''} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger className="h-7 text-[11.5px]">
        <SelectValue placeholder={placeholder ?? 'Mixed'} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 6: controls/CheckboxField.tsx**

```tsx
import { Checkbox } from '@/components/ui/checkbox';

export function CheckboxField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean | 'indeterminate';
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-1.5 text-[11.5px] text-text-secondary"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="size-4"
      />
      {label}
    </label>
  );
}
```

- [ ] **Step 7: controls/ColorField.tsx**

```tsx
export function ColorField({
  color,
  onCommit,
}: {
  color: string;
  onCommit: (hex: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={color}
        onChange={(e) => onCommit(e.target.value)}
        className="h-6 w-6 cursor-pointer rounded-md border border-border bg-transparent p-0"
      />
      <input
        type="text"
        value={color}
        onChange={(e) => onCommit(e.target.value)}
        className="h-6 flex-1 rounded-md bg-bg-input px-2 text-[11.5px] text-text-primary outline-none"
      />
    </div>
  );
}
```

- [ ] **Step 8: typecheck**

Run: `pnpm --filter @dt-ai-design/desktop typecheck`
Expected: PASS

- [ ] **Step 9: 提交**

```bash
git add apps/desktop/src/components/editor/properties/PropertySection.ts apps/desktop/src/components/editor/properties/controls
git commit -m "feat(desktop): property section interface and shared controls"
```

---

### Task 3: 重写 PropertiesPanel + registry + Header/Position Section

**Files:**

- Create: `properties/registry.tsx`
- Create: `properties/sections/HeaderSection.tsx`
- Create: `properties/sections/PositionSection.tsx`
- Modify: `PropertiesPanel.tsx`
- Delete: `properties/nodeToFormValues.ts`, `properties/formValuesToPatch.ts`

**Interfaces:**

- Consumes: `PropertySection`、`PropertyContextValue`、控件、`EditorApi`
- Produces: `PROPERTY_SECTIONS: PropertySection[]`

- [ ] **Step 1: HeaderSection.tsx**

```tsx
import type { PropertySection } from '../PropertySection';

function HeaderPanel({
  ctx,
}: {
  ctx: import('../PropertySection').PropertyContextValue;
}) {
  const { layer, layers, isMulti, editor } = ctx;
  if (isMulti) {
    return (
      <div className="rounded-lg bg-bg-input px-2.5 py-2 text-[11.5px] text-text-secondary">
        已选中 {layers.length} 个图层
      </div>
    );
  }
  if (!layer) return null;
  return (
    <div className="flex h-[34px] items-center gap-2 rounded-lg bg-bg-input px-2.5">
      <input
        defaultValue={layer.name}
        key={layer.id}
        onBlur={(e) =>
          editor.setLayerProperty(layer.id, 'name', e.target.value)
        }
        className="h-6 flex-1 border-0 bg-transparent p-0 text-xs text-text-primary outline-none"
      />
    </div>
  );
}

export const HeaderSection: PropertySection = {
  id: 'header',
  title: 'Header',
  isAvailable: (ctx) => ctx.layers.length > 0,
  Component: HeaderPanel,
};
```

- [ ] **Step 2: PositionSection.tsx**

```tsx
import { NumberField } from '../controls/NumberField';
import { SectionHeader } from '../controls/SectionHeader';
import { CheckboxField } from '../controls/CheckboxField';
import type { PropertySection, PropertyContextValue } from '../PropertySection';
import type { Layer } from '@dt-ai-design/design-schema';

function read(layers: Layer[], get: (l: Layer) => number | undefined) {
  if (layers.length === 0) return undefined;
  const first = get(layers[0]);
  return layers.every((l) => get(l) === first) ? first : undefined;
}

function write(ctx: PropertyContextValue, key: string, value: unknown) {
  ctx.layers.forEach((l) => ctx.editor.setLayerProperty(l.id, key, value));
}

function PositionPanel({ ctx }: { ctx: PropertyContextValue }) {
  const { layers } = ctx;
  return (
    <>
      <SectionHeader label="Position" />
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="X"
          value={read(layers, (l) => l.x)}
          onCommit={(v) => write(ctx, 'x', v)}
        />
        <NumberField
          label="Y"
          value={read(layers, (l) => l.y)}
          onCommit={(v) => write(ctx, 'y', v)}
        />
        <NumberField
          label="W"
          value={read(layers, (l) => l.width)}
          min={0}
          onCommit={(v) =>
            layers.forEach((l) => ctx.editor.resizeLayer(l.id, v, l.height))
          }
        />
        <NumberField
          label="H"
          value={read(layers, (l) => l.height)}
          min={0}
          onCommit={(v) =>
            layers.forEach((l) => ctx.editor.resizeLayer(l.id, l.width, v))
          }
        />
        <NumberField
          label="∠"
          suffix="°"
          value={read(layers, (l) => l.rotation)}
          onCommit={(v) => write(ctx, 'rotation', v)}
        />
      </div>
      <div className="mt-2">
        <CheckboxField
          id="absolute-position"
          label="Absolute Position"
          checked={layers.every((l) => l.layerPosition === 'absolute')}
          onChange={(v) => write(ctx, 'layerPosition', v ? 'absolute' : 'auto')}
        />
      </div>
    </>
  );
}

export const PositionSection: PropertySection = {
  id: 'position',
  title: 'Position',
  isAvailable: (ctx) => ctx.layers.length > 0,
  Component: PositionPanel,
};
```

- [ ] **Step 3: registry.tsx（先放已实现的三个）**

```tsx
import type { PropertySection } from './PropertySection';
import { HeaderSection } from './sections/HeaderSection';
import { PositionSection } from './sections/PositionSection';

export const PROPERTY_SECTIONS: PropertySection[] = [
  HeaderSection,
  PositionSection,
];
```

- [ ] **Step 4: 重写 PropertiesPanel.tsx**

```tsx
import { useState, useEffect } from 'react';
import { Minus, ChevronDown } from 'lucide-react';
import { useEditor } from '@/lib/editor';
import type { Layer } from '@dt-ai-design/design-schema';
import { PROPERTY_SECTIONS } from './properties/registry';
import type { PropertyContextValue } from './properties/PropertySection';

interface PropertiesPanelProps {
  collapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  onOpenColor?: () => void;
}

export function PropertiesPanel({
  collapsed,
  onCollapse,
  onExpand,
}: PropertiesPanelProps) {
  const editor = useEditor();
  const [, forceUpdate] = useState(0);
  const [tab, setTab] = useState<'design' | 'dev'>('design');

  useEffect(() => {
    const off1 = editor.subscribe('change', () => forceUpdate((t) => t + 1));
    const off2 = editor.subscribe('selectionChange', () =>
      forceUpdate((t) => t + 1),
    );
    return () => {
      off1();
      off2();
    };
  }, [editor]);

  if (collapsed) {
    return (
      <div className="flex w-10 shrink-0 flex-col items-center border-l border-border bg-bg-panel py-2">
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-bg-hover"
          onClick={onExpand}
        >
          <ChevronDown className="h-4 w-4 -rotate-90" />
        </button>
      </div>
    );
  }

  const doc = editor.getDocument();
  const selection = editor.getSelection();
  const layers = selection.layerIds
    .map((id) => doc.layers[id])
    .filter(Boolean) as Layer[];
  const ctx: PropertyContextValue = {
    editor,
    layers,
    layer: layers.length === 1 ? layers[0] : null,
    isMulti: layers.length > 1,
  };

  return (
    <div className="flex w-[300px] shrink-0 flex-col border-l border-border bg-bg-panel">
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="text-[12.5px] font-semibold text-text-primary">
          Properties
        </span>
        <button
          className="text-text-tertiary hover:text-text-secondary"
          onClick={onCollapse}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-4 pt-3">
        <div className="flex h-[30px] rounded-lg bg-bg-input p-[3px]">
          {(['design', 'dev'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex h-[22px] flex-1 items-center justify-center rounded-md text-xs capitalize transition-colors ${
                tab === t
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'dev' ? (
        <div className="flex-1 overflow-y-auto p-4">
          <pre className="rounded-lg border border-border bg-bg-panel-deep p-3 font-mono text-[11px] leading-relaxed text-text-secondary">
            {`/* ${layers[0]?.name ?? 'canvas'} */\n/* Live CSS / Tailwind output */`}
          </pre>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
          {layers.length === 0 ? (
            <div className="pt-10 text-center text-xs text-text-tertiary">
              Nothing selected
            </div>
          ) : (
            PROPERTY_SECTIONS.filter((s) => s.isAvailable(ctx)).map((s) => (
              <s.Component key={s.id} ctx={ctx} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: 删除旧表单桥**

```bash
git rm apps/desktop/src/components/editor/properties/nodeToFormValues.ts apps/desktop/src/components/editor/properties/formValuesToPatch.ts
```

- [ ] **Step 6: typecheck**

Run: `pnpm --filter @dt-ai-design/desktop typecheck`
Expected: PASS

- [ ] **Step 7: 提交**

```bash
git add apps/desktop/src/components/editor/PropertiesPanel.tsx apps/desktop/src/components/editor/properties/registry.tsx apps/desktop/src/components/editor/properties/sections
git commit -m "refactor(desktop): rewrite PropertiesPanel with section registry"
```

---

### Task 4: LayoutSection + AppearanceSection

**Files:**

- Create: `properties/sections/LayoutSection.tsx`
- Create: `properties/sections/AppearanceSection.tsx`
- Modify: `properties/registry.tsx`

**Interfaces:**

- Consumes: `FrameLayout`、`CornerRadiusPerCorner`、`BlendMode`、`SegmentedControl`、`NumberField`、`SelectField`、`CheckboxField`

- [ ] **Step 1: LayoutSection.tsx**

```tsx
import { NumberField } from '../controls/NumberField';
import { SectionHeader } from '../controls/SectionHeader';
import { SegmentedControl } from '../controls/SegmentedControl';
import { CheckboxField } from '../controls/CheckboxField';
import type { PropertySection, PropertyContextValue } from '../PropertySection';
import type { FrameLayer, FrameLayout } from '@dt-ai-design/design-schema';

const MODES = [
  { value: 'none' as const, label: 'Freeform' },
  { value: 'vertical' as const, label: 'Vertical' },
  { value: 'horizontal' as const, label: 'Horizontal' },
];

function LayoutPanel({ ctx }: { ctx: PropertyContextValue }) {
  const { layer, editor } = ctx;
  if (!layer || layer.type !== 'frame') return null;
  const frame = layer as FrameLayer;
  const layout = frame.layout;
  const set = (patch: Partial<FrameLayout>) =>
    editor.setLayerProperty(frame.id, 'layout', { ...layout, ...patch });
  const setPadding = (key: keyof FrameLayout['padding'], v: number) =>
    set({ padding: { ...layout.padding, [key]: v } });

  return (
    <>
      <SectionHeader
        label={layout.mode === 'none' ? 'Layout' : 'Flex Layout'}
      />
      <SegmentedControl
        value={layout.mode}
        options={MODES}
        onChange={(mode) => set({ mode })}
      />
      {layout.mode !== 'none' && (
        <>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <NumberField
              label="Gap"
              min={0}
              value={layout.gap}
              onCommit={(v) => set({ gap: v })}
            />
            <NumberField
              label="Pad"
              min={0}
              value={layout.padding.top}
              onCommit={(v) =>
                set({ padding: { top: v, right: v, bottom: v, left: v } })
              }
            />
            <NumberField
              label="T"
              min={0}
              value={layout.padding.top}
              onCommit={(v) => setPadding('top', v)}
            />
            <NumberField
              label="R"
              min={0}
              value={layout.padding.right}
              onCommit={(v) => setPadding('right', v)}
            />
            <NumberField
              label="B"
              min={0}
              value={layout.padding.bottom}
              onCommit={(v) => setPadding('bottom', v)}
            />
            <NumberField
              label="L"
              min={0}
              value={layout.padding.left}
              onCommit={(v) => setPadding('left', v)}
            />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <CheckboxField
              id="fill-width"
              label="Fill Width"
              checked={frame.sizingMode.width === 'fillContainer'}
              onChange={(v) =>
                editor.setLayerProperty(frame.id, 'sizingMode', {
                  ...frame.sizingMode,
                  width: v ? 'fillContainer' : 'fixed',
                })
              }
            />
            <CheckboxField
              id="hug-width"
              label="Hug Width"
              checked={frame.sizingMode.width === 'hugContents'}
              onChange={(v) =>
                editor.setLayerProperty(frame.id, 'sizingMode', {
                  ...frame.sizingMode,
                  width: v ? 'hugContents' : 'fixed',
                })
              }
            />
          </div>
        </>
      )}
    </>
  );
}

export const LayoutSection: PropertySection = {
  id: 'layout',
  title: 'Layout',
  isAvailable: (ctx) => ctx.layers.length > 0,
  Component: LayoutPanel,
};
```

> 注：文本 Resizing（Auto width/Auto height/Fixed size）在 TypographySection（Task 6）中随文本展示，避免与 frame 布局混淆。

- [ ] **Step 2: AppearanceSection.tsx**

```tsx
import { NumberField } from '../controls/NumberField';
import { SectionHeader } from '../controls/SectionHeader';
import { SelectField } from '../controls/SelectField';
import { CheckboxField } from '../controls/CheckboxField';
import type { PropertySection, PropertyContextValue } from '../PropertySection';
import type {
  EllipseLayer,
  FrameLayer,
  RectangleLayer,
} from '@dt-ai-design/design-schema';

const BLEND_MODES = [
  'normal',
  'darken',
  'multiply',
  'linearBurn',
  'colorBurn',
  'lighten',
  'screen',
  'linearDodge',
  'colorDodge',
  'overlay',
  'softLight',
  'hardLight',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));

function AppearancePanel({ ctx }: { ctx: PropertyContextValue }) {
  const { layer, layers, editor } = ctx;
  if (!layer) return null;
  const set = (key: string, value: unknown) =>
    layers.forEach((l) => editor.setLayerProperty(l.id, key, value));
  const hasCorner = ['rectangle', 'frame', 'image'].includes(layer.type);
  const isEllipse = layer.type === 'ellipse';
  const isPolygon = layer.type === 'polygon';

  return (
    <>
      <SectionHeader label="Appearance" />
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Opacity"
          min={0}
          max={100}
          suffix="%"
          value={Math.round(layer.opacity * 100)}
          onCommit={(v) => set('opacity', v / 100)}
        />
        {hasCorner && (
          <NumberField
            label="Radius"
            min={0}
            value={
              typeof layer.cornerRadius === 'number'
                ? layer.cornerRadius
                : layer.cornerRadius.topLeft
            }
            onCommit={(v) => set('cornerRadius', v)}
          />
        )}
      </div>
      <div className="mt-2">
        <SelectField
          value={layer.blendMode}
          options={BLEND_MODES}
          onChange={(v) => set('blendMode', v)}
        />
      </div>
      {isEllipse && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          <NumberField
            label="Start"
            suffix="°"
            min={0}
            value={(layer as EllipseLayer).arcStartAngle}
            onCommit={(v) => set('arcStartAngle', v)}
          />
          <NumberField
            label="Sweep"
            suffix="°"
            min={0}
            value={(layer as EllipseLayer).arcEndAngle}
            onCommit={(v) => set('arcEndAngle', v)}
          />
          <NumberField
            label="Inner"
            suffix="%"
            min={0}
            max={100}
            value={(layer as EllipseLayer).innerRadius}
            onCommit={(v) => set('innerRadius', v)}
          />
        </div>
      )}
      {isPolygon && (
        <div className="mt-2 text-[11px] text-text-tertiary">
          Polygon Count（占位）
        </div>
      )}
      {layer.type === 'frame' && (
        <div className="mt-2">
          <CheckboxField
            id="clip-content"
            label="Clip Content"
            checked={(layer as FrameLayer).clipContent}
            onChange={(v) =>
              editor.setLayerProperty(layer.id, 'clipContent', v)
            }
          />
        </div>
      )}
    </>
  );
}

export const AppearanceSection: PropertySection = {
  id: 'appearance',
  title: 'Appearance',
  isAvailable: (ctx) => ctx.layers.length > 0,
  Component: AppearancePanel,
};
```

> 注：`isPolygon` 分支在 schema 引入 `polygon` 图层前不会命中；保留以便后续接入。

- [ ] **Step 3: 注册**

`registry.tsx` 中 import 并加入 `LayoutSection`、`AppearanceSection`（顺序：Header, Position, Layout, Appearance）。

- [ ] **Step 4: typecheck + 提交**

Run: `pnpm --filter @dt-ai-design/desktop typecheck` → PASS

```bash
git add apps/desktop/src/components/editor/properties/sections/LayoutSection.tsx apps/desktop/src/components/editor/properties/sections/AppearanceSection.tsx apps/desktop/src/components/editor/properties/registry.tsx
git commit -m "feat(desktop): Layout and Appearance property sections"
```

---

### Task 5: FillSection + StrokeSection + EffectsSection

**Files:**

- Create: `properties/sections/FillSection.tsx`
- Create: `properties/sections/StrokeSection.tsx`
- Create: `properties/sections/EffectsSection.tsx`
- Modify: `properties/registry.tsx`

**Interfaces:**

- Consumes: `editor.appendStyleItem/updateStyleItem/removeStyleItem`（Task 1）、`FillStyle`、`StrokeStyle`、`EffectStyle`

- [ ] **Step 1: FillSection.tsx**

```tsx
import { Plus, Minus } from 'lucide-react';
import { SectionHeader } from '../controls/SectionHeader';
import { ColorField } from '../controls/ColorField';
import { SelectField } from '../controls/SelectField';
import { NumberField } from '../controls/NumberField';
import type { PropertySection, PropertyContextValue } from '../PropertySection';
import type { FillStyle, RectangleLayer } from '@dt-ai-design/design-schema';

const TYPES = [
  { value: 'solid', label: 'Color' },
  { value: 'linearGradient', label: 'Linear' },
  { value: 'radialGradient', label: 'Radial' },
  { value: 'angularGradient', label: 'Angular' },
  { value: 'image', label: 'Image' },
];

function FillPanel({ ctx }: { ctx: PropertyContextValue }) {
  const { layer, editor } = ctx;
  if (!layer) return null;
  const fills = ((layer as RectangleLayer).fills ?? []) as FillStyle[];
  const add = () =>
    editor.appendStyleItem(layer.id, 'fills', {
      type: 'solid',
      color: '#CCCCCC',
      opacity: 1,
    });
  const update = (i: number, patch: Partial<FillStyle>) =>
    editor.updateStyleItem(layer.id, 'fills', i, patch);
  const remove = (i: number) => editor.removeStyleItem(layer.id, 'fills', i);

  return (
    <>
      <SectionHeader
        label="Fill"
        action={
          <button
            type="button"
            onClick={add}
            className="text-text-tertiary hover:text-text-secondary"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        }
      />
      {fills.map((fill, i) => (
        <div key={i} className="mb-2 flex items-center gap-2">
          <SelectField
            value={fill.type}
            options={TYPES}
            onChange={(v) => update(i, { type: v })}
          />
          <ColorField
            color={fill.color ?? '#000000'}
            onCommit={(c) => update(i, { color: c })}
          />
          <NumberField
            label="O"
            suffix="%"
            min={0}
            max={100}
            value={Math.round((fill.opacity ?? 1) * 100)}
            onCommit={(v) => update(i, { opacity: v / 100 })}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-text-tertiary hover:text-text-secondary"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </>
  );
}

export const FillSection: PropertySection = {
  id: 'fill',
  title: 'Fill',
  isAvailable: (ctx) => ctx.layer != null && 'fills' in ctx.layer,
  Component: FillPanel,
};
```

- [ ] **Step 2: StrokeSection.tsx**

```tsx
import { Plus, Minus } from 'lucide-react';
import { SectionHeader } from '../controls/SectionHeader';
import { ColorField } from '../controls/ColorField';
import { SelectField } from '../controls/SelectField';
import { NumberField } from '../controls/NumberField';
import type { PropertySection, PropertyContextValue } from '../PropertySection';
import type { StrokeStyle, RectangleLayer } from '@dt-ai-design/design-schema';

const POSITIONS = [
  { value: 'center', label: 'Center' },
  { value: 'inside', label: 'Inside' },
  { value: 'outside', label: 'Outside' },
];
const JOINS = [
  { value: 'miter', label: 'Miter' },
  { value: 'round', label: 'Round' },
  { value: 'bevel', label: 'Bevel' },
];
const CAPS = [
  { value: 'flat', label: 'Butt' },
  { value: 'square', label: 'Square' },
  { value: 'round', label: 'Round' },
];

function StrokePanel({ ctx }: { ctx: PropertyContextValue }) {
  const { layer, editor } = ctx;
  if (!layer) return null;
  const strokes = ((layer as RectangleLayer).strokes ?? []) as StrokeStyle[];
  const add = () =>
    editor.appendStyleItem(layer.id, 'strokes', {
      color: '#000000',
      width: 1,
      style: 'solid',
      position: 'center',
      opacity: 1,
    });
  const update = (i: number, patch: Partial<StrokeStyle>) =>
    editor.updateStyleItem(layer.id, 'strokes', i, patch);
  const remove = (i: number) => editor.removeStyleItem(layer.id, 'strokes', i);
  const first = strokes[0];

  return (
    <>
      <SectionHeader
        label="Stroke"
        action={
          <button
            type="button"
            onClick={add}
            className="text-text-tertiary hover:text-text-secondary"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        }
      />
      {strokes.map((stroke, i) => (
        <div key={i} className="mb-2 flex items-center gap-2">
          <ColorField
            color={stroke.color}
            onCommit={(c) => update(i, { color: c })}
          />
          <NumberField
            label="W"
            min={0}
            value={stroke.width}
            onCommit={(v) => update(i, { width: v })}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-text-tertiary hover:text-text-secondary"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {first && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          <SelectField
            value={first.position}
            options={POSITIONS}
            onChange={(v) => update(0, { position: v })}
          />
          <SelectField
            value={first.join ?? 'miter'}
            options={JOINS}
            onChange={(v) => update(0, { join: v })}
          />
          <SelectField
            value={first.cap ?? 'flat'}
            options={CAPS}
            onChange={(v) => update(0, { cap: v })}
          />
        </div>
      )}
    </>
  );
}

export const StrokeSection: PropertySection = {
  id: 'stroke',
  title: 'Stroke',
  isAvailable: (ctx) => ctx.layer != null && 'strokes' in ctx.layer,
  Component: StrokePanel,
};
```

- [ ] **Step 3: EffectsSection.tsx**

```tsx
import { Plus, Minus } from 'lucide-react';
import { SectionHeader } from '../controls/SectionHeader';
import { NumberField } from '../controls/NumberField';
import { ColorField } from '../controls/ColorField';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { PropertySection, PropertyContextValue } from '../PropertySection';
import type {
  EffectStyle,
  RectangleLayer,
  EffectType,
} from '@dt-ai-design/design-schema';

const EFFECT_OPTIONS: { type: EffectType; label: string }[] = [
  { type: 'dropShadow', label: 'Drop Shadow' },
  { type: 'innerShadow', label: 'Inner Shadow' },
  { type: 'layerBlur', label: 'Layer Blur' },
  { type: 'backgroundBlur', label: 'Background Blur' },
];

function EffectsPanel({ ctx }: { ctx: PropertyContextValue }) {
  const { layer, editor } = ctx;
  if (!layer) return null;
  const effects = ((layer as RectangleLayer).effects ?? []) as EffectStyle[];
  const add = (type: EffectType) =>
    editor.appendStyleItem(layer.id, 'effects', {
      type,
      x: 0,
      y: 0,
      blur: 12,
      spread: 0,
      color: '#000000',
      opacity: 0.25,
    });
  const update = (i: number, patch: Partial<EffectStyle>) =>
    editor.updateStyleItem(layer.id, 'effects', i, patch);
  const remove = (i: number) => editor.removeStyleItem(layer.id, 'effects', i);

  return (
    <>
      <SectionHeader
        label="Effects"
        action={
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="text-text-tertiary hover:text-text-secondary"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="left" sideOffset={8} className="w-40 p-1">
              {EFFECT_OPTIONS.map((o) => (
                <button
                  key={o.type}
                  type="button"
                  onClick={() => add(o.type)}
                  className="flex w-full rounded-sm px-2 py-1.5 text-left text-xs text-text-secondary hover:bg-bg-hover"
                >
                  {o.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        }
      />
      {effects.map((effect, i) => (
        <div key={i} className="mb-2 rounded-md bg-bg-input p-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-secondary">
              {effect.type}
            </span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-text-tertiary hover:text-text-secondary"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
          </div>
          {(effect.type === 'dropShadow' || effect.type === 'innerShadow') && (
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              <NumberField
                label="X"
                value={effect.x ?? 0}
                onCommit={(v) => update(i, { x: v })}
              />
              <NumberField
                label="Y"
                value={effect.y ?? 0}
                onCommit={(v) => update(i, { y: v })}
              />
              <NumberField
                label="B"
                min={0}
                value={effect.blur ?? 0}
                onCommit={(v) => update(i, { blur: v })}
              />
            </div>
          )}
          {(effect.type === 'layerBlur' ||
            effect.type === 'backgroundBlur') && (
            <div className="mt-1.5">
              <NumberField
                label="Blur"
                min={0}
                value={effect.blur ?? 0}
                onCommit={(v) => update(i, { blur: v })}
              />
            </div>
          )}
          {(effect.type === 'dropShadow' || effect.type === 'innerShadow') && (
            <div className="mt-1.5">
              <ColorField
                color={effect.color ?? '#000000'}
                onCommit={(c) => update(i, { color: c })}
              />
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export const EffectsSection: PropertySection = {
  id: 'effects',
  title: 'Effects',
  isAvailable: (ctx) => ctx.layer != null && 'effects' in ctx.layer,
  Component: EffectsPanel,
};
```

- [ ] **Step 4: 注册 + typecheck + 提交**

`registry.tsx` 加入 `FillSection`、`StrokeSection`、`EffectsSection`（顺序：... Appearance, Fill, Stroke, Effects）。

Run: `pnpm --filter @dt-ai-design/desktop typecheck` → PASS

```bash
git add apps/desktop/src/components/editor/properties/sections/FillSection.tsx apps/desktop/src/components/editor/properties/sections/StrokeSection.tsx apps/desktop/src/components/editor/properties/sections/EffectsSection.tsx apps/desktop/src/components/editor/properties/registry.tsx
git commit -m "feat(desktop): Fill, Stroke and Effects property sections"
```

---

### Task 6: TypographySection

**Files:**

- Create: `properties/sections/TypographySection.tsx`
- Modify: `properties/registry.tsx`

- [ ] **Step 1: TypographySection.tsx**

```tsx
import { NumberField } from '../controls/NumberField';
import { SectionHeader } from '../controls/SectionHeader';
import { SegmentedControl } from '../controls/SegmentedControl';
import type { PropertySection, PropertyContextValue } from '../PropertySection';
import type { TextLayer } from '@dt-ai-design/design-schema';

const H_ALIGN = [
  { value: 'left' as const, label: 'Left' },
  { value: 'center' as const, label: 'Center' },
  { value: 'right' as const, label: 'Right' },
  { value: 'justify' as const, label: 'Justify' },
];
const V_ALIGN = [
  { value: 'top' as const, label: 'Top' },
  { value: 'middle' as const, label: 'Middle' },
  { value: 'bottom' as const, label: 'Bottom' },
];
const SIZING = [
  { value: 'autoWidth' as const, label: 'Auto width' },
  { value: 'autoHeight' as const, label: 'Auto height' },
  { value: 'fixed' as const, label: 'Fixed size' },
];

function TypographyPanel({ ctx }: { ctx: PropertyContextValue }) {
  const { layer, editor } = ctx;
  if (!layer || layer.type !== 'text') return null;
  const t = layer as TextLayer;
  const set = (key: string, value: unknown) =>
    editor.setLayerProperty(t.id, key, value);

  return (
    <>
      <SectionHeader label="Typography" />
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Size"
          min={0}
          value={t.fontSize}
          onCommit={(v) => set('fontSize', v)}
        />
        <NumberField
          label="Weight"
          min={100}
          max={900}
          value={t.fontWeight}
          onCommit={(v) => set('fontWeight', v)}
        />
        <NumberField
          label="Line"
          suffix="%"
          min={0}
          value={Math.round((t.lineHeight / t.fontSize) * 100)}
          onCommit={(v) => set('lineHeight', (v / 100) * t.fontSize)}
        />
        <NumberField
          label="LS"
          suffix="px"
          value={t.letterSpacing}
          onCommit={(v) => set('letterSpacing', v)}
        />
      </div>
      <div className="mt-2">
        <SegmentedControl
          value={t.textAlign}
          options={H_ALIGN}
          onChange={(v) => set('textAlign', v)}
        />
      </div>
      <div className="mt-2">
        <SegmentedControl
          value={t.verticalAlign}
          options={V_ALIGN}
          onChange={(v) => set('verticalAlign', v)}
        />
      </div>
      <div className="mt-3 text-[11px] text-text-tertiary">Resizing</div>
      <div className="mt-1.5">
        <SegmentedControl
          value={t.sizing}
          options={SIZING}
          onChange={(v) => set('sizing', v)}
        />
      </div>
    </>
  );
}

export const TypographySection: PropertySection = {
  id: 'typography',
  title: 'Typography',
  isAvailable: (ctx) => ctx.layer?.type === 'text',
  Component: TypographyPanel,
};
```

- [ ] **Step 2: 注册 + typecheck + 提交**

`registry.tsx` 加入 `TypographySection`（顺序在 Stroke 之后）。typecheck → PASS。

```bash
git add apps/desktop/src/components/editor/properties/sections/TypographySection.tsx apps/desktop/src/components/editor/properties/registry.tsx
git commit -m "feat(desktop): Typography property section"
```

---

### Task 7: AlignmentSection + ExportSection + MetadataSection

**Files:**

- Create: `properties/sections/AlignmentSection.tsx`
- Create: `properties/sections/ExportSection.tsx`
- Create: `properties/sections/MetadataSection.tsx`
- Modify: `properties/registry.tsx`

- [ ] **Step 1: AlignmentSection.tsx**

```tsx
import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
} from 'lucide-react';
import { SectionHeader } from '../controls/SectionHeader';
import type { PropertySection, PropertyContextValue } from '../PropertySection';
import type { AlignDirection } from '@dt-ai-design/editor-core';

const ROW_H: { dir: AlignDirection; icon: typeof AlignStartVertical }[] = [
  { dir: 'left', icon: AlignStartVertical },
  { dir: 'centerH', icon: AlignCenterVertical },
  { dir: 'right', icon: AlignEndVertical },
];
const ROW_V: { dir: AlignDirection; icon: typeof AlignStartHorizontal }[] = [
  { dir: 'top', icon: AlignStartHorizontal },
  { dir: 'centerV', icon: AlignCenterHorizontal },
  { dir: 'bottom', icon: AlignEndHorizontal },
];

function AlignmentPanel({ ctx }: { ctx: PropertyContextValue }) {
  const { editor, layers } = ctx;
  const disabled = layers.length < 2;
  const render = (row: typeof ROW_H) =>
    row.map(({ dir, icon: Icon }) => (
      <button
        key={dir}
        type="button"
        disabled={disabled}
        onClick={() => editor.alignSelection(dir)}
        className="flex h-6 flex-1 items-center justify-center rounded-md text-text-tertiary hover:bg-bg-hover disabled:opacity-40"
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
    ));
  return (
    <>
      <SectionHeader label="Alignment" />
      <div className="flex gap-1">{render(ROW_H)}</div>
      <div className="mt-1 flex gap-1">{render(ROW_V)}</div>
    </>
  );
}

export const AlignmentSection: PropertySection = {
  id: 'alignment',
  title: 'Alignment',
  isAvailable: (ctx) => ctx.layers.length > 0,
  Component: AlignmentPanel,
};
```

- [ ] **Step 2: ExportSection.tsx**

```tsx
import { SectionHeader } from '../controls/SectionHeader';
import { SelectField } from '../controls/SelectField';
import type { PropertySection, PropertyContextValue } from '../PropertySection';

const FORMATS = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WEBP' },
  { value: 'pdf', label: 'PDF' },
];
const SCALES = [
  { value: '1', label: '1x' },
  { value: '2', label: '2x' },
  { value: '3', label: '3x' },
];

function ExportPanel({ ctx }: { ctx: PropertyContextValue }) {
  const { onExport } = ctx as PropertyContextValue & { onExport?: () => void };
  return (
    <>
      <SectionHeader label="Export" />
      <div className="grid grid-cols-2 gap-2">
        <SelectField value="png" options={FORMATS} onChange={() => {}} />
        <SelectField value="2" options={SCALES} onChange={() => {}} />
      </div>
      <button
        type="button"
        onClick={onExport}
        className="mt-2 h-7 w-full rounded-md bg-accent-soft text-[11.5px] text-accent-text hover:bg-bg-hover"
      >
        Export layer
      </button>
    </>
  );
}

export const ExportSection: PropertySection = {
  id: 'export',
  title: 'Export',
  isAvailable: (ctx) => ctx.layers.length > 0,
  Component: ExportPanel,
};
```

> 注：`onExport` 未在 `PropertyContextValue` 中——在 Task 7 Step 4 将其加入 context（由 `PropertiesPanel` 传入现有 `onOpenColor` 旁边的导出回调）。若暂无导出回调，按钮为占位。

- [ ] **Step 3: MetadataSection.tsx**

```tsx
import { SectionHeader } from '../controls/SectionHeader';
import type { PropertySection, PropertyContextValue } from '../PropertySection';

function TextRow({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
}) {
  return (
    <div className="mb-1.5 flex h-7 items-center gap-1 rounded-md bg-bg-input px-2">
      <span className="text-[10.5px] text-text-tertiary">{label}</span>
      <input
        defaultValue={value}
        onBlur={(e) => onCommit(e.target.value)}
        className="h-6 w-full min-w-0 border-0 bg-transparent p-0 text-[11.5px] text-text-primary outline-none"
      />
    </div>
  );
}

function MetadataPanel({ ctx }: { ctx: PropertyContextValue }) {
  const { layer, editor } = ctx;
  if (!layer) return null;
  const metadata = layer.metadata ?? {};
  const set = (key: string, value: string) =>
    editor.setLayerProperty(layer.id, 'metadata', {
      ...metadata,
      [key]: value,
    });
  return (
    <>
      <SectionHeader label="Metadata" />
      <TextRow
        label="Source"
        value={metadata.sourceUrl ?? ''}
        onCommit={(v) => set('sourceUrl', v)}
      />
      <TextRow
        label="Tag"
        value={metadata.htmlId ?? ''}
        onCommit={(v) => set('htmlId', v)}
      />
      <TextRow
        label="Link"
        value={metadata.link ?? ''}
        onCommit={(v) => set('link', v)}
      />
    </>
  );
}

export const MetadataSection: PropertySection = {
  id: 'metadata',
  title: 'Metadata',
  isAvailable: (ctx) => ctx.layer != null,
  Component: MetadataPanel,
};
```

- [ ] **Step 4: 扩展 context with onExport**

在 `PropertySection.ts` 的 `PropertyContextValue` 加 `onExport?: () => void;`；在 `PropertiesPanel` 构造 `ctx` 时传入 `onExport: () => {}`（占位）或复用 `EditorPage` 的导出 overlay 回调。将 `props.onOpenColor` 旁新增 `onExport?: () => void`。

- [ ] **Step 5: 注册 + typecheck + 提交**

`registry.tsx` 顺序：Header, Alignment, Position, Layout, Appearance, Fill, Stroke, Typography, Effects, Export, Metadata。typecheck → PASS。

```bash
git add apps/desktop/src/components/editor/properties/sections/AlignmentSection.tsx apps/desktop/src/components/editor/properties/sections/ExportSection.tsx apps/desktop/src/components/editor/properties/sections/MetadataSection.tsx apps/desktop/src/components/editor/properties/PropertySection.ts apps/desktop/src/components/editor/properties/registry.tsx apps/desktop/src/components/editor/PropertiesPanel.tsx
git commit -m "feat(desktop): Alignment, Export and Metadata property sections"
```

---

### Task 8: 全量验证

**Files:** 无（验证任务）

- [ ] **Step 1: 全仓 typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 3: 单测**

Run: `pnpm --filter @dt-ai-design/design-schema test:run`；`pnpm --filter @dt-ai-design/editor-core test:run`；`pnpm --filter @dt-ai-design/editor-interaction test:run`
Expected: PASS

- [ ] **Step 4: 手动走查**

Run: `pnpm dev`
逐项确认：

- 工具栏分组、Primitives Flyout、Pen 子工具栏渲染正常；占位工具置灰。
- 选中矩形/椭圆/Frame/文本/便签，右侧 Section 集合随类型变化。
- Position/Layout/Appearance/Fill/Stroke/Typography/Effects/Export/Metadata 可编辑并实时反映到画布，`Cmd/Ctrl+Z` 可撤销。
- 多选时值不一致显示空态（"Mixed"）。

- [ ] **Step 5: 更新执行追踪文档**

在 `doc/execution-tracker.md` 追加本次完成的模块。

- [ ] **Step 6: 提交**

```bash
git add doc/execution-tracker.md
git commit -m "docs: record pen.dev toolbar/properties alignment progress"
```

---

## Self-Review

- **Spec coverage**：spec §5（目录结构、接口、注册顺序）、§5.4（各 Section 字段）、§5.5（控件规范）均覆盖；§6 默认值在计划 A 的 `createLayer` 中。
- **Placeholder scan**：Export 的 `onChange={() => {}}` 与 `onExport` 占位为**有意占位**（spec 非目标：Export 实际落盘），已在文中标注。
- **Type consistency**：`PropertyContextValue` 字段（editor/layer/layers/isMulti/onExport）在各 Section 与 `PropertiesPanel` 一致；`StyleField` 与 `appendStyleItem` 签名一致；`layout.mode` 值与计划 A 的 `FrameLayoutMode` 一致。

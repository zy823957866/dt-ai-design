# 计划 A：数据模型对齐 pen.dev（design-schema）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `@dt-ai-design/design-schema` 的布局模型改造为 pen.dev 单轴模型，并定向扩展 `layerPosition`/`metadata`/四角圆角/混合模式/渐变与效果类型，同时更新所有调用点。

**Architecture:** 只改数据模型层与其直接调用点（默认值、zod、旧结构归一化、示例文档、agent prompt）。渲染层当前未消费 `FrameLayout`，因此改动局限。

**Tech Stack:** TypeScript 6、Zod 4、Vitest 5、pnpm workspaces。

## Global Constraints

- 包名：`@dt-ai-design/design-schema`；构建 `tsdown`；测试 `vitest run`。
- 命名策略：保留现有字段名（`fills`/`strokes`/`effects`/`cornerRadius`），只做定向扩展。
- 每个任务结束必须：`pnpm --filter @dt-ai-design/design-schema typecheck` 与 `pnpm --filter @dt-ai-design/design-schema test:run` 通过。
- 代码风格：2 空格缩进、单引号、尾逗号（Prettier 默认，见根 `.prettierrc`）。
- 禁止新增第三方依赖。

---

## File Structure

- Modify: `packages/design-schema/src/types/styles.ts` — FrameLayout / 圆角 / 渐变 / 效果 / 枚举
- Modify: `packages/design-schema/src/types/base.ts` — BaseLayer 新字段 + BlendMode
- Modify: `packages/design-schema/src/schema/styles.schema.ts` — zod 同步
- Modify: `packages/design-schema/src/schema/base.schema.ts` — zod 同步
- Modify: `packages/design-schema/src/schema/layers.schema.ts` — cornerRadius 放宽、frame/image
- Modify: `packages/design-schema/src/utils/layer.ts` — 默认值（defaultFrameLayout、baseLayerProps、cornerRadius）
- Create: `packages/design-schema/src/utils/migrate.ts` — 旧 FrameLayout 归一化
- Modify: `packages/design-schema/src/utils/index.ts` — 导出 migrate
- Modify: `packages/design-schema/src/tests/layer.test.ts` — 更新 frame 断言
- Create: `packages/design-schema/src/tests/frameLayout.test.ts` — 新模型测试
- Create: `packages/design-schema/src/tests/migrate.test.ts` — 归一化测试
- Modify: `apps/desktop/src/pages/editor/EditorPage.tsx` — 示例文档 layout 字段
- Modify: `packages/agent-orchestrator/src/prompt.ts` — layout 描述字符串

---

### Task 1: FrameLayout 单轴化（类型 + zod + 默认值 + 测试）

**Files:**

- Modify: `packages/design-schema/src/types/styles.ts`
- Modify: `packages/design-schema/src/schema/styles.schema.ts`
- Modify: `packages/design-schema/src/utils/layer.ts:50-53`
- Modify: `packages/design-schema/src/tests/layer.test.ts:64-70`
- Test: `packages/design-schema/src/tests/frameLayout.test.ts`

**Interfaces:**

- Produces:
  - `FrameLayoutMode = 'none' | 'vertical' | 'horizontal'`
  - `JustifyContent = 'start' | 'center' | 'end' | 'spaceBetween' | 'spaceAround'`
  - `AlignItems = 'start' | 'center' | 'end'`
  - `interface FrameLayout { mode: FrameLayoutMode; gap: number; padding: Padding; justifyContent: JustifyContent; alignItems: AlignItems }`
  - `defaultFrameLayout: FrameLayout`（导出供测试）
  - `frameLayoutSchema` (zod)

- [ ] **Step 1: 写失败测试**

Create `packages/design-schema/src/tests/frameLayout.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createLayer } from '../index';
import type { FrameLayer } from '../types';

describe('FrameLayout (pen.dev single-axis)', () => {
  it('frame defaults to mode none with zero spacing', () => {
    const frame = createLayer('frame') as FrameLayer;
    expect(frame.layout.mode).toBe('none');
    expect(frame.layout.gap).toBe(0);
    expect(frame.layout.padding).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
    expect(frame.layout.justifyContent).toBe('start');
    expect(frame.layout.alignItems).toBe('start');
  });

  it('does not expose removed flex fields', () => {
    const frame = createLayer('frame') as FrameLayer;
    expect('enabled' in frame.layout).toBe(false);
    expect('wrap' in frame.layout).toBe(false);
    expect('alignContent' in frame.layout).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @dt-ai-design/design-schema test:run -- frameLayout`
Expected: FAIL（`frame.layout.mode` 为 undefined）

- [ ] **Step 3: 改类型**

在 `packages/design-schema/src/types/styles.ts` 中，把 `FlexDirection`/`FlexWrap`/`JustifyContent`/`AlignItems`/`AlignContent`/`FlexLayout`/`FrameLayout` 区块（约 93–176 行）替换为：

```ts
// ===== Frame Layout（pen.dev 单轴模型）=====

export const FrameLayoutMode = {
  NONE: 'none',
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal',
} as const;
export type FrameLayoutMode =
  (typeof FrameLayoutMode)[keyof typeof FrameLayoutMode];

export const JustifyContent = {
  START: 'start',
  CENTER: 'center',
  END: 'end',
  SPACE_BETWEEN: 'spaceBetween',
  SPACE_AROUND: 'spaceAround',
} as const;
export type JustifyContent =
  (typeof JustifyContent)[keyof typeof JustifyContent];

export const AlignItems = {
  START: 'start',
  CENTER: 'center',
  END: 'end',
} as const;
export type AlignItems = (typeof AlignItems)[keyof typeof AlignItems];

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface FrameLayout {
  mode: FrameLayoutMode;
  gap: number;
  padding: Padding;
  justifyContent: JustifyContent;
  alignItems: AlignItems;
}
```

> 注意：删除 `FlexDirection`、`FlexWrap`、`AlignContent`、`FlexLayout`、别名 `FlexAlign`。若其它文件仍引用它们，Task 5 会处理。

- [ ] **Step 4: 改 zod**

在 `packages/design-schema/src/schema/styles.schema.ts` 中，把 `flexDirectionSchema` ~ `frameLayoutSchema`（53–110 行）替换为：

```ts
export const frameLayoutModeSchema = z.enum(['none', 'vertical', 'horizontal']);
export const justifyContentSchema = z.enum([
  'start',
  'center',
  'end',
  'spaceBetween',
  'spaceAround',
]);
export const alignItemsSchema = z.enum(['start', 'center', 'end']);

export const paddingSchema = z.object({
  top: z.number().min(0),
  right: z.number().min(0),
  bottom: z.number().min(0),
  left: z.number().min(0),
});

export const frameLayoutSchema = z.object({
  mode: frameLayoutModeSchema,
  gap: z.number().min(0),
  padding: paddingSchema,
  justifyContent: justifyContentSchema,
  alignItems: alignItemsSchema,
});
```

- [ ] **Step 5: 改默认值**

在 `packages/design-schema/src/utils/layer.ts` 中，把 `defaultFrameLayout`（50–53 行）替换为：

```ts
/** 默认 Frame 布局（pen.dev 单轴模型） */
const defaultFrameLayout: FrameLayout = {
  mode: 'none',
  gap: 0,
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  justifyContent: 'start',
  alignItems: 'start',
};
```

- [ ] **Step 6: 更新旧断言**

把 `packages/design-schema/src/tests/layer.test.ts:68` 的 `expect(frame.layout.enabled).toBe(false);` 改为：

```ts
expect(frame.layout.mode).toBe('none');
```

- [ ] **Step 7: 运行测试确认通过**

Run: `pnpm --filter @dt-ai-design/design-schema test:run`
Expected: PASS（含 frameLayout 与 layer 测试）

- [ ] **Step 8: 提交**

```bash
git add packages/design-schema/src/types/styles.ts packages/design-schema/src/schema/styles.schema.ts packages/design-schema/src/utils/layer.ts packages/design-schema/src/tests/layer.test.ts packages/design-schema/src/tests/frameLayout.test.ts
git commit -m "refactor(design-schema): switch FrameLayout to pen.dev single-axis model"
```

---

### Task 2: BaseLayer 扩展 layerPosition / metadata，BlendMode 补齐

**Files:**

- Modify: `packages/design-schema/src/types/base.ts`
- Modify: `packages/design-schema/src/schema/base.schema.ts`
- Modify: `packages/design-schema/src/utils/layer.ts:86-110`
- Test: `packages/design-schema/src/tests/baseLayer.test.ts`

**Interfaces:**

- Produces:
  - `type LayerPosition = 'auto' | 'absolute'`
  - `interface LayerMetadata { sourceUrl?: string; htmlId?: string; link?: string }`
  - `BaseLayer.layerPosition: LayerPosition`（默认 `'auto'`）
  - `BaseLayer.metadata?: LayerMetadata`
  - `BlendMode` 含 `'linearBurn'` 与 `'colorDodge'`（含原有 16 项，共 18 项）
  - `layerPositionSchema`、`layerMetadataSchema`（zod）

- [ ] **Step 1: 写失败测试**

Create `packages/design-schema/src/tests/baseLayer.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createLayer } from '../index';
import { BlendMode } from '../types';
import type { RectangleLayer } from '../types';

describe('BaseLayer extensions', () => {
  it('defaults layerPosition to auto', () => {
    const rect = createLayer('rectangle') as RectangleLayer;
    expect(rect.layerPosition).toBe('auto');
  });

  it('exposes 18 blend modes including linearBurn and colorDodge', () => {
    expect(BlendMode.LINEAR_BURN).toBe('linearBurn');
    expect(BlendMode.COLOR_DODGE).toBe('colorDodge');
    expect(Object.keys(BlendMode)).toHaveLength(18);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @dt-ai-design/design-schema test:run -- baseLayer`
Expected: FAIL

- [ ] **Step 3: 改 BlendMode（types/base.ts）**

把 `BlendMode`（21–39 行）替换为（补 `LINEAR_BURN`/`COLOR_DODGE`，顺序对齐 pen.dev）：

```ts
export const BlendMode = {
  NORMAL: 'normal',
  DARKEN: 'darken',
  MULTIPLY: 'multiply',
  LINEAR_BURN: 'linearBurn',
  COLOR_BURN: 'colorBurn',
  LIGHTEN: 'lighten',
  SCREEN: 'screen',
  LINEAR_DODGE: 'linearDodge',
  COLOR_DODGE: 'colorDodge',
  OVERLAY: 'overlay',
  SOFT_LIGHT: 'softLight',
  HARD_LIGHT: 'hardLight',
  DIFFERENCE: 'difference',
  EXCLUSION: 'exclusion',
  HUE: 'hue',
  SATURATION: 'saturation',
  COLOR: 'color',
  LUMINOSITY: 'luminosity',
} as const;
export type BlendMode = (typeof BlendMode)[keyof typeof BlendMode];
```

> 注：原 `LIGHTEN` 值为 `'lighten'`；pen.dev 列表含 `lighten`，保留。若原实现只有 `lighten` 无 `linearDodge`，此处补上 `LINEAR_DODGE: 'linearDodge'`。

- [ ] **Step 4: 加类型字段（types/base.ts）**

在 `LayerType` 之后、`BaseLayer` 之前插入：

```ts
export type LayerPosition = 'auto' | 'absolute';

export interface LayerMetadata {
  sourceUrl?: string;
  htmlId?: string;
  link?: string;
}
```

并在 `BaseLayer` 末尾（`blendMode: BlendMode;` 之后）加：

```ts
  layerPosition: LayerPosition;
  metadata?: LayerMetadata;
```

- [ ] **Step 5: 改 zod（schema/base.schema.ts）**

在 `blendModeSchema` 的 enum 中加入 `'linearBurn'`、`'linearDodge'`、`'colorDodge'`；新增：

```ts
export const layerPositionSchema = z.enum(['auto', 'absolute']);

export const layerMetadataSchema = z.object({
  sourceUrl: z.string().optional(),
  htmlId: z.string().optional(),
  link: z.string().optional(),
});
```

并在 `baseLayerSchema` 末尾加：

```ts
  layerPosition: layerPositionSchema,
  metadata: layerMetadataSchema.optional(),
```

- [ ] **Step 6: 改默认值（utils/layer.ts）**

在 `baseLayerProps`（87–110 行）返回对象里 `blendMode: 'normal',` 之后加：

```ts
    layerPosition: 'auto' as const,
```

- [ ] **Step 7: 运行测试确认通过**

Run: `pnpm --filter @dt-ai-design/design-schema test:run`
Expected: PASS

- [ ] **Step 8: 提交**

```bash
git add packages/design-schema/src/types/base.ts packages/design-schema/src/schema/base.schema.ts packages/design-schema/src/utils/layer.ts packages/design-schema/src/tests/baseLayer.test.ts
git commit -m "feat(design-schema): add layerPosition, metadata, extend BlendMode"
```

---

### Task 3: CornerRadius 支持四角

**Files:**

- Modify: `packages/design-schema/src/types/styles.ts`
- Modify: `packages/design-schema/src/schema/styles.schema.ts`
- Modify: `packages/design-schema/src/schema/layers.schema.ts`（frame/image 的 cornerRadius）
- Test: `packages/design-schema/src/tests/cornerRadius.test.ts`

**Interfaces:**

- Produces: `type CornerRadius = number | CornerRadiusPerCorner`；`interface CornerRadiusPerCorner { topLeft; topRight; bottomRight; bottomLeft }`；`cornerRadiusSchema` 已存在（复用）。

- [ ] **Step 1: 写失败测试**

Create `packages/design-schema/src/tests/cornerRadius.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { cornerRadiusSchema } from '../schema/styles.schema';

describe('cornerRadiusSchema', () => {
  it('accepts a uniform number', () => {
    expect(cornerRadiusSchema.parse(8)).toBe(8);
  });

  it('accepts four corners', () => {
    const v = { topLeft: 8, topRight: 0, bottomRight: 8, bottomLeft: 0 };
    expect(cornerRadiusSchema.parse(v)).toEqual(v);
  });

  it('rejects negative values', () => {
    expect(() => cornerRadiusSchema.parse(-1)).toThrow();
  });
});
```

- [ ] **Step 2: 运行测试确认通过（schema 已具备）**

Run: `pnpm --filter @dt-ai-design/design-schema test:run -- cornerRadius`
Expected: PASS（`cornerRadiusSchema` 已存在）。若失败则补 schema。

- [ ] **Step 3: 类型保持不变即可验证存在**

确认 `types/styles.ts` 已有：

```ts
export type CornerRadius = number | CornerRadiusPerCorner;
export interface CornerRadiusPerCorner {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}
```

- [ ] **Step 4: 放宽 frame/image 的 zod**

在 `packages/design-schema/src/schema/layers.schema.ts`：把 `frameLayerSchema` 的 `cornerRadius: z.number().min(0)` 与 `imageLayerSchema` 的 `cornerRadius: z.number().min(0)` 改为 `cornerRadius: cornerRadiusSchema,`（`cornerRadiusSchema` 已在文件顶部 import）。

- [ ] **Step 5: 运行测试与 typecheck**

Run: `pnpm --filter @dt-ai-design/design-schema test:run`；`pnpm --filter @dt-ai-design/design-schema typecheck`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add packages/design-schema/src/schema/layers.schema.ts packages/design-schema/src/tests/cornerRadius.test.ts
git commit -m "feat(design-schema): allow per-corner radius on frame and image"
```

---

### Task 4: FillType（angular/mesh）与 EffectType（shader）扩展

**Files:**

- Modify: `packages/design-schema/src/types/styles.ts`
- Modify: `packages/design-schema/src/schema/styles.schema.ts`
- Test: `packages/design-schema/src/tests/fillEffect.test.ts`

**Interfaces:**

- Produces: `FillType.ANGULAR_GRADIENT='angularGradient'`、`FillType.MESH_GRADIENT='meshGradient'`；`FillStyle.gradientType?: 'linear'|'radial'|'angular'|'mesh'`；`EffectType.SHADER='shader'`。

- [ ] **Step 1: 写失败测试**

Create `packages/design-schema/src/tests/fillEffect.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { FillType, EffectType } from '../types';
import { fillStyleSchema, effectTypeSchema } from '../schema/styles.schema';

describe('fill/effect extensions', () => {
  it('exposes angular and mesh gradient fill types', () => {
    expect(FillType.ANGULAR_GRADIENT).toBe('angularGradient');
    expect(FillType.MESH_GRADIENT).toBe('meshGradient');
  });

  it('accepts a shader effect type', () => {
    expect(EffectType.SHADER).toBe('shader');
    expect(effectTypeSchema.parse('shader')).toBe('shader');
  });

  it('accepts gradientType on a fill', () => {
    const fill = fillStyleSchema.parse({
      type: 'linearGradient',
      gradientType: 'angular',
      opacity: 1,
    });
    expect(fill.gradientType).toBe('angular');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @dt-ai-design/design-schema test:run -- fillEffect`
Expected: FAIL

- [ ] **Step 3: 改类型（types/styles.ts）**

`FillType` 增两项：

```ts
export const FillType = {
  NONE: 'none',
  SOLID: 'solid',
  LINEAR_GRADIENT: 'linearGradient',
  RADIAL_GRADIENT: 'radialGradient',
  ANGULAR_GRADIENT: 'angularGradient',
  MESH_GRADIENT: 'meshGradient',
  IMAGE: 'image',
} as const;
```

`FillStyle` 增字段：

```ts
export interface FillStyle {
  type: FillType;
  color?: string;
  gradientStops?: GradientStop[];
  gradientAngle?: number;
  gradientType?: 'linear' | 'radial' | 'angular' | 'mesh';
  imageSrc?: string;
  imageFit?: ImageFitMode;
  opacity: number;
}
```

`EffectType` 增一项：

```ts
  SHADER: 'shader',
```

- [ ] **Step 4: 改 zod（schema/styles.schema.ts）**

`fillTypeSchema` 增 `'angularGradient'`、`'meshGradient'`；`fillStyleSchema` 增：

```ts
  gradientType: z.enum(['linear', 'radial', 'angular', 'mesh']).optional(),
```

`effectTypeSchema` 增 `'shader'`。

- [ ] **Step 5: 运行测试确认通过**

Run: `pnpm --filter @dt-ai-design/design-schema test:run`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add packages/design-schema/src/types/styles.ts packages/design-schema/src/schema/styles.schema.ts packages/design-schema/src/tests/fillEffect.test.ts
git commit -m "feat(design-schema): add angular/mesh gradients and shader effect type"
```

---

### Task 5: 旧 FrameLayout 归一化 + 更新所有调用点 + 全仓 typecheck

**Files:**

- Create: `packages/design-schema/src/utils/migrate.ts`
- Modify: `packages/design-schema/src/utils/index.ts`
- Test: `packages/design-schema/src/tests/migrate.test.ts`
- Modify: `apps/desktop/src/pages/editor/EditorPage.tsx:278,614`
- Modify: `packages/agent-orchestrator/src/prompt.ts:28`

**Interfaces:**

- Consumes: `FrameLayout`、`defaultFrameLayout`
- Produces: `normalizeFrameLayout(raw: unknown): FrameLayout`

- [ ] **Step 1: 写失败测试**

Create `packages/design-schema/src/tests/migrate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalizeFrameLayout } from '../utils/migrate';

describe('normalizeFrameLayout', () => {
  it('maps legacy disabled layout to mode none', () => {
    expect(normalizeFrameLayout({ enabled: false }).mode).toBe('none');
  });

  it('maps legacy row direction to horizontal', () => {
    const l = normalizeFrameLayout({ enabled: true, direction: 'row', gap: 8 });
    expect(l.mode).toBe('horizontal');
    expect(l.gap).toBe(8);
  });

  it('maps legacy column direction to vertical', () => {
    expect(
      normalizeFrameLayout({ enabled: true, direction: 'column' }).mode,
    ).toBe('vertical');
  });

  it('keeps a valid new layout as-is', () => {
    const next = normalizeFrameLayout({
      mode: 'vertical',
      gap: 4,
      padding: { top: 1, right: 2, bottom: 3, left: 4 },
      justifyContent: 'center',
      alignItems: 'end',
    });
    expect(next.mode).toBe('vertical');
    expect(next.padding).toEqual({ top: 1, right: 2, bottom: 3, left: 4 });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @dt-ai-design/design-schema test:run -- migrate`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现归一化**

Create `packages/design-schema/src/utils/migrate.ts`:

```ts
import type { FrameLayout } from '../types';

const DEFAULT_PADDING = { top: 0, right: 0, bottom: 0, left: 0 };

/** 把历史 FrameLayout 结构归一化为 pen.dev 单轴模型 */
export function normalizeFrameLayout(raw: unknown): FrameLayout {
  const r = (raw ?? {}) as Record<string, unknown>;
  const mode =
    r.mode === 'vertical' || r.mode === 'horizontal' || r.mode === 'none'
      ? r.mode
      : r.direction === 'row'
        ? 'horizontal'
        : r.direction === 'column'
          ? 'vertical'
          : r.enabled === true
            ? 'horizontal'
            : 'none';

  const padding =
    r.padding && typeof r.padding === 'object'
      ? { ...DEFAULT_PADDING, ...(r.padding as object) }
      : { ...DEFAULT_PADDING };

  return {
    mode,
    gap: typeof r.gap === 'number' ? r.gap : 0,
    padding,
    justifyContent:
      (r.justifyContent as FrameLayout['justifyContent']) ?? 'start',
    alignItems: (r.alignItems as FrameLayout['alignItems']) ?? 'start',
  };
}
```

- [ ] **Step 4: 导出**

在 `packages/design-schema/src/utils/index.ts` 追加：

```ts
export * from './migrate';
```

- [ ] **Step 5: 更新示例文档（EditorPage.tsx）**

把 `apps/desktop/src/pages/editor/EditorPage.tsx:278` 的 `layout: { enabled: false },` 改为：

```ts
    layout: {
      mode: 'none',
      gap: 0,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      justifyContent: 'start',
      alignItems: 'start',
    },
```

把 `:614` 的 `layout: { enabled: true, direction: 'row', gap: 0, padding: 0 },` 改为：

```ts
    layout: {
      mode: 'horizontal',
      gap: 0,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      justifyContent: 'start',
      alignItems: 'start',
    },
```

- [ ] **Step 6: 更新 agent prompt 文案**

把 `packages/agent-orchestrator/src/prompt.ts:28` 中 frame 的 layout 描述替换为：

```
- "frame": children: string[], layout: { "mode": "none"|"vertical"|"horizontal", "gap": number, "padding": {"top":number,"right":number,"bottom":number,"left":number}, "justifyContent": "start"|"center"|"end"|"spaceBetween"|"spaceAround", "alignItems": "start"|"center"|"end" }, fills, strokes, cornerRadius, effects, overflow("visible"|"hidden"), clipContent(true)
```

- [ ] **Step 7: 全仓 typecheck**

Run: `pnpm typecheck`
Expected: PASS（无残留 `FlexDirection`/`FlexWrap`/`AlignContent`/`layout.enabled` 引用）。若报错，按提示定位并改为新模型。

- [ ] **Step 8: 全量测试**

Run: `pnpm --filter @dt-ai-design/design-schema test:run`；`pnpm --filter @dt-ai-design/editor-core test:run`
Expected: PASS

- [ ] **Step 9: 提交**

```bash
git add packages/design-schema/src/utils/migrate.ts packages/design-schema/src/utils/index.ts packages/design-schema/src/tests/migrate.test.ts apps/desktop/src/pages/editor/EditorPage.tsx packages/agent-orchestrator/src/prompt.ts
git commit -m "feat(design-schema): add FrameLayout migration and update call sites"
```

---

## Self-Review

- **Spec coverage**：覆盖 spec §3.1（FrameLayout）、§3.2（BaseLayer/BlendMode）、§3.3（四角圆角）、§3.4（Fill/Effect）、§3.6（归一化）。TextSizing 保留（§3.5，无需改代码）。
- **Placeholder scan**：无 TBD/TODO；每个代码步骤含完整代码。
- **Type consistency**：`FrameLayout` 字段（`mode/gap/padding/justifyContent/alignItems`）在类型、zod、默认值、迁移、示例文档中一致；`normalizeFrameLayout` 返回 `FrameLayout`。
- **后续**：工具栏见 `doc/superpowers/plans/2026-10-16-pen-toolbar-alignment.md`；属性面板见 `doc/superpowers/plans/2026-10-16-pen-properties-panel.md`。

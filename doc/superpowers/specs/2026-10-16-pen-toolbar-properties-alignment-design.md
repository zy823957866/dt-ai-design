# 设计：对齐 pen.dev 工具栏 + 属性面板标准

- 状态：已定稿（待用户复核）
- 日期：2026-10-16
- 关联参考：`doc/pencil-toolbar-properties-reference.md`（源码级标准）、`doc/pencil-desktop-interface.md`、`doc/canvas-editor-architecture-reference.md`（部分为旧结构，仅供参考）

---

## 1. 背景

`dt-ai-design` 是一个 pnpm monorepo 的 AI 设计工具，桌面端 `apps/desktop`（React 19 + Tailwind v4 + shadcn/ui）已有画布、工具栏与属性面板雏形：

- 工具栏 `apps/desktop/src/components/editor/Toolbar.tsx`：10 个按钮（含 `triangle`），硬编码数组。
- 属性面板 `apps/desktop/src/components/editor/PropertiesPanel.tsx`（462 行单文件）：Design/Dev Tab，Layout 与 Shadow 为本地 state 占位，未接数据模型。
- 数据模型 `packages/design-schema`：类型较完整，但 `FrameLayout` 为 CSS-flex 风格（row/column/reverse + wrap + alignContent）。
- 交互层 `packages/editor-interaction`：`CanvasToolId` 含 `triangle`，缺 scale/comment/polygon/icon/script。
- 渲染层：**未实现 Flex 布局**（`CanvasDocumentRenderer` 未读取 `FrameLayout`）。

对照 pen.dev 官方桌面端的源码级标准（见参考文档），现有实现差距较大。本设计给出对齐方案。

## 2. 目标与非目标

### 2.1 目标

1. **工具栏**对齐 pen.dev 分组、按钮、Flyout、子工具栏与快捷键。
2. **属性面板**重构为声明式 Section 注册表，与 pen.dev 的 `{ name, useAvailable, Panel }` 机制一致。
3. 补齐核心属性 Section：Alignment、Position、Layout、Appearance、Fill、Stroke、Typography、Effects、Export、Metadata。
4. **数据模型**定向扩展以承载上述 Section；`FrameLayout` 对齐 pen.dev 单轴模型。
5. 全仓 `typecheck` / `lint` / 单测通过。

### 2.2 非目标（后续独立 spec）

- Script 节点/面板、Browser 节点/面板、Icon 节点、Theme、Slot、Component、Vector（路径编辑面板）、Shader 编辑器。
- 真机型的 Icon 库接入、Export 实际落盘、Code 面板实现。
- Dev Tab 的实际代码生成（维持占位）。
- AI 引擎 / MCP（Phase 8）。

## 3. 数据模型变更（`packages/design-schema`）

命名策略：**保留现有字段名**（`fills`/`strokes`/`effects`/`cornerRadius`），只做定向扩展；UI 文案采用 pen.dev 措辞。

### 3.1 FrameLayout（对齐 pen.dev 单轴）

`packages/design-schema/src/types/styles.ts`：

```ts
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

export const AlignItems = {
  START: 'start',
  CENTER: 'center',
  END: 'end',
} as const;

export interface FrameLayout {
  mode: FrameLayoutMode;
  gap: number;
  padding: Padding;
  justifyContent: JustifyContent;
  alignItems: AlignItems;
}
```

- 移除 `enabled` / `direction` / `wrap` / `alignContent` / `rowGap` / `columnGap`（pen.dev 无 wrap，单轴）。
- 默认（`packages/design-schema/src/utils/layer.ts` 的 `defaultFrameLayout`）：
  `{ mode: 'none', gap: 0, padding: {top:0,right:0,bottom:0,left:0}, justifyContent: 'start', alignItems: 'start' }`。
- 同步更新：`packages/design-schema/src/schema/styles.schema.ts`（zod）。
- 同步更新：`packages/agent-orchestrator/src/prompt.ts` 中 frame 的 layout 描述字符串。

### 3.2 BaseLayer 扩展

`packages/design-schema/src/types/base.ts`：

```ts
export type LayerPosition = 'auto' | 'absolute';

export interface LayerMetadata {
  sourceUrl?: string;
  htmlId?: string;
  link?: string;
}

export interface BaseLayer {
  // ...现有字段
  layerPosition: LayerPosition; // 默认 'auto'
  metadata?: LayerMetadata;
}
```

- `BlendMode` 补齐到 pen.dev 18 项：现有 16 项外补 `linearBurn`、`colorDodge`（顺序对齐 pen.dev 列表）。
- `createLayer`（`design-schema`/`layer.ts`）默认填入 `layerPosition: 'auto'`。

### 3.3 圆角（四角）

`styles.ts`：

```ts
export type CornerRadius = number | CornerRadiusPerCorner;
export interface CornerRadiusPerCorner {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}
```

- `RectangleLayer.cornerRadius`、`FrameLayer.cornerRadius`、`ImageLayer.cornerRadius` 类型放宽为 `CornerRadius`。
- 渲染层对对象形式取 `topLeft`（本阶段不支持四角差异化渲染则统一取 `topLeft` 并标注）。

### 3.4 填充 / 效果扩展

- `FillType` 增加 `ANGULAR_GRADIENT: 'angularGradient'` 与 `MESH_GRADIENT: 'meshGradient'`；`FillStyle` 增 `gradientType?: 'linear'|'radial'|'angular'|'mesh'`（保留 `gradientAngle`）。
  - 本阶段 UI 支持 linear/radial/angular；mesh 按钮存在但置灰。
- `EffectType` 保留现有集合（含 Glow），新增 `SHADER: 'shader'` 占位。

### 3.5 文本

- 保留 `TextSizing`（autoWidth/autoHeight/fixed）；UI 标签对齐 pen.dev：Auto width / Auto height / Fixed size。不改字段名。

### 3.6 迁移与兼容

- 因渲染层未使用 `FrameLayout`，改造仅影响 schema、zod、默认值、agent prompt、以及新的属性面板。
- 对已存在的 `.pen`/文档 JSON，反序列化时对旧 `FrameLayout` 结构做一次归一化（`enabled:false` → `mode:'none'`；`direction:'row'` → `mode:'horizontal'`；`'column'` → `mode:'vertical'`；其余字段丢弃）。放置于 `design-schema` 的 document 校验/迁移函数中（若现有校验入口存在）。

## 4. 工具栏设计

### 4.1 工具 id（`packages/editor-interaction/src/types.ts`）

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

- `select` 重命名为 `move`；移除 `triangle`。
- 需同步 `reducer.ts`、`EditorInteractionProvider.tsx`（`editor.setActiveTool`）、`editor-core` 的 `getActiveTool/setActiveTool` 类型与 `apps/desktop` 使用点。

### 4.2 工具栏配置（数据驱动）

`apps/desktop/src/components/editor/toolbar/toolConfig.ts`：

```ts
export interface ToolDef {
  id: CanvasToolId;
  label: string;
  shortcut: string;
  enabled: boolean;
}
export interface ToolGroup {
  id: string;
  label?: string;
  tools: ToolDef[];
  pinned?: CanvasToolId[];
  flyout?: boolean;
  desktopOnly?: boolean;
}
export const TOOL_GROUPS: ToolGroup[] = [
  /* Move Tools / Primitives / Pen / Text / Frame / Sticky / Browser / Hand / Comment */
];
```

分组（自上而下）：

| 分组       | 工具（快捷键）                                      | 说明                           |
| ---------- | --------------------------------------------------- | ------------------------------ |
| Move Tools | Move(`V`)、Scale(`K`)                               |                                |
| Primitives | Rectangle(`R`)、Ellipse(`O`)、Polygon、Icon、Script | Flyout；钉住 Rectangle+Ellipse |
| —          | Pen(`P`)                                            | 激活后展示子工具栏             |
| —          | Text(`T`)                                           |                                |
| —          | Frame(`F`/`A`)                                      |                                |
| —          | Sticky Note(`N`)                                    |                                |
| —          | Browser                                             | 仅 desktop                     |
| —          | Hand(`H`)                                           |                                |
| —          | Comment(`C`)                                        | 置灰占位                       |

### 4.3 组件结构

- `Toolbar.tsx`：渲染 `TOOL_GROUPS`；Flyout 用 shadcn `dropdown-menu`/`popover`；分隔符按分组。
- `PenSubToolbar.tsx`：Pen 激活时展示 Pen / Select points(`V`) / Cut(`X`) / Done(`Enter`)。
- `useToolShortcuts.ts`：全局 keydown → `dispatch({type:'selectTool'})`；长按 `Z` 缩放工具；`Esc` 回 Move。

### 4.4 本阶段可用性

- 可用：move、hand、frame、text、sticky、rectangle、ellipse、pen、scale（选中态 + Scale Section）。
- 占位（按钮存在、`enabled:false` + tooltip "未实现"）：polygon、icon、script、browser、comment、pen_move、pen_cut。

## 5. 属性面板架构（声明式 Section 注册表）

### 5.1 目录结构

```
apps/desktop/src/components/editor/properties/
  PropertySection.tsx        // 类型定义
  PropertyContext.tsx        // ctx 类型 + Provider（可选）
  registry.ts                // PropertySection[]（按顺序）
  sections/
    HeaderSection.tsx
    AlignmentSection.tsx
    PositionSection.tsx
    LayoutSection.tsx
    AppearanceSection.tsx
    FillSection.tsx
    StrokeSection.tsx
    TypographySection.tsx
    EffectsSection.tsx
    ExportSection.tsx
    MetadataSection.tsx
  controls/
    SectionHeader.tsx
    NumberField.tsx
    SegmentedControl.tsx
    SelectField.tsx
    CheckboxField.tsx
    ColorField.tsx
  nodeToFormValues.ts        // 保留（如需）
  formValuesToPatch.ts       // 保留（如需）
```

### 5.2 接口

```ts
export interface PropertyContextValue {
  layers: Layer[]; // 选中图层
  layer: Layer | null; // 单选时
  document: DesignDocument;
  editor: EditorApi; // apps/desktop/src/lib/editor
  activeTool: CanvasToolId;
  isMulti: boolean;
  mixed: <T>(get: (l: Layer) => T) => T | undefined; // 多选值不一致返回 undefined
}

export interface PropertySection {
  id: string;
  title: string;
  isAvailable(ctx: PropertyContextValue): boolean;
  Component: React.FC<{ ctx: PropertyContextValue }>;
}
```

### 5.3 注册顺序与可用条件（本阶段实现的子集）

| 顺序 | id         | title      | isAvailable                  |
| ---- | ---------- | ---------- | ---------------------------- |
| 1    | header     | —          | 有选中                       |
| 2    | alignment  | Alignment  | 非只读                       |
| 3    | position   | Position   | 始终                         |
| 4    | layout     | Layout     | 始终（frame 显示 Flex 内容） |
| 5    | appearance | Appearance | 始终                         |
| 6    | fill       | Fill       | 图层含 `fills`               |
| 7    | stroke     | Stroke     | 图层含 `strokes`             |
| 8    | typography | Typography | `type==='text'`              |
| 9    | effects    | Effects    | 图层含 `effects`             |
| 10   | export     | Export     | 非 browser                   |
| 11   | metadata   | Metadata   | 单选且有 `metadata`          |

- `PropertiesPanel` 仅负责：折叠态、Header（Properties + 折叠按钮）、Design/Dev Tab、遍历 `registry` 渲染可用 Section。
- 多选：`isMulti` 时 Section 按 `mixed()` 决定输入框空态；写入统一应用到所有选中图层（复用现有批处理）。
- 写路径：复用 `editor.setLayerProperty` / `editor.resizeLayer`；新增暴露 `appendFill/updateFill/removeFill/appendStroke/.../appendEffect/...`（来自 `editor-core/src/commands.ts`）到 `lib/editor`。

### 5.4 各 Section 字段

按参考文档 §三执行，摘要：

- **Position**：X、Y、Rotation(°)、Flip H/V、Absolute Position(复选框 ↔ `layerPosition`)。
- **Layout**：mode 三段式(Freeform/Vertical/Horizontal)、Alignment 3×3、Gap、Padding(Dual/Quad)、W/H、Fill Width/Height、Hug Width/Height（frame）；文本时显示 Resizing(Auto width/Auto height/Fixed size)。
- **Appearance**：Opacity(0–100%)、Corner radius(+四角)、Clip Content(frame)、Blend mode(18 项)、Ellipse 组(start/sweep/inner radius)、Polygon 组（占位）。
- **Fill**：填充列表（Color/Gradient[Linear/Radial/Angular/Mesh 占位]/Image[Fill/Fit/Stretch]）+ blendMode + 列表操作。
- **Stroke**：描边列表 + Position(Center/Inside/Outside) + Weight + Join(Miter/Round/Bevel) + Cap(Butt/Square/Round)。
- **Typography**：Font family(搜索)、Weight/Style、Size、Line height(%)、Letter spacing(px)、水平对齐(Left/Center/Right/Justify)、垂直对齐(Top/Middle/Bottom)、Decoration(U/N/S)。
- **Effects**：效果列表，Add 菜单 Drop Shadow / Inner Shadow / Layer Blur / Background Blur / Shader(占位)；Shadow 子项 color/x/y/blur/blendMode；Blur radius（Layer/Background 各限一条）。
- **Export**：Type(PNG/JPEG/WEBP/PDF)、Scale(1x/2x/3x)、Quality(High/Low/Lossless)、Export 按钮（复用现有 `ExportDialog` 或占位触发）。
- **Metadata**：Source、Tag、Link。
- **Alignment**：3 水平 + 3 垂直（复用 `alignSelection` / `distributeSelection`）。

### 5.5 控件规范

- `NumberField`：可拖拽 scrub（pointer lock）、`↑↓`=步进 1、`Shift`=步进 10、可选 `suffix`（`°`/`%`/`px`）、可选 `min/max`、`disabled`。
- `SegmentedControl`：等宽分段按钮，受控 `value/options/onChange`。
- `SelectField`：shadcn Select 封装。
- `CheckboxField`：shadcn Checkbox + label。
- `ColorField`：包裹现有 `color-picker`，展示色块 + hex。
- 样式复用现有设计 token（`bg-bg-input`、`text-text-secondary`、`accent-*` 等）。

## 6. 默认值与范围（对齐 pen.dev）

新建对象默认值（`design-schema` 的 `createLayer`）：Rectangle/Ellipse `#CCCCCC`；Frame `#FFFFFF` + `clipContent:true` + `mode:'none'`；Text `fontSize:16`；通用 opacity 1、cornerRadius 0、stroke width 1、position center、join miter、blendMode normal。控件范围见参考文档 §三。

## 7. 分期实施

- **Phase A — 数据模型**：`FrameLayout` 单轴化、`CornerRadius` 四角、`BlendMode` 补齐、`layerPosition`/`metadata`、`FillType`/`EffectType` 扩展；更新 zod、默认值、agent prompt、旧结构归一化；补 `design-schema` 单测。
- **Phase B — 工具栏**：`CanvasToolId` 扩展 + reducer/provider/core 同步；`toolConfig` + `Toolbar` 渲染 + Flyout + Pen 子工具栏 + 快捷键。
- **Phase C — 面板骨架**：`PropertySection` 接口 + `registry` + `PropertyContext` + 共享控件；`PropertiesPanel` 改为遍历注册表（先迁移现有 name/position/fill 等到 Section）。
- **Phase D — Section 实现**：Position、Layout、Appearance、Fill、Stroke、Typography、Effects、Export、Metadata、Alignment。
- **Phase E — 联调验证**：`pnpm typecheck`、`pnpm lint`、`pnpm --filter @dt-ai-design/design-schema test`、`editor-core` 测试；`pnpm dev` 手动走查。

## 8. 测试与验证

- 单元：`design-schema`（新 defaults、FrameLayout 归一化、zod）、`editor-core`（append/update/remove fill/stroke/effect 已有测试，补充类型）。
- 类型：全仓 `pnpm typecheck`。
- Lint：`pnpm lint`。
- 手动：`pnpm dev` — 逐个工具切换、Primitives Flyout、Pen 子工具栏；选中各类型图层检查 Section 渲染与写回；多选编辑；Layout mode 切换。

## 9. 风险与缓解

| 风险                                              | 影响                  | 缓解                                                      |
| ------------------------------------------------- | --------------------- | --------------------------------------------------------- |
| `CanvasToolId` 重命名（select→move、去 triangle） | 编译错误扩散          | 全仓搜索使用点（reducer/provider/core/desktop），集中替换 |
| `FrameLayout` 结构变更                            | agent prompt / 旧文档 | 渲染层未使用；提供归一化；更新 prompt 文案                |
| 面板重构                                          | 现有交互回归          | 保留 editor API 契约；分步迁移 Section；手动走查          |
| 四角圆角渲染未支持                                | 视觉不一致            | 本阶段渲染取 `topLeft`，文档标注后续支持                  |

## 10. 交付物

- 代码变更（schema / editor-interaction / editor-core / desktop）。
- 更新后的参考文档链接与实施记录。
- 通过的 typecheck / lint / 单测。

---

_实施计划见 `doc/superpowers/plans/` 下的同名计划文档。_

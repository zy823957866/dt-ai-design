# dt-ai-design 画布编辑器改造执行计划（基于 miaoma-design-ai 参考）

> 对照 `miaoma-design-ai` 的画布编辑器架构（见 `doc/canvas-editor-architecture-reference.md`），结合当前项目 `dt-ai-design` 的现状，制定分阶段改造计划。
> 当前项目已有：design-schema（节点 schema）、editor-core（命令/状态/选择/视口）、canvas-ruler（新 DOM 标尺）、Canvas.tsx（单文件 SVG 画布 + 工具 + 选择 + 缩放 + 拖拽）、PropertiesPanel（右侧属性栏）、Toolbar（顶部工具栏）、LeftPanel（左侧面板）。
> 核心差距：缺少独立的 interaction 状态机、画布与视口分层、react-hook-form 表单桥、CanvasStage/MiaomaEditor 编排层、统一的 Provider/订阅模式。

## 一、现状盘点

### 1.1 当前架构（单文件 Canvas 模式）

- **状态层**：`packages/editor-core`
  - `state.ts`：`createEditorState`，维护 document + selection + viewport
  - `command.ts`：命令栈（undo/redo）
  - `commands.ts`：addLayer / removeLayer / moveLayer / resizeLayer / setLayerProperty / groupSelection / ungroupSelection / frameSelection / duplicateLayer / zoomIn 等
  - `selection.ts`：getSelectedLayers / getSelectedBounds / selectAll / deselectAll
  - `viewport.ts`：zoomIn / zoomOut / zoomTo / pan / setViewport
  - `events.ts`：事件订阅（change / selectionChange / viewportChange 等）
- **React 接入**：`apps/desktop/src/lib/editor.ts` → `useEditor()` hook，事件订阅后 forceUpdate
- **画布实现**：`apps/desktop/src/components/canvas/Canvas.tsx`（约 1450 行）
  - SVG 渲染图层（矩形/椭圆/文字/便签/帧）
  - 内置工具：select / hand / rectangle / ellipse / text / frame / sticky / pen
  - 内置拖拽、框选、缩放（滚轮 + 空格抓手）
  - 内置属性操作（选中后属性栏通过 `editor.setLayerProperty` 改）
- **工具栏**：`components/editor/Toolbar.tsx`（顶部横向，9 个工具）
- **右侧属性栏**：`components/editor/PropertiesPanel.tsx`（直接读 editor 状态，改字段走 `setLayerProperty`）
- **左侧面板**：`components/editor/LeftPanel.tsx` + `panels/` 下多个子面板（AI / Assets / Colors / Variables 等）
- **标尺**：刚改造完成的 `packages/canvas-ruler`（DOM+CSS，已接入 Canvas.tsx）

### 1.2 与参考项目的核心差距

| 维度          | 参考项目 miaoma                                           | 当前项目 dt-ai                                              |
| ------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| 交互状态机    | 独立 `editor-interaction` 包（reducer）                   | 交互逻辑全部内联在 Canvas.tsx 里                            |
| 画布分层      | CanvasStage → CanvasViewportShell → 文档渲染 → 覆盖层     | 单文件 SVG，绘制、交互、选择混在一起                        |
| 视口抽象      | `viewportState.ts`（camera + scroll + travelZone + zoom） | viewport 只有 panX/panY/zoom，没有 travelZone / camera 概念 |
| 表单系统      | react-hook-form + formValuesToPatch + 双向绑定            | PropertiesPanel 直接读/写，每个字段单独 `setLayerProperty`  |
| Provider 架构 | EditorSessionProvider + EditorInteractionProvider 双层    | `useEditor()` 直接用事件 forceUpdate                        |
| 样式数组字段  | fills/strokes/effects 数组，每项有 id + 激活项            | 目前 fill 是单对象，没有数组和切换逻辑                      |
| 工具条位置    | 画布左上角浮动 rail                                       | 顶部工具栏（横向）                                          |
| 文档渲染器    | 独立 `CanvasDocumentRenderer` 组件，只负责画              | 混在 Canvas.tsx 的 SVG 里                                   |
| 选择覆盖层    | 独立 `ViewportSelectionOverlay`（屏幕坐标层）             | 内联在 SVG 里的选区框/手柄                                  |
| 创建预览      | 独立 `CanvasCreationOverlay`（屏幕坐标层）                | 直接在 SVG 里实时建节点或手画                               |

### 1.3 改造原则

- **先拆后合，先外后内**：先把外层编排（EditorProvider / CanvasStage）搭起来，再逐步把 Canvas.tsx 内部逻辑抽到独立组件。
- **保留现有能力**：不追求一步到位，每一步都能跑通，工具/选择/缩放/属性面板都能用。
- **复用已有包**：`canvas-ruler` 已经完成，直接用；`editor-core` 是状态基座，改造期间继续作为唯一数据源。
- **分阶段验收**：每个阶段结束都 typecheck + 视觉验收，确保画布、工具、属性面板、撤销重做都正常。

## 二、总体目标（最终形态）

对齐参考项目的三层架构，但保留当前项目的 UI 形态（顶部工具栏 + 左侧多 tab 面板 + 右侧属性栏）：

- **状态层**：`editor-core`（不变，仍是唯一数据源）
- **交互层**：新 `editor-interaction` 包（reducer + 命令），负责工具状态机、拖拽判定、创建预览、重父识别
- **视图层**：
  - `EditorProvider`：组合 EditorSession / Interaction，通过 context 暴露
  - `CanvasStage`：画布容器（标尺 + 视口 + 工具 rail + 覆盖层）
  - `CanvasViewport`：视口外壳（滚动 + 缩放 + 世界变换）
  - `CanvasDocumentRenderer`：节点 SVG 渲染（纯展示）
  - `ViewportSelectionOverlay`：选框 + 手柄（屏幕坐标覆盖层）
  - `CanvasCreationOverlay`：创建中预览框（屏幕坐标覆盖层）
- **属性栏**：`PropertiesPanel` 改造为 react-hook-form 驱动，字段变化 → patch → editor.setLayerProperty
- **工具栏**：保留顶部横向形态，但工具状态从 interaction 取（不再直接调用 editor.addLayer）

## 三、分阶段执行计划

### 阶段 0：已有改造收尾（已完成 ✅）

- 新建 `packages/canvas-ruler`，DOM+CSS 标尺，双主题，测试通过
- `Canvas.tsx` 接入新标尺，删除旧 SVG 标尺
- **验收**：标尺可见、缩放换挡、垂直标签旋转、鼠标指示线、暗色/亮色切换均正常

### 阶段 1：搭建编辑器编排骨架 + Provider 化

**目标**：把 `useEditor()` 的事件订阅模式替换为 context + useSyncExternalStore，为后续分层打基础。Canvas.tsx 内部暂不动，只换接入方式。

**新增 / 修改文件**

- 新增 `apps/desktop/src/components/editor/EditorProvider.tsx`（改造现有）
  - 用 `createEditorState` / `useSyncExternalStore` 把 editor 状态放进 context
  - 提供 `useEditorState()` / `useEditor()` hook
- 改造 `apps/desktop/src/lib/editor.ts`
  - 保留原 hook 但标记为 deprecated，逐步迁移到 Provider
- 新增 `apps/desktop/src/components/editor/EditorCanvasStage.tsx`
  - 只是把原 Canvas.tsx 包一层，增加 data-region 标记，预留后续分层
- 改造 `apps/desktop/src/pages/editor/EditorPage.tsx`
  - 外层包 `<EditorProvider>`（如果还没有的话）
  - 引入 EditorCanvasStage 替代直接使用 Canvas

**关键函数**

- `useEditorState()`：基于 `useSyncExternalStore` 的快照 hook
- `useEditor()`：返回命令式 editor 实例（用于 dispatch 操作）

**验收**

- 画布、工具、选择、属性栏、撤销重做都正常
- 无行为变化，纯重构

---

### 阶段 2：抽出文档渲染器（CanvasDocumentRenderer）

**目标**：把 Canvas.tsx 里「画节点」的部分拆成独立组件，只接收 document + zoom + selectedLayerIds，不处理交互。Canvas.tsx 只留交互/视口/选择。

**新增 / 修改文件**

- 新增 `apps/desktop/src/components/canvas/CanvasDocumentRenderer.tsx`
  - 输入：`document` / `zoom` / `selectedIds` / `onNodePointerDown`
  - 把现在 Canvas.tsx 里所有 `<g>` 节点渲染逻辑移过来
  - 对应 `CanvasNodeRenderers` / `CanvasNodeStyle`（需要就拆）
- 改造 `Canvas.tsx`
  - 只保留视口容器、标尺、选择覆盖层、交互事件
  - 调用 `<CanvasDocumentRenderer />`

**关键函数**

- `CanvasDocumentRenderer(document, zoom, selectedIds)`：纯展示
- 各类型节点 renderer（rect / ellipse / text / frame / sticky）：按 type 分派

**验收**

- 视觉完全一致（节点样式、选中态、缩放、字体）
- 点击节点仍然能选中，拖拽仍然可用
- 不引入新 bug

---

### 阶段 3：抽出视口外壳（CanvasViewport）

**目标**：把「视口尺寸 + 缩放 + 平移 + 坐标变换」从 Canvas.tsx 抽成独立的 CanvasViewport 组件，内部管理 scroll + camera + zoom，参考项目的 `viewportState.ts` 思想，但尽量复用现有 viewport（panX/panY/zoom）。

**设计选择**

- 方案 A（保守）：继续用 SVG `transform={translate(panX,panY) scale(zoom)}`，viewport 只封装容器尺寸和事件绑定，不改坐标模型。
- 方案 B（接近参考）：引入 `viewportState` 概念（cameraX/cameraY/zoom + travelZone + scroll），彻底和参考项目对齐。
- **推荐先走 A，后续按需升级到 B**。当前项目 viewport 模型工作正常，没必要一步到位。

**新增 / 修改文件**

- 新增 `apps/desktop/src/components/canvas/CanvasViewport.tsx`
  - 管理容器尺寸（ResizeObserver）
  - 处理滚轮缩放、空格抓手、坐标换算
  - 暴露 `screenToCanvas` / `canvasToScreen` 工具
- 改造 `Canvas.tsx` → 调用 CanvasViewport，把子内容作为 children 放进去
- 可选：新增 `apps/desktop/src/components/canvas/viewport/useCanvasViewport.ts` hook

**关键函数**

- `useViewportState()`：管理 viewport 状态 + 尺寸同步 + 缩放
- `screenToCanvas(clientX, clientY)`：屏幕坐标 → 画布坐标
- `canvasToScreen(x, y)`：画布坐标 → 屏幕坐标

**验收**

- 缩放、平移、滚轮、空格抓手行为和之前一致
- 坐标换算正确（点击节点能选中、拖拽位置对得上）
- 标尺坐标对齐（标尺 worldStart = -panX/zoom，和参考一致）

---

### 阶段 4：抽出选择覆盖层（ViewportSelectionOverlay）

**目标**：把选区框和 8 个手柄从 SVG 里抽出来，做成独立的屏幕坐标覆盖层组件。好处是手柄尺寸不随缩放变化、交互更独立、代码更清晰。

**新增 / 修改文件**

- 新增 `apps/desktop/src/components/canvas/ViewportSelectionOverlay.tsx`
  - 输入：selectedBounds（屏幕坐标矩形）、zoom、onHandleDown
  - 8 个调整手柄、选区虚线框
- 新增 `apps/desktop/src/components/canvas/useSelectionBounds.ts`
  - 根据选中图层计算屏幕坐标包围盒
- 改造 `Canvas.tsx`
  - 从 SVG 里移除选区框和手柄
  - 在 CanvasViewport 内叠一层 ViewportSelectionOverlay

**关键函数**

- `measureSelectionBounds(selectedIds, viewport)`：计算选中节点的屏幕坐标矩形
- 8 个手柄：tl / tc / tr / ml / mr / bl / bc / br

**验收**

- 选中节点后手柄大小恒定（不随缩放变化大小）
- 拖拽手柄仍然可以调整尺寸
- 多框选仍然可用（如果有）

---

### 阶段 5：建立 interaction 层（核心改造）

**目标**：新建 `@dt-ai-design/editor-interaction` 包（参考 `miaoma-editor-interaction`），把工具状态机从 Canvas.tsx 里抽出来。这是整个改造里最核心的一步。

**新增包**：`packages/editor-interaction/`

**文件结构**

```
packages/editor-interaction/
├── package.json
├── tsconfig.json
├── tsdown.config.ts
└── src/
    ├── index.ts
    ├── types.ts              # CanvasToolId / InteractionEvent / InteractionCommand / HitPathNode 等
    ├── createEditorInteraction.ts
    └── reducer.ts            # reduceInteraction(state, event) -> { state, commands[] }
```

**工具 ID**（对齐现有 Toolbar）
`select` / `hand` / `rectangle` / `ellipse` / `triangle` / `frame` / `text` / `sticky` / `pen`

**交互模式**

- `idle` / `creatingShape` / `movingLayer` / `resizingLayer` / `marqueeSelecting` / `drawingPen` / `textEditing`

**命令类型**（InteractionCommand）

- `selectLayer` / `deselectAll`
- `showCreationOverlay` / `clearCreationOverlay`
- `createLayer`（layerType + bounds + parentId + selectAfterCreate）
- `moveLayer`（layerId + position）
- `resizeLayer`（layerId + bounds）
- `reparentLayer`（layerId + parentId + index）
- `removeLayer`
- `setActiveTool`

**状态字段**

- `activeTool`
- `mode`
- `draft`：保存当前拖拽中的起点、当前点、目标父节点等
- `textEditingNodeId`

**React 侧接入**

- 新增 `EditorInteractionProvider`（放在 `EditorProvider` 内部或并列）
- 新增 `useEditorInteraction()` hook：返回 `{ state, dispatch }`
- 新增 `useCanvasInteractionBridge()`（bridge 层）：把 interaction 的命令翻译成 editor-core 的调用

**关键函数**

- `createEditorInteraction()`：创建交互实例（getState / dispatch / subscribe）
- `reduceInteraction(state, event)`：核心 reducer
- `useCanvasInteractionBridge()`：命令 → editor 方法的桥接

**验收**

- 所有 9 个工具都能用（至少 select / hand / rectangle / ellipse / text / frame 必须跑通）
- 选择、移动、创建、调整大小行为和改造前一致
- undo/redo 仍然正确（因为底层还是 editor-core 的命令栈）
- 单元测试覆盖主要状态转换路径

---

### 阶段 6：改造工具栏（Toolbar）接入 interaction

**目标**：工具栏不再直接调用 `editor.addLayer`，改为切换 interaction 的 activeTool。新建图层由交互层在画布拖拽完成后创建。

**改造点**

- `Toolbar.tsx`：`activeTool` 从 `useEditorInteraction()` 取
- 点击工具：`interaction.dispatch({ type: 'selectTool', tool: id })`
- 移除「点击工具直接在画布中心建一个默认大小节点」的逻辑（这一步可以保留一个快捷键/菜单项，但主工具栏应该是切工具）

**验收**

- 工具栏高亮正确
- 选中工具后光标样式变化正确
- 矩形/椭圆/帧/文本都是拖出来的，不是点一下就建出来（如果产品想要点一下就建，可以单独做双击或菜单入口）

---

### 阶段 7：创建预览 + 创建覆盖层

**目标**：形状工具拖拽时不直接改文档，而是在屏幕坐标覆盖层显示预览框，松手后才真正创建节点。

**新增 / 修改**

- 新增 `CanvasCreationOverlay.tsx`
  - 输入：bounds（屏幕坐标）、toolType
  - 输出：拖拽中的矩形/椭圆/文本框预览
- `Canvas.tsx` 里移除创建时实时建节点的逻辑
- interaction 发出 `showCreationOverlay` / `clearCreationOverlay` 命令

**验收**

- 拖拽创建矩形/椭圆/帧时预览框跟随鼠标
- 松手才创建节点
- 拖拽距离小于阈值（4px）不创建

---

### 阶段 8：改造右侧属性栏（react-hook-form）

**目标**：把 PropertiesPanel 从「每个字段独立 setLayerProperty」改成 react-hook-form 驱动，字段变化 → formValuesToPatch → 批量 patch → editor.setLayerProperties。

**新增 / 修改文件**

- 改造 `apps/desktop/src/components/editor/PropertiesPanel.tsx`
  - 外层套 `FormProvider`
  - 选中节点变化时 `form.reset(nodeToFormValues(node))`
  - 字段变化时走 watch + 防抖 → formValuesToPatch → 批量提交
- 新增 `apps/desktop/src/components/editor/properties/formValuesToPatch.ts`
  - 表单值 → `Partial<Layer>` 补丁
- 新增 `apps/desktop/src/components/editor/properties/nodeToFormValues.ts`
  - 节点 → 表单初始值
- 新增各 section 组件：PositionSection / LayoutSection / AppearanceSection / FillSection / TextSection 等

**关键函数**

- `nodeToFormValues(layer)`：节点 → 表单值
- `formValuesToPatch(layer, values)`：表单变化 → 差异补丁
- `usePropertiesFormBridge()`：表单 ↔ editor 的桥接

**为什么值得做**

- 批量修改只产生一次命令历史（undo 更友好）
- 字段之间的联动（比如旋转时保持中心）更容易实现
- 为后续多选择编辑、样式数组字段打基础

**验收**

- 所有字段修改实时生效
- 一次连续修改（比如拖输入框调宽度）只产生一条 undo 记录（或按防抖合并）
- 未修改字段不会被误写

---

### 阶段 9：样式数组化（fills / strokes / effects）

**目标**：把当前的单 fill 改成 fills 数组（可加多个填充、描边、效果），和参考项目对齐。

**改造点**

- `design-schema`：`Layer.fill` → `Layer.fills: FillStyle[]`，同理 strokes / effects
- `editor-core`：`appendFill / updateFill / removeFill / setActiveFill` 等命令
- `CanvasDocumentRenderer`：支持多层填充/描边渲染
- `PropertiesPanel`：新增 FillArraySection / StrokeArraySection / EffectArraySection
- interaction 层增加对应命令（如果需要）

**这是最大的一步改动**，因为 schema 变了会影响所有层。建议放到最后，或者根据产品优先级评估是否一期做。

**验收**

- 可以添加 / 移除 / 切换激活的填充、描边、效果
- 渲染正确（多层填充叠加）
- undo/redo 正常

---

### 阶段 10：完善与打磨（可选）

- **左侧图层面板**：和参考项目的 `SidebarLayersPanel` 对齐，支持图层列表、显隐、锁定、重命名、拖拽排序
- **智能辅助线**：拖拽/缩放时显示对齐辅助线（smartGuides）
- **画布网格背景**：目前已经有径向渐变点阵，可以保留或升级为无限网格
- **节点双击进入编辑**：文本节点双击就地编辑（CanvasInlineTextEditor）
- **键盘快捷键**：V=选择 / H=抓手 / R=矩形 / E=椭圆 / T=文字 / F=帧 / Delete=删除 / Ctrl+Z=撤销
- **agent 光标层**：AI 生成时画布上显示代理操作光标

## 四、推荐路径与优先级

### MVP 路径（推荐，3-4 个阶段）

如果你想要**最小代价获得最明显的架构收益**，建议只做到阶段 1-5-6-8：

1. **阶段 1**：Provider 化（铺垫，改动小）
2. **阶段 5**：建 interaction 层（核心价值，把交互从 Canvas 抽出来）
3. **阶段 6**：工具栏接入 interaction（工具切换走状态机）
4. **阶段 8**：属性栏 react-hook-form 化（属性编辑体验 + undo 优化）

做完这四步，核心架构（状态 + 交互 + 表单）就和参考项目对齐了，Canvas.tsx 从 1450 行降到 500 行以内，后续想加什么都好加。

### 完整对齐路径（全部 10 个阶段）

如果目标是完全对齐参考项目的能力（多层填充、创建预览、选择覆盖层、视口 travelZone、图层列表等），按阶段 0→1→2→3→4→5→6→7→8→9→10 顺序来。

## 五、风险与注意事项

- **Canvas.tsx 是巨石文件**：拆分时务必每拆一层跑一次测试 + 视觉验收，避免拆完动不了。
- **viewport 模型变更风险高**：平移缩放坐标一旦错了，所有交互都偏移。建议阶段 3 先保守方案，后续再升级。
- **样式数组化是 breaking change**：`design-schema` 改动影响全链路（renderer / commands / 持久化 / 导入导出），需要迁移脚本。
- **现有功能多（9 个工具）**：interaction 层需要覆盖所有工具，不能只做几个就算了。建议第一批先做 select / hand / rectangle / ellipse / text / frame 这 6 个核心，sticky / pen / triangle 第二批补。
- **撤销重做**：所有交互层命令最终都要走 editor-core 的命令栈，确保 undo/redo 正确。这是底线。

## 六、关键文件对照

| 功能       | 参考项目（miaoma）                       | 当前项目（dt-ai）改造去向                 |
| ---------- | ---------------------------------------- | ----------------------------------------- |
| 交互状态机 | `packages/miaoma-editor-interaction`     | 新建 `packages/editor-interaction`        |
| 会话/状态  | `EditorSessionProvider`                  | 现有 `editor-core` + 新 `EditorProvider`  |
| 画布编排   | `CanvasStage` + `CanvasViewportShell`    | 新 `EditorCanvasStage` + `CanvasViewport` |
| 文档渲染   | `CanvasDocumentRenderer`                 | 新 `CanvasDocumentRenderer`               |
| 选择覆盖层 | `ViewportSelectionOverlay`               | 新 `ViewportSelectionOverlay`             |
| 创建覆盖层 | `CanvasCreationOverlay`                  | 新 `CanvasCreationOverlay`                |
| 属性栏     | `RightInspectorFormBridge`               | 改造 `PropertiesPanel` + react-hook-form  |
| 工具条     | `CanvasToolRail`                         | 改造现有 `Toolbar`                        |
| 标尺       | `miaoma-canvas-ruler`                    | `canvas-ruler`（已完成）                  |
| 表单桥     | `formValuesToPatch` / `nodeToFormValues` | 新建 `properties/formValuesToPatch.ts` 等 |

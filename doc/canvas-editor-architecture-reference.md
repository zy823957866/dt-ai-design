# 绘图区域编排与联动说明

> 针对 `apps/desktop`（Electron 渲染端）下的画布编辑器，梳理绘图区域的编排方式、画布与视口的关系、工具栏（ToolRail）与右侧属性栏（RightInspector）的联动路径，并列出关键函数。

## 1. 整体布局结构

页面入口：`apps/desktop/renderer/pages/MiaomaEditorScreen.tsx`，其内部使用 `<MiaomaEditor />`。

顶层组件：`MiaomaEditor`（`apps/desktop/renderer/components/editor/MiaomaEditor.tsx`）

### 1.1 页面级 Grid 布局

`MiaomaEditorContent` 返回一个 `grid` 容器，分成三列：

- 左列：左侧边栏 `LeftSidebar`（宽度由 `--editor-sidebar-width` 控制，可折叠）
- 中列：编辑内容区 `editor-content`（也是一个 grid）
  - 顶行：主头部 `MainHeader`（高度 `--editor-header-height`）
  - 底行：画布舞台 `CanvasStage` + 右侧属性栏 `RightInspector`
- 右列（内容区的右列）：`RightInspector`（宽度由 `--editor-inspector-width` 控制）

关键 Tailwind 类（MiaomaEditor.tsx）：

```
grid-cols-[var(--editor-sidebar-width)_minmax(0,1fr)]     // 页面级
grid-cols-[minmax(0,1fr)_var(--editor-inspector-width)]   // 内容级
grid-rows-[var(--editor-header-height)_minmax(0,1fr)]      // 内容级行
```

当选择为空时，`RightInspector` 可以折叠（`bodyVisible=false`），此时画布舞台 `CanvasStage` 会通过 `col-span-2` 跨列占位。

### 1.2 画布舞台（CanvasStage）

文件：`apps/desktop/renderer/components/editor/CanvasStage.tsx`

`CanvasStage` 位于 `editor-content` 的第二行、第一列（可能跨两列），是画布的直接容器。它内部包含：

- `CanvasViewportShell`：视口外壳，承载滚动、缩放、标尺、文档渲染、创建覆盖层、选区高亮、文字编辑器等
- `CanvasToolRail`：工具条（指针/矩形/形状菜单/文字/框架/手形）
- 可选的 `PromptDock`（当左侧 tab 为 layers 时叠加在画布上）
- 可选的 `CanvasAgentCursorLayer`（agent 生成运行时显示代理光标）

`CanvasStage` 还承担了两个关键的选择回调：

- `onCanvasBlankSelect`：点击画布空白 → 收起属性栏正文（`isInspectorBodyVisible=false`）
- `onCanvasNodeSelect`：选中节点 → 展开属性栏正文（`isInspectorBodyVisible=true`）

## 2. 视口结构（CanvasViewportShell）

文件：`apps/desktop/renderer/components/editor/CanvasViewportShell.tsx`

### 2.1 DOM 分层

`CanvasViewportShell` 是一个 `relative` 容器，内部分成几层（从外到内）：

1. **标尺层**：
   - 水平标尺：`CanvasRuler axis="horizontal"`（使用 `@miaoma-design-ai/miaoma-canvas-ruler`）
   - 垂直标尺：`CanvasRuler axis="vertical"`
   - 左上角方块：`CanvasRulerCorner`
   - 厚度由 CSS 变量 `--editor-ruler-thickness` 控制（与 `DEFAULT_RULER_THICKNESS` 一致，默认 24px）
2. **滚动容器**：一个 `overflow-scroll` 的 div（`scrollRef`），是所有交互事件（pointer/scroll/keyboard）的挂载点
3. **旅行区（travelZone）**：滚动容器内部一个超大 div（`travelZoneWidth × travelZoneHeight`），用来承载「相机」坐标，让用户可以在很大的范围内平移
4. **世界表面（world surface）**：
   - 用 `transform: translate(-cameraX*zoom, -cameraY*zoom) scale(zoom)` 把世界坐标映射到屏幕
   - 内部定位文档渲染层：`CanvasDocumentRenderer`
   - 文档渲染层的偏移由 `documentBounds` 决定（所有顶层节点的边界框）
5. **覆盖层**：
   - `ViewportSelectionOverlay`：选中节点的外框（屏幕坐标上的覆盖层）
   - `CanvasCreationOverlay`：正在创建的形状预览框
   - `CanvasInlineTextEditor`：文本节点就地编辑器
   - 自定义 `overlay`（如 PromptDock）
   - `renderDocumentOverlay`（如 agent 光标）
6. **缩放控件**：`CanvasZoomControl`（右下角 +/− 与百分比显示）

### 2.2 视口状态

文件：`apps/desktop/renderer/components/editor/viewport/viewportState.ts`

视口状态保存在 `CanvasViewportState` 中，核心字段：

- `cameraX` / `cameraY`：相机在世界坐标中的位置（世界坐标原点对应屏幕相机偏移）
- `zoom`：缩放比例（1 表示 100%）
- `viewportWidth` / `viewportHeight`：视口容器的像素尺寸
- `scrollLeft` / `scrollTop`：滚动条位置
- `travelZoneWidth` / `travelZoneHeight`：旅行区大小
- `minZoom` / `maxZoom`：缩放上下限
- `anchorScrollLeft` / `anchorScrollTop`：初始中心偏移（旅行区居中）

关键函数：

- `createCanvasViewportState(options)`
  - 创建初始视口状态，把相机放在 `(initialCameraX, initialCameraY)`，滚动条居中在旅行区。
  - 位置：`viewportState.ts`
- `getVisibleWorldRect(state)`
  - 计算当前可视区域在世界坐标下的矩形 `{ x, y, width, height }`，用于给标尺提供 `worldStart / worldEnd`。
  - 位置：`viewportState.ts`
- `screenToWorld(state, point)` / `worldToScreen(state, point)`
  - 屏幕坐标与世界坐标互转。
  - 位置：`viewportState.ts`
- `resizeViewport(state, width, height)`
  - 容器尺寸变化时调整视口，保持滚动条相对中心的位置不变。
  - 位置：`viewportState.ts`
- `applyScrollDelta(state, delta)`
  - 滚动后更新 `cameraX / cameraY` 与 `scrollLeft / scrollTop`。
  - 当滚到接近旅行区边缘时，会自动 `recenter` 到锚点，避免滚出边界。
  - 位置：`viewportState.ts`
- `setViewportZoom(state, nextZoom, anchor)`
  - 以视口内某个屏幕点为锚点缩放，保持该点对应的世界坐标不变。
  - 位置：`viewportState.ts`
- `getAdjacentZoomPreset(zoom, presets, direction)`
  - 从 `ZOOM_PRESETS` 中取下一个或上一个缩放档，配合 `CanvasZoomControl` 的 +/− 按钮使用。
  - 位置：`viewportState.ts`

### 2.3 缩放交互

- 滚轮缩放：`useShortcutWheelZoom`（`viewport/useShortcutWheelZoom.ts`），按住 Ctrl/Cmd + 滚轮触发缩放，使用 `setViewportZoom`
- 按钮缩放：`CanvasZoomControl` 调用 `getAdjacentZoomPreset` + `setViewportZoom`，以视口中心为锚点
- 空格键抓手：空格键按下进入 `isSpacePanActive`，松开恢复；和 `hand` 工具一样触发平移

## 3. 工具栏联动（CanvasToolRail）

### 3.1 工具条组件

文件：`apps/desktop/renderer/components/editor/CanvasToolRail.tsx`

工具条是绝对定位在画布左上角（标尺下方 10px）的一列按钮，包含：

- 指针（pointer）
- 矩形（rectangle）
- 形状展开菜单（shape-menu，内有 Rectangle / Ellipse / Polygon / Icon，其中 Polygon 与 Icon 暂为禁用占位）
- 文字（text）
- 框架（frame）
- 手形（hand）

受控属性：`activeTool`、`onSelectTool(toolId)`。

### 3.2 工具状态的来源

工具状态不是直接存在 CanvasStage，而是存在 `EditorInteraction` 里（`@miaoma-design-ai/miaoma-editor-interaction`）。

- 交互状态创建：`createEditorInteraction()`（`packages/miaoma-editor-interaction/src/createEditorInteraction.ts`）
- 交互 reducer：`reduceInteraction(state, event)`（`packages/miaoma-editor-interaction/src/reducer.ts`）
- 交互事件类型：`EditorInteractionEvent`（`packages/miaoma-editor-interaction/src/types.ts`）
- 交互状态：`EditorInteractionState`（`packages/miaoma-editor-interaction/src/types.ts`）

React 侧通过两个 provider 把交互层接入：

- `EditorInteractionProvider`（`state/EditorInteractionProvider.tsx`）：创建 `createEditorInteraction()` 实例，放入 context
- `useEditorInteraction()`（`state/useEditorInteraction.ts`）：从 context 取 `{ interaction, state }`
- `state` 用 `useSyncExternalStore` 风格的订阅模式（内部实现），保证交互状态变化触发重渲染

### 3.3 工具切换链路

1. 用户点击 `CanvasToolRail` 上的按钮
2. 调用 `onSelectTool(tool)`
3. 由 `useCanvasCreationBridge().selectTool` 接手
   - 文件：`apps/desktop/renderer/components/editor/bridges/useCanvasCreationBridge.ts`
   - 关键函数：`selectTool`
4. `selectTool` 内部调用 `interaction.dispatch({ type: 'selectTool', tool })`
5. reducer 收到 `selectTool` 事件，返回新的 `state.activeTool` 和一个 `setActiveTool` 命令（仅作通知，当前 bridge 不做额外处理）
6. 交互状态变更 → `state.activeTool` 更新 → `CanvasToolRail` / `CanvasViewportShell` / `useCanvasCreationBridge` 重新渲染

### 3.4 工具在视口中的行为

不同工具下 `CanvasViewportShell` 的 pointer 事件处理逻辑不同：

- `pointer` 工具：
  - 单击空白 → 触发 `onCanvasPointerDown`（清空选择、收起属性栏）
  - 单击节点 → 触发 `onNodePointerDown(nodeId)`（选中节点、展开属性栏）
  - 拖动选中节点 → 通过 `useCanvasNodeDragGesture` 处理拖拽，并将 move 命令交给 interaction
- `hand` 工具 / 空格按下：
  - 进入平移模式，`isPanMode = true`
  - pointer down 记录起点，pointer move 同步 `scrollLeft / scrollTop`，实现抓手平移
- 形状工具（`rectangle` / `ellipse` / `frame`）：
  - pointer down → 记录起点，进入 `creatingShape` 模式
  - pointer move → 实时更新创建预览（`showCreationOverlay`）
  - pointer up → 触发 `createNode` 命令
- `text` 工具：
  - pointer down → 立即创建一个空文本节点，选中并进入文字编辑模式

以上状态机都在 `reduceInteraction` 中处理，输出一组 `EditorInteractionCommand`（如 `createNode` / `moveNode` / `reparentNode` / `selectNode` / `showCreationOverlay` 等）。

关键函数：

- `reduceInteraction(state, event)`
  - 交互 reducer：根据事件类型（selectTool / pointerDown / pointerMove / pointerUp / textEditingStarted / textEditCommit / textEditCancel / pressEscape）计算下一个状态和要执行的命令列表。
  - 位置：`packages/miaoma-editor-interaction/src/reducer.ts`
- `useCanvasCreationBridge().dispatchPointerEvent(type, payload)`
  - 桥接函数：对原始 pointer 事件做上下文增强（shape 工具在选中 frame 内时限制 nodePath、pointer 工具注入 `selectedNode` 信息），再交给 interaction dispatch，最后把返回的命令应用到 session。
  - 位置：`apps/desktop/renderer/components/editor/bridges/useCanvasCreationBridge.ts`
- `useCanvasCreationBridge().applyInteractionCommands(commands)`
  - 根据 interaction 返回的命令，调用 `EditorSession` 上的对应方法（`appendNode` / `appendChildNode` / `patchNode` / `reparentNode` / `removeNode` / `selectNode`）。
  - 位置：`useCanvasCreationBridge.ts`
- `useCanvasNodeDragGesture()`
  - 指针工具下的拖拽手势：识别节点被拖起、判断拖出父容器、配合 interaction 产生 `moveNode` / `reparentNode` 命令。
  - 位置：`apps/desktop/renderer/components/editor/viewport/useCanvasNodeDragGesture.ts`

## 4. 右侧属性栏联动（RightInspector）

### 4.1 属性栏结构

文件：`apps/desktop/renderer/components/editor/RightInspector.tsx`

`RightInspector` 是 `aside`，占据 `editor-content` 的第二列。内部：

- `TopHeader`：顶部图标行（目前是信息图标 + 节点名，可折叠/展开）
- 正文区（`bodyVisible` 为 true 时显示）
  - `RightInspectorFormBridge`：表单桥接器，管理 react-hook-form

### 4.2 表单桥接器（RightInspectorFormBridge）

文件：`apps/desktop/renderer/components/editor/inspector/RightInspectorFormBridge.tsx`

核心机制：`react-hook-form` + `FormProvider`，表单字段按节点类型渲染。

状态来源：

- `useEditorSession()`：拿到 `EditorSession`，用于提交修改
- `useSelectedNode()`：拿到当前选中节点（从 session 的 selection 里读）
- `useForm<InspectorFormValues>()`：表单状态

渲染区块（按顺序）：

1. `SelectedObjectBlock`：显示节点类型图标 + 名称 + "Create Component" 入口（入口按钮）
2. `Context` 折叠行（占位）
3. `AlignmentSection`：对齐按钮组（按钮为 disabled 占位）
4. `PositionSectionFields`：位置/尺寸/旋转/不透明度/圆角（`sections/PositionSectionFields.tsx`）
5. `FrameLayoutSectionFields`：仅 frame 节点显示，含布局模式、对齐、间距、内边距、裁剪等（`sections/FrameLayoutSectionFields.tsx`）
6. `AppearanceSectionFields`：外观（可见性、混合模式等，`sections/AppearanceSectionFields.tsx`）
7. `TextSectionFields`：仅 text 节点显示，字体大小、对齐等（`sections/TextSectionFields.tsx`）
8. `FillArraySection`：填充列表（数组字段，`sections/FillArraySection.tsx`）
9. `StrokeArraySection`：描边列表（`sections/StrokeArraySection.tsx`）
10. `EffectArraySection`：效果列表（阴影等，`sections/EffectArraySection.tsx`）
11. `ExportSection`：导出倍率、格式、按钮（占位）

### 4.3 选中 → 表单同步链路

选中变化时，表单需要用节点的最新值重置，以避免不同节点的表单状态互相串味。

1. 节点选择变化（通过 `session.selectNode` 或创建节点）
2. `useSelectedNode()` 返回新节点
3. `getInspectorNodeSyncKey(node)` 生成同步 key
   - 该函数把需要外部驱动同步的标量字段（name/x/y/rotation/width/height/cornerRadius/clip/layout/gap/padding/fontSize 等）序列化成 JSON
   - 数组型字段（fills/strokes/effects）有自己内部状态，不参与 key
   - 位置：`RightInspectorFormBridge.tsx`
4. `selectedNodeSyncKey` 作为 `useEffect` 的依赖
5. 依赖变化时 `form.reset(nodeToFormValues(node))`
   - `nodeToFormValues(node)`：把 `EditorNode` 转成 `InspectorFormValues`
   - 位置：`apps/desktop/renderer/components/editor/inspector/nodeToFormValues.ts`
6. 为了避免 reset 之后的表单值变化再次触发回写，用 `skipNextInspectorPatchRef` 跳过一次 patch 循环

### 4.4 表单 → 节点回写链路

表单字段任何变化都会回写到 session 中的节点（实时双向绑定）。

1. 用户操作表单控件 → `react-hook-form` 更新 `watchedValues`
2. `useEffect` 监听 `watchedValues` 变化
3. 如果是 reset 引起的（`skipNextInspectorPatchRef` 为 true），跳过本次回写
4. 否则调用 `formValuesToPatch(node, values, options)` 计算差异补丁
   - 函数：`formValuesToPatch`
   - 位置：`apps/desktop/renderer/components/editor/inspector/formValuesToPatch.ts`
   - 职责：把表单值与当前节点逐字段比较，只生成变化字段的 `EditorNodePatch`；处理旋转时的 AABB 重算、尺寸模式（fill/fit/fixed）、内边距归一化、圆角解析等
5. 如果补丁非空，调用 `session.patchNode(nodeId, patch)` 提交到 session
6. session 更新文档 → 触发订阅 → 画布重渲染 → 选中节点的外观立即反映表单修改

### 4.5 数组型样式字段（填充/描边/效果）

`fills` / `strokes` / `effects` 是数组型样式字段，和普通标量字段不同：

- 每个数组项有自己的 `id`，由 `EditorSession` 的 `appendStyleItem` / `updateStyleItem` / `removeStyleItem` 管理
- 数组项的激活状态存在 session 的 `inspectorUi.activeFillId / activeStrokeId / activeEffectId` 里（不是表单状态）
- `setActiveStyleItem(field, itemId)` 切换激活项
- UI 上用分段控件 + 列表项编辑

关键函数：

- `formValuesToPatch(node, values, options)`
  - 表单值 → 节点补丁。
  - 位置：`formValuesToPatch.ts`
- `nodeToFormValues(node)`
  - 节点 → 表单初始值。
  - 位置：`nodeToFormValues.ts`
- `EditorSession.patchNode(nodeId, patch)`
  - 对标量字段做局部更新，替换节点上的指定属性。
  - 位置：`packages/miaoma-editor-core/src/session/createEditorSession.ts`
- `EditorSession.appendStyleItem(nodeId, field, item)`
  - 给指定节点的 fills / strokes / effects 数组追加一项。
  - 位置：`createEditorSession.ts`
- `EditorSession.updateStyleItem(nodeId, field, itemId, patch)`
  - 更新数组中某一项的字段（如颜色、宽度）。
  - 位置：`createEditorSession.ts`
- `EditorSession.removeStyleItem(nodeId, field, itemId)`
  - 移除数组中某一项。
  - 位置：`createEditorSession.ts`
- `EditorSession.setActiveStyleItem(field, itemId)`
  - 切换当前激活的填充 / 描边 / 效果项。
  - 位置：`createEditorSession.ts`

## 5. 数据层与会话（EditorSession）

### 5.1 会话结构

文件：`packages/miaoma-editor-core/src/session/createEditorSession.ts`

`EditorSession` 是整个编辑器的「真实状态」容器，维护：

- `document: EditorDocument`：文档（节点树）
- `selection.selectedNodeId`：选中节点 id
- `inspectorUi`：属性面板 UI 状态（激活的填充/描边/效果 id）

它是一个订阅式对象，核心 API：

- `getSnapshot()`：取当前快照
- `subscribe(listener)`：订阅变化，返回取消订阅函数
- `selectNode(nodeId)`：切换选中节点
- `appendNode(node)` / `appendChildNode(parentId, node)` / `insertChildNode(parentId, index, node)`
- `reparentNode(nodeId, parentId, patch, index)`：节点重排 / 换父
- `removeNode(nodeId)`：删除节点（删除选中节点时会跳到父节点）
- `patchNode(nodeId, patch)`：局部更新节点字段
- `replaceNode(nodeId, nextNode)`：整体替换节点
- `appendStyleItem / updateStyleItem / removeStyleItem / setActiveStyleItem`
- `replaceDocument(document)`：整体替换文档（agent 生成用）
- `getNodeById(nodeId)` / `getSelectedNode()`：查询

React 侧通过 `useSyncExternalStore` 订阅：

- `EditorSessionProvider`：把 session 放进 context
- `useEditorSession()`：取 session 实例
- `useEditorSnapshot()`：用 `useSyncExternalStore` 订阅，每次文档变化返回新的 snapshot
- `useSelectedNode()`：从 snapshot 的 selection 里拿到完整节点

### 5.2 节点与文档模型

- `EditorDocument` / `EditorNode`：`packages/miaoma-editor-core/src/model/document.ts`、`node.ts`
- 支持节点类型：frame / rectangle / ellipse / text / icon / group 等（具体以 `miaoma-design-schema` 为准）
- `EditorNodePatch`：节点补丁类型，支持可选字段局部更新
- `selectors/getNodeById.ts` / `getSelectedNode.ts`：从文档里查找节点

### 5.3 文档 ↔ 渲染格式

`editor-core` 提供两种适配：

- `schemaToEditorDocument`：把设计 schema 转成内部 `EditorDocument`
- `editorDocumentToRenderable`：把内部 `EditorDocument` 转成渲染用的 `MiaomaDesignDocument`（交给 `CanvasDocumentRenderer`）

agent 生成完文档后，通过 `session.replaceDocument(...)` 替换整篇，画布整体重渲染。

## 6. 联动总览（一条完整链路）

以「选中矩形 → 修改圆角 → 画布反映」为例：

1. 画布上点击矩形节点
2. `CanvasViewportShell` 的 pointer up → `commitPointerClickSelection` → `onNodePointerDown(nodeId)`
3. `CanvasStageInner` 收到 → `session.selectNode(nodeId)` + `onCanvasNodeSelect(nodeId)`（展开属性栏）
4. session 更新 → `useEditorSnapshot()` 返回新 snapshot → `RightInspectorFormBridge` 的 `useSelectedNode()` 返回新节点
5. `selectedNodeSyncKey` 变化 → `form.reset(nodeToFormValues(node))` → 表单被填充为节点当前值
6. 用户在属性栏修改圆角输入
7. `watchedValues` 变化 → `formValuesToPatch` 计算出 `{ cornerRadius }` 补丁
8. `session.patchNode(nodeId, patch)` 提交
9. session 更新 → snapshot 变化 → `CanvasDocumentRenderer` 重渲染该节点 → 画布上矩形圆角实时变化

以「切换到矩形工具 → 拖拽绘制矩形」为例：

1. 点击 `CanvasToolRail` 的矩形按钮 → `selectTool('rectangle')`
2. `interaction.dispatch({type:'selectTool', tool:'rectangle'})` → `reduceInteraction` → `state.activeTool = 'rectangle'`
3. 工具条高亮、视口光标模式切换
4. 在画布按下左键 → `handleViewportPointerDown` → `dispatchPointerEvent('pointerDown', payload)`
5. reducer 进入 `creatingShape` 模式，记录起点
6. 移动鼠标 → `pointerMove` → reducer 输出 `showCreationOverlay` 命令 → bridge 设置 `creationDraft`
7. `CanvasViewportShell` 用 `creationDraft` 渲染 `CanvasCreationOverlay`（拖拽预览框）
8. 松开鼠标 → `pointerUp` → reducer 输出 `createNode` + `clearCreationOverlay` + `setActiveTool('pointer')`
9. bridge 执行 `applyCreateNodeCommand`：调用 `session.appendNode` 或 `session.appendChildNode`（若起点在 frame 内），并 `session.selectNode(nextNode.id)`
10. 画布上出现新矩形，右侧属性栏展开并显示该矩形属性

## 7. 关键文件清单

| 区域          | 文件                                                                             | 职责                                         |
| ------------- | -------------------------------------------------------------------------------- | -------------------------------------------- |
| 编辑器外壳    | `apps/desktop/renderer/components/editor/MiaomaEditor.tsx`                       | 顶层布局、左右栏、Header、Provider 组合      |
| 画布舞台      | `apps/desktop/renderer/components/editor/CanvasStage.tsx`                        | 组合视口 + 工具条，协调选择与属性栏折叠      |
| 视口外壳      | `apps/desktop/renderer/components/editor/CanvasViewportShell.tsx`                | 标尺、滚动、缩放、文档渲染、覆盖层、事件分发 |
| 视口状态      | `apps/desktop/renderer/components/editor/viewport/viewportState.ts`              | 相机/滚动/缩放状态机，坐标互转               |
| 视口拖拽      | `apps/desktop/renderer/components/editor/viewport/useCanvasNodeDragGesture.ts`   | 指针工具下的节点拖拽与重父识别               |
| 滚轮缩放      | `apps/desktop/renderer/components/editor/viewport/useShortcutWheelZoom.ts`       | Ctrl/Cmd+滚轮缩放                            |
| 工具条        | `apps/desktop/renderer/components/editor/CanvasToolRail.tsx`                     | 工具按钮 UI                                  |
| 创建桥接      | `apps/desktop/renderer/components/editor/bridges/useCanvasCreationBridge.ts`     | interaction 命令 → session 操作的桥          |
| 交互层        | `packages/miaoma-editor-interaction/src/reducer.ts`                              | 工具状态机，事件→命令                        |
| 会话层        | `packages/miaoma-editor-core/src/session/createEditorSession.ts`                 | 文档、选择、属性栏 UI 状态 + 订阅            |
| 属性栏        | `apps/desktop/renderer/components/editor/RightInspector.tsx`                     | 属性栏容器                                   |
| 属性表单桥    | `apps/desktop/renderer/components/editor/inspector/RightInspectorFormBridge.tsx` | react-hook-form 与 session 的双向绑定        |
| 表单→补丁     | `apps/desktop/renderer/components/editor/inspector/formValuesToPatch.ts`         | 表单值 → `EditorNodePatch`                   |
| 节点→表单     | `apps/desktop/renderer/components/editor/inspector/nodeToFormValues.ts`          | `EditorNode` → 表单初始值                    |
| 状态 Provider | `apps/desktop/renderer/components/editor/state/EditorSessionProvider.tsx`        | session 注入                                 |
| 状态 Provider | `apps/desktop/renderer/components/editor/state/EditorInteractionProvider.tsx`    | interaction 注入                             |
| 订阅 hook     | `apps/desktop/renderer/components/editor/state/useEditorSnapshot.ts`             | `useSyncExternalStore` 订阅 session          |

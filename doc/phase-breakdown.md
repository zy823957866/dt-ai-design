# dt-ai-design 需求拆解与分阶段执行计划

> 基于 `doc/prompts.md` + `doc/pencil-desktop-interface.md` 整理
> 暗色主题优先 · 多智能体并行执行 · 每阶段可独立验收

---

## 0. 项目现状与关键决策

### 0.1 当前状态（2026-10-11 代码审计更新）

- **脚手架**：pnpm monorepo + Electron + Vite + React 19，窗口可启动 ✅
- **样式**：Tailwind CSS v4，暗色主题令牌完整定义 ✅
- **shadcn/ui 组件**：已实现 16 个（Button / Input / Label / Separator / Tabs / ScrollArea / Tooltip / Dialog / DropdownMenu / Checkbox / Slider / Select / Popover / Switch / Textarea + cn.ts）✅
- **design-schema**：完整完成（10+ 图层类型 + Zod schema + 工具函数 + Vitest），构建通过 ✅
- **editor-core**：完整完成（命令系统 + 历史栈 + 选择 + 视口 + 事件 + 测试），构建通过 ✅
- **主进程 & IPC**：基本完成（窗口 + IPC handlers + projectStore + settings + preload API）✅
- **EditorProvider**：完整实现，已接入 editor-core，含快捷键 ✅
- **UI 布局**：EditorPage 有静态原型但**未接入 EditorProvider**（用本地 useState）🟡
- **Dashboard**：静态原型（硬编码数据，未接入 IPC）🟡
- **画布**：纯静态 HTML mock，无 SVG 渲染、无交互 🔴
- **面板**：左右面板静态原型，未双向绑定数据 🔴
- **AI 引擎 & MCP**：目录结构 + stub 占位 🔴

### 0.2 关键技术决策

| 项         | 决策                                 | 依据                        |
| ---------- | ------------------------------------ | --------------------------- |
| 样式方案   | Tailwind CSS v4（替换 UnoCSS）       | prompts.md 明确要求         |
| 组件库     | shadcn/ui 风格 + Radix UI primitives | prompts.md 明确要求         |
| 包名前缀   | `@dt-ai-design/*`                    | 项目已用此前缀，保持一致    |
| 状态管理   | React Context + reducer              | prompts.md 明确要求         |
| 默认主题   | 暗色（Dark）                         | 用户明确要求                |
| 设计参考   | 参考 pen.dev 70+ 界面规范            | pencil-desktop-interface.md |
| 包构建工具 | tsdown                               | 现有 packages 均使用 tsdown |

### 0.3 暗色主题色板（Tailwind v4 @theme）

| 用途           | 色值      | CSS 变量名                 |
| -------------- | --------- | -------------------------- |
| 画布背景       | `#141418` | `--color-canvas`           |
| 面板背景（深） | `#1E1E24` | `--color-panel`            |
| 面板背景（中） | `#26262E` | `--color-panel-muted`      |
| 面板背景（浅） | `#2A2A33` | `--color-panel-hover`      |
| 输入框背景     | `#26262E` | `--color-input`            |
| 主文字         | `#E4E4E7` | `--color-foreground`       |
| 次要文字       | `#9CA3AF` | `--color-muted-foreground` |
| 分割线 / 边框  | `#2F2F3A` | `--color-border`           |
| 品牌/选中高亮  | `#7C3AED` | `--color-primary`          |
| 品牌高亮（浅） | `#8B5CF6` | `--color-primary-light`    |
| 成功           | `#10B981` | `--color-success`          |
| 警告           | `#F59E0B` | `--color-warning`          |
| 错误           | `#EF4444` | `--color-destructive`      |

---

## 1. 阶段总览（8 个阶段）

```
Phase 1: 基础架构 ──┐
Phase 2: 设计数据模型 ─┤
Phase 3: 编辑器核心 ──┤  可并行
Phase 4: 主进程 & IPC ─┘
Phase 5: UI 壳与布局
Phase 6: 画布与交互
Phase 7: 属性面板 & 左侧面板
Phase 8: AI 多智能体引擎 & MCP
```

---

## Phase 1：基础架构（Foundation）

**目标**：把桌面 app 从空脚手架升级为可用的 React + Tailwind v4 + shadcn/ui 基础
**状态**：✅ 已完成
**涉及包**：`apps/desktop`

### 1.1 依赖调整

- 移除 `unocss`、`@unocss/reset`
- 安装运行时依赖：`react` `react-dom` `lucide-react` `react-router-dom@7` `@use-gesture/react` `react-hook-form@7`
- 安装开发依赖：`@types/react` `@types/react-dom` `@vitejs/plugin-react` `tailwindcss` `@tailwindcss/vite` `tailwindcss-animate` `tailwind-merge` `clsx` `class-variance-authority`
- 安装 Radix primitives：`@radix-ui/react-slot` `@radix-ui/react-label` `@radix-ui/react-separator` `@radix-ui/react-tabs` `@radix-ui/react-scroll-area` `@radix-ui/react-tooltip` `@radix-ui/react-dialog` `@radix-ui/react-dropdown-menu` `@radix-ui/react-checkbox` `@radix-ui/react-slider` `@radix-ui/react-select` `@radix-ui/react-popover` `@radix-ui/react-switch`

### 1.2 Vite 配置调整

- `vite.renderer.config.mts`：替换 UnoCSS 插件为 `@vitejs/plugin-react` + `@tailwindcss/vite`
- 配置路径别名 `@/` → `src/`

### 1.3 Tailwind v4 主题与全局样式

- 重写 `src/index.css`：`@import "tailwindcss";` + `@theme` 块定义暗色主题全部令牌
- 配置 `color-scheme: dark`，全局 reset，滚动条样式

### 1.4 shadcn/ui 风格基础组件

- 建立 `src/components/ui/` 目录结构
- 工具函数：`cn.ts`（tailwind-merge + clsx）
- 核心组件（每个一个文件）：Button, Input, Label, Separator, Tabs（含 TabsList/TabsTrigger/TabsContent）, ScrollArea, Tooltip（含 TooltipProvider/TooltipTrigger/TooltipContent）, Dialog（含 DialogTrigger/DialogContent/DialogHeader/DialogFooter/DialogTitle/DialogDescription）, DropdownMenu（含 DropdownMenuTrigger/DropdownMenuContent/DropdownMenuItem/DropdownMenuSeparator）, Checkbox, Slider, Select（含 SelectTrigger/SelectValue/SelectContent/SelectItem）, Popover（含 PopoverTrigger/PopoverContent）, Switch, Textarea
- 每个组件使用 `cva` 定义变体，暗色主题样式

### 1.5 React 入口与路由骨架

- 重写 `src/renderer.ts`：挂载 React 到 `#root`
- 新建 `src/App.tsx`：路由容器（HashRouter）
- 新建页面：`src/pages/EditorPage.tsx`（编辑器占位）、`src/pages/DashboardPage.tsx`（仪表盘占位）
- 重写 `index.html`：精简为挂载点

### 1.6 目录结构

```
apps/desktop/src/
├── main.ts              # Electron 主进程入口
├── preload.ts           # Preload 脚本
├── renderer.ts          # React 渲染进程入口
├── index.css            # Tailwind + 全局样式
├── App.tsx              # 根组件 + 路由
├── pages/               # 页面
│   ├── EditorPage.tsx
│   └── DashboardPage.tsx
├── components/
│   └── ui/              # shadcn/ui 风格组件
│       ├── button.tsx
│       ├── input.tsx
│       ├── ...
│       └── cn.ts
└── lib/                 # 工具函数
    └── utils.ts
```

### 1.7 验收标准

- `pnpm --filter @dt-ai-design/desktop typecheck` 通过
- `pnpm start` 启动后窗口正常显示 React 渲染的页面
- Tailwind 类名生效，暗色主题底色正确
- shadcn/ui Button 组件渲染正常，hover 效果正确
- `/` → Dashboard，`/editor/:projectId` → Editor，路由切换正常
- 控制台无 React 警告 / 错误

---

## Phase 2：设计文档数据模型（Design Schema）

**目标**：建立完整的设计文档数据模型，前端与 Agent 共用
**状态**：🔴 待开始
**涉及包**：`packages/design-schema`
**依赖**：无（独立包，可与 Phase 1 并行）

### 2.1 依赖安装

- 安装 `zod`（运行时校验，dependencies）
- 安装 `vitest`（devDependencies，如未安装）
- 在 package.json 添加 `test` / `test:run` 脚本

### 2.2 核心类型定义（TypeScript 类型 + Zod Schema）

**图层基类与类型枚举**

- `LayerType` 枚举：rectangle, ellipse, text, image, frame, group, stickyNote, path, line, componentInstance
- `BaseLayer` 接口：id, name, type, x, y, width, height, rotation, opacity, visible, locked, blendMode

**具体图层类型**

- `RectangleLayer`：fill, stroke, cornerRadius, effects
- `EllipseLayer`：fill, stroke, effects, arc (startAngle, endAngle, innerRadius)
- `TextLayer`：content, fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, textAlign, fill, textDecoration, sizing
- `ImageLayer`：src, fitMode, filters, cornerRadius
- `FrameLayer`：children, layout (Flex), padding, gap, overflow, background, border
- `GroupLayer`：children
- `StickyNoteLayer`：content, color, author, fontSize
- `PathLayer`：points, fill, stroke
- `LineLayer`：x1, y1, x2, y2, stroke, startCap, endCap
- `ComponentInstanceLayer`：componentId, variantId, overrides

### 2.3 样式类型

- `FillStyle`：type (solid/gradient/image/none), color, gradientStops, imageSrc, opacity
- `StrokeStyle`：color, width, style (solid/dashed/dotted), position (inside/center/outside)
- `EffectStyle`：type (dropShadow/innerShadow/blur/glow), x, y, blur, spread, color, opacity
- `FlexLayout`：direction, wrap, justifyContent, alignItems, alignContent, gap, padding

### 2.4 文档根类型

- `DesignDocument`：id, name, version, layers (顶层图层列表), components, variables, meta (创建时间、修改时间)
- `ComponentDefinition`：id, name, layers, variants
- `DesignVariable`：id, name, type (color/number/string), value

### 2.5 Zod 校验 Schema

- 每个核心类型对应 Zod schema
- `documentSchema` 完整文档校验
- `validateDocument()` 校验函数（返回成功/失败+错误列表）

### 2.6 工具函数

- `createDocument(name)`：创建空文档
- `createLayer(type, props)`：创建指定类型图层，生成唯一 id
- `traverseLayers(layers, callback)`：深度优先遍历
- `findLayerById(document, id)`：按 id 查找图层
- `cloneLayer(layer)`：深拷贝图层（重新生成 id）
- `getLayerBounds(layer)`：获取图层包围盒

### 2.7 单元测试

- 类型创建与校验测试
- traverse / findLayer / cloneLayer 测试
- 文档完整性校验测试

### 2.8 目录结构

```
packages/design-schema/src/
├── index.ts          # 导出所有公共 API
├── types/            # TypeScript 类型定义
│   ├── base.ts
│   ├── layers.ts
│   ├── styles.ts
│   ├── document.ts
│   └── index.ts
├── schema/           # Zod 校验
│   ├── base.schema.ts
│   ├── layers.schema.ts
│   ├── styles.schema.ts
│   ├── document.schema.ts
│   └── index.ts
├── utils/            # 工具函数
│   ├── document.ts
│   ├── layer.ts
│   ├── traverse.ts
│   └── index.ts
└── tests/            # Vitest 测试
    ├── document.test.ts
    ├── layer.test.ts
    └── validate.test.ts
```

### 2.9 验收标准

- TypeScript strict 模式编译通过（typecheck）
- Zod 校验：合法数据通过，非法数据返回具体错误
- Vitest 全部通过
- `pnpm --filter @dt-ai-design/design-schema build` 构建成功

---

## Phase 3：编辑器核心（Editor Core）

**目标**：纯逻辑的编辑器状态管理、命令系统、历史、选择
**状态**：🔴 待开始
**涉及包**：`packages/editor-core`
**依赖**：Phase 2 完成

### 3.1 编辑器状态

- `EditorState`：document, selection, history, viewport
- `Selection`：选中的图层 id 数组
- `Viewport`：zoom, panX, panY
- `HistoryState`：undo 栈 + redo 栈

### 3.2 命令系统（Command Pattern）

- `Command` 接口：execute(state), undo(state), name
- `CommandStack`：push, undo, redo, canUndo, canRedo

### 3.3 核心命令集

- `AddLayerCommand`：添加图层
- `RemoveLayerCommand`：删除图层
- `MoveLayerCommand`：移动图层位置（x, y）
- `ResizeLayerCommand`：调整尺寸
- `SetPropertyCommand`：设置任意属性（通用）
- `SetSelectionCommand`：修改选中
- `GroupCommand` / `UngroupCommand`：组合/解组
- `FrameSelectionCommand`：用 Frame 包裹选区
- `DuplicateLayerCommand`：复制图层

### 3.4 视口操作

- `zoomIn()`, `zoomOut()`, `zoomTo(factor)`
- `pan(dx, dy)`, `setViewport(viewport)`

### 3.5 选择与查询

- `selectAll()`, `deselectAll()`
- `getSelectedLayers()`, `getSelectedBounds()`

### 3.6 事件系统

- 简单事件发射器：change, selectionChange, documentChange

### 3.7 验收标准

- 所有命令可 undo/redo
- Vitest 覆盖主要命令和历史栈
- 纯 TS，不依赖 UI 或 DOM

---

## Phase 4：主进程与 IPC（Main Process & IPC）

**目标**：Electron 主进程提供本地服务
**状态**：🔴 待开始
**涉及范围**：`apps/desktop/src/main/`、`preload.ts`、共享类型
**依赖**：Phase 1 基础架构

### 4.1 窗口与生命周期

- 窗口默认尺寸 1440x900，暗色标题栏
- 应用菜单（File / Edit / View / Object / Text / AI / Window / Help）
- 关闭行为确认（未保存提示）

### 4.2 IPC 通道定义 + Preload API

- 共享 IPC 类型定义（main/renderer 共用）
- preload 通过 `contextBridge` 暴露 API
- 通道命名空间：`project:*`, `document:*`, `generation:*`, `app:*`

### 4.3 项目持久化（ProjectStore）

- 项目列表管理（创建/删除/重命名/导入）
- 存储路径：用户目录下 `dt-ai-design/projects/`
- 项目元数据：name, createdAt, updatedAt, thumbnail

### 4.4 文档文件操作

- 打开/保存/另存为设计文档（JSON 格式）
- 自动保存（防抖 30s）
- 文件导入（JSON）

### 4.5 应用设置存储

- 用户设置：主题、最近打开文件、AI 模型配置
- 存储位置：`userData/settings.json`

### 4.6 验收标准

- 主进程启动正常，preload API 可被渲染进程调用
- 项目 CRUD 重启后数据不丢失
- IPC 类型在 main/renderer 两侧一致

---

## Phase 5：UI 壳与布局（Layout Shell）

**目标**：搭建编辑器整体布局框架
**状态**：🔴 待开始
**涉及范围**：`apps/desktop/src/`
**依赖**：Phase 1 + Phase 3

### 5.1 整体布局结构

- 标题栏（自定义）
- 顶部工具栏
- 左侧面板（可折叠，可调宽度）
- 中央画布区
- 右侧属性面板（可折叠，可调宽度）
- 底部状态栏
- AI Chat 悬浮面板（右下角占位）

### 5.2 各面板框架

- 左侧：Layers tab + Assets tab 占位
- 右侧：Properties panel 占位
- 工具栏：基础工具按钮占位
- 状态栏：缩放显示 + 坐标显示

### 5.3 面板交互

- 折叠/展开
- 拖拽调整宽度
- 面板宽度持久化（localStorage）

### 5.4 Editor Context

- `EditorContext` + `useEditor()` hook
- 提供 document, selection, viewport, command dispatcher

### 5.5 验收标准

- 整体布局与 pen.dev 结构一致
- 暗色主题正确，各面板层次分明
- 面板可折叠展开，拖拽调宽

---

## Phase 6：画布与交互（Canvas & Interaction）

**目标**：实现可交互的无限画布
**状态**：🔴 待开始
**涉及范围**：`apps/desktop/src/canvas/`
**依赖**：Phase 5

### 6.1 无限画布渲染

- SVG 渲染，视口变换（translate + scale）
- 网格背景（点阵，暗色主题适配）
- 像素网格（放大后显示）

### 6.2 图层渲染

- Rectangle / Ellipse / Text / Frame / Group 渲染
- 选中状态：紫色边界框 + 8 控制点
- 悬停状态：高亮边框

### 6.3 交互

- 单击选中，Shift+Click 加选减选
- 拖拽移动选中对象
- 框选（marquee selection）
- 滚轮缩放（以鼠标位置为中心）
- 空格拖拽平移画布

### 6.4 变换控制点

- 四角 + 四边共 8 个缩放控制点
- 等比缩放（按住 Shift）

### 6.5 绘制工具

- Rectangle / Ellipse / Frame / Text 工具
- 拖拽创建

### 6.6 快捷键

- V（选择）、R（矩形）、O（椭圆）、F（Frame）、T（文字）、H（手型）
- Delete/Backspace（删除）、Cmd+Z（撤销）、Cmd+Shift+Z（重做）
- Cmd+A（全选）、Esc（取消选择）

### 6.7 标尺与辅助线

- 顶部 + 左侧标尺
- 智能参考线（对齐提示）

### 6.8 验收标准

- 可创建、选择、移动、删除、缩放基础形状
- 撤销重做正常工作
- 暗色主题美观，交互流畅

---

## Phase 7：属性面板 & 左侧面板（Panels）

**目标**：完整的属性检查器和图层面板，双向同步
**状态**：🔴 待开始
**涉及范围**：`apps/desktop/src/panels/`
**依赖**：Phase 6

### 7.1 Layers Panel

- 图层树（可折叠 Frame/Group）
- 搜索过滤
- 眼睛图标（可见/隐藏）、锁图标（锁定）
- 拖拽排序
- 右键菜单
- 双击重命名

### 7.2 Assets Panel

- Components tab（本地组件列表）
- Icons tab（图标库搜索 + 分类）

### 7.3 Properties Panel

- 通用属性区（名称、位置尺寸、旋转、不透明度、可见/锁定）
- Frame 属性（Flex 布局、填充、描边、圆角、阴影、溢出）
- Shape 属性（填充、描边、圆角、效果）
- Text 属性（字体、字号、对齐、颜色）
- Image 属性（图片、滤镜、圆角）
- Document 属性（无选中时，画布背景、网格、标尺）
- Design / Dev 双 Tab

### 7.4 颜色选择器组件

- 颜色预设 + 取色器 + 透明度

### 7.5 验收标准

- 选中对象 → 属性面板实时同步
- 修改属性 → 画布实时同步
- 图层面板与画布双向同步

---

## Phase 8：AI 多智能体引擎 & MCP 服务

**目标**：自然语言 → 可编辑设计文档的多智能体生成引擎
**状态**：🔴 待开始
**涉及包**：`packages/agent-*`、`packages/mcp-server`
**依赖**：Phase 2 + Phase 4

### 8.1 Agent Protocol 协议

- 消息类型定义（JSON Schema）
- Run 状态机（idle → planning → generating → verifying → done/error）

### 8.2 Agent Provider - Codex CLI

- 子进程封装（spawn / kill）
- JSONL 事件流解析
- 进度事件发射

### 8.3 Agent Runtime 运行时

- Run 生命周期管理
- 历史记录存储（文件系统）
- 取消机制

### 8.4 Agent Orchestrator 编排器

- Coordinator：需求拆解 → 区域分配
- 最多 5 个 Collaborator 并行生成
- 结果组装 + 校验

### 8.5 MCP Stdio 服务

- 5 个核心工具：getDocument, updateLayer, addLayer, deleteLayer, getSelection
- Zod 入参校验
- 错误码规范

### 8.6 前端 AI Chat 面板

- 悬浮面板（可拖拽、可放大）
- 多 Tab 对话
- 上下文附加（选区 / 图层 / 图片）
- 生成进度显示
- 结果应用到画布

### 8.7 验收标准

- 自然语言 → 生成设计 → 应用到画布 完整流程
- MCP 服务可被外部 Agent 发现并调用

---

## 2. 执行顺序与依赖关系

```
Phase 1 ── 基础架构
  │
  ├─ Phase 2 ── 设计数据模型 ◀── 可并行 ──┐
  │    └─ Phase 3 ── 编辑器核心           │
  │                                      │
  └─ Phase 4 ── 主进程 & IPC ◀───────────┘
       │
       Phase 5 ── UI 壳与布局
            │
            Phase 6 ── 画布与交互
                 │
                 Phase 7 ── 面板
                      │
                      Phase 8 ── AI 引擎 & MCP
```

**并行机会**：

- Phase 1 和 Phase 2 完全独立，可并行
- Phase 3 依赖 Phase 2，Phase 4 依赖 Phase 1，两者可并行

---

## 3. 多智能体分配方案

| Agent 名称      | 负责阶段 | 启动条件               | 说明                                   |
| --------------- | -------- | ---------------------- | -------------------------------------- |
| `foundation`    | Phase 1  | 立即启动               | React + Tailwind v4 + shadcn/ui + 路由 |
| `design-schema` | Phase 2  | 立即启动               | 设计文档数据模型 + Zod 校验 + 工具函数 |
| `editor-core`   | Phase 3  | Phase 2 完成           | 编辑器核心：命令 / 历史 / 选择 / 视口  |
| `main-process`  | Phase 4  | Phase 1 完成           | Electron 主进程 + IPC + 项目持久化     |
| `ui-shell`      | Phase 5  | Phase 3 + Phase 4 完成 | UI 布局壳 + 工具栏 + 面板框架          |
| `canvas`        | Phase 6  | Phase 5 完成           | 无限画布 + 交互 + 渲染                 |
| `panels`        | Phase 7  | Phase 6 完成           | 属性面板 + 图层面板 + 资产面板         |
| `ai-engine`     | Phase 8  | Phase 7 完成           | AI 多智能体引擎 + MCP 服务             |

---

## 4. 暗色主题实施细则

1. **Tailwind 主题**：所有颜色通过 `@theme` 令牌引用，禁止硬编码
2. **组件样式**：shadcn/ui 组件全部使用 CSS 变量驱动
3. **画布**：深色背景 `#141418`，浅色点阵网格
4. **面板**：三层深色层次（面板 `#1E1E24` / 输入 `#26262E` / hover `#2A2A33`）
5. **文字**：三级文字色（主文字 / 次要文字 / 禁用文字）
6. **边框 / 分割线**：`#2F2F3A`
7. **高亮 / 选中**：紫色 `#7C3AED` 系（品牌色）

---

## 5. 代码规范

- TypeScript strict 模式，禁止 `any`
- React 函数式组件 + hooks，禁止 class 组件
- 命名：组件 PascalCase，函数 camelCase，常量 UPPER_SNAKE_CASE，类型 PascalCase
- 文件命名：组件 `.tsx` PascalCase 文件名，工具 `.ts` camelCase 文件名
- 核心逻辑必须有 Vitest 单元测试
- 公共 API 必须有 JSDoc 注释
- import 排序：第三方 → 内部 workspace → 本地相对

---

## 6. 执行记录

| 阶段                         | 状态      | 完成度 | 说明                                                 |
| ---------------------------- | --------- | ------ | ---------------------------------------------------- |
| Phase 1: 基础架构            | ✅ 已完成 | 100%   | Tailwind v4 + 16 个 shadcn/ui 组件 + 路由 + 图标     |
| Phase 2: 设计数据模型        | ✅ 已完成 | 100%   | 构建通过 + 测试通过 + 完整类型体系                   |
| Phase 3: 编辑器核心          | ✅ 已完成 | 100%   | 命令/历史/选择/视口/事件 + 测试                      |
| Phase 4: 主进程 & IPC        | ✅ 已完成 | 95%    | 项目 CRUD + 设置 + preload API，缺菜单/自动保存      |
| Phase 5: UI 壳与布局         | 🟡 进行中 | 60%    | EditorProvider 完成，EditorPage/Dashboard 未接入数据 |
| Phase 6: 画布与交互          | 🔴 待开始 | 0%     | 纯静态 mock，需 SVG 渲染 + 完整交互                  |
| Phase 7: 属性面板 & 左侧面板 | 🔴 待开发 | 30%    | 静态原型完成，待双向绑定 + 高级控件                  |
| Phase 8: AI 引擎 & MCP       | 🔴 待开始 | 5%     | 目录结构 + stub 占位                                 |

---

_文档版本：v3.0 · 最后更新：2026-10-11 · 代码审计后更新_

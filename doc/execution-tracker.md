# 执行计划与追踪（Execution Tracker）

> 基于代码实际检查状态更新 · 暗色主题优先
> 更新时间：2026-10-11 傍晚

---

## 一、当前状态总览

| 阶段                         | 状态        | 完成度 | 说明                                                         |
| ---------------------------- | ----------- | ------ | ------------------------------------------------------------ |
| Phase 1: 基础架构            | ✅ 已完成   | 100%   | React 19 + Tailwind v4 + shadcn/ui 16个组件 + 路由 + 图标    |
| Phase 2: 设计数据模型        | ✅ 已完成   | 100%   | design-schema 包，types + zod schema + utils + tests         |
| Phase 3: 编辑器核心          | ✅ 已完成   | 100%   | editor-core 包，命令/历史/选择/视口/事件/层级/对齐分布       |
| Phase 4: 主进程 & IPC        | ✅ 已完成   | 95%    | projectStore / ipcHandlers / settings / preload / 自动保存   |
| Phase 5: UI 壳与布局         | ✅ 已完成   | 100%   | EditorProvider / EditorPage / TitleBar / StatusBar / Toolbar |
| Phase 6: 画布与交互          | ✅ 基本完成 | 98%    | 新增：文字双击内联编辑                                       |
| Phase 7: 属性面板 & 左侧面板 | ✅ 基本完成 | 95%    | 新增：多选属性编辑 + 对齐分布工具栏                          |
| Phase 8: AI 引擎 & MCP       | ⏳ 未开始   | 5%     | 目录结构 + stub 占位                                         |

---

## 二、第四批完成总结

### ✅ 对齐与分布工具栏

- editor-core 新增 alignSelection / distributeSelection 命令（支持 undo）
- 6 个对齐按钮：左对齐 / 水平居中 / 右对齐 / 顶对齐 / 垂直居中 / 底对齐
- 2 个分布按钮：水平分布 / 垂直分布
- 选中少于 2 个图层时按钮自动禁用
- Tooltip 显示功能名称

### ✅ 多选属性编辑

- 属性面板支持选中多个图层时编辑共有属性
- 值不一致时显示空状态，输入后统一应用到所有选中图层
- 支持：不透明度、可见性、锁定、填充、描边、效果
- 顶部显示 "已选中 N 个图层"
- 文字属性仅在全部为文字图层时显示

### ✅ 文字双击内联编辑

- 双击文字图层进入编辑模式
- contentEditable 区域，样式与原图层一致（字体/字号/颜色/对齐）
- 位置和尺寸匹配视口变换（pan + zoom）
- Esc 取消 / Enter 换行 / 点击外部确认
- 编辑时禁用画布拖拽选择

---

## 三、全部功能清单（按模块）

### Phase 6 画布（24 项）

1. SVG 无限画布 + 视口变换
2. 点阵网格背景
3. 6 种图层渲染（矩形/椭圆/文字/Frame/组/便签）
4. 单击选中 + Shift 加选减选
5. 拖拽移动（支持多选）
6. 滚轮缩放（以鼠标为中心，0.1x-16x）
7. 空格/中键/手型工具平移
8. 选中态 + 8 个控制点
9. 多选包围盒
10. 控制点缩放 + Shift 等比
11. 框选（marquee）
12. 拖拽绘制形状
13. 绘制时 Shift 约束为正圆/正方
14. 工具快捷键 V/R/O/F/T/H/Z/Esc
15. 悬停高亮
16. 缩放工具
17. 空状态提示
18. AI Chat 按钮占位
19. 水平 + 垂直标尺
20. 鼠标位置指示线
21. 智能参考线（拖拽对齐）
22. Cmd/Ctrl + R 切换标尺
23. 文字双击内联编辑
24. 文字工具点击创建即进入编辑

### Phase 7 属性面板

- 名称 / 位置 / 尺寸 / 不透明度 / 圆角
- 可见 / 锁定开关
- 填充：颜色 + 不透明度
- 描边：颜色 / 粗细 / 样式
- 文字：内容 / 字号 / 字重 / 行高 / 字间距 / 对齐 / 装饰线
- 效果：阴影（多）
- Design / Dev Tab
- Figma 风格颜色选择器
- 多选属性编辑

### Phase 7 图层面板

- 树形结构 + 折叠展开
- 搜索过滤
- 可见/锁定切换
- 双击重命名
- 右键菜单（12 项）
- 拖拽排序 + 拖入 Frame/Group
- Shift 范围选择 + Cmd/Ctrl 加选
- 图层类型图标

### Phase 7 工具栏

- 选择 / 缩放 / 手型工具
- 矩形 / 椭圆 / Frame / 文字 / 便签 / 钢笔
- 撤销 / 重做
- 复制 / 组合 / Frame / 删除
- 6 个对齐 + 2 个分布按钮

### Phase 4 Dashboard IPC

- 项目列表 / 新建 / 删除 / 导入
- 网格/列表视图 + 搜索
- 跳转编辑器 + 自动保存
- 返回 Dashboard

---

## 四、验证状态

- ✅ design-schema typecheck 通过
- ✅ editor-core typecheck 通过
- ✅ desktop typecheck 通过
- ✅ design-schema 单元测试：35/35 通过
- ✅ editor-core 单元测试：23/23 通过

---

## 五、剩余工作

### P2

1. Frame Flex 布局属性
2. 像素网格（高倍缩放显示）
3. 旋转
4. 文字换行与自动尺寸

### P3（AI 引擎）

5. MCP 服务（将设计图暴露给外部 Agent）
6. AI Chat 面板
7. Agent 运行时 + 多智能体生成引擎

---

## 六、pen.dev 工具栏 + 属性面板对齐（2026-10-16）

> 依据源码级参考 `doc/pencil-toolbar-properties-reference.md` 与设计文档
> `doc/superpowers/specs/2026-10-16-pen-toolbar-properties-alignment-design.md` 实施。
> 计划：`doc/superpowers/plans/2026-10-16-pen-schema-alignment.md`、`...-pen-toolbar-alignment.md`、`...-pen-properties-panel.md`。

### 已完成

**Plan A · 数据模型（design-schema）**

- `FrameLayout` 改为 pen.dev 单轴模型：`{ mode: none|vertical|horizontal, gap, padding, justifyContent, alignItems }`。
- `BaseLayer` 新增 `layerPosition: auto|absolute`（zod 默认 `auto`）与可选 `metadata`。
- `BlendMode` 补齐到 18 项；`cornerRadius` 支持四角独立；`FillType` 增加 `angularGradient`/`meshGradient`（含 `gradientType`）；`EffectType` 增加 `shader`。
- 新增 `normalizeFrameLayout` / `normalizeDocument`，并接入 `validateDocument`（兼容旧 `layout:{enabled}` 文档）。

**Plan B · 工具栏（editor-interaction + desktop）**

- `CanvasToolId` 重命名 `select`→`move`、移除 `triangle`、新增 `scale`/`comment`/`polygon`/`icon`/`script`/`browser`/`pen_move`/`pen_cut`；新增 `toolToLayerType`。
- 工具栏改为数据驱动 `TOOL_GROUPS`：Move/Scale、Primitives（Flyout，钉 Rectangle+Ellipse，Polygon/Icon/Script 置灰占位）、Pen、Text、Frame、Sticky、Browser（桌面）、Hand、Comment（占位）。
- Pen 子工具栏（Pen/Select points/Cut/Done）+ 全局工具快捷键（钢笔流程内 P/V/X/Enter 走子工具）。

**Plan C · 属性面板（desktop）**

- 重构为声明式 Section 注册表（`PropertySection` + `registry`），删除旧 react-hook-form 桥。
- 实现 Section：Header、Alignment、Position、Layout、Appearance、Fill、Stroke、Typography、Effects、Export、Metadata。
- 共享控件：`SectionHeader`/`NumberField`（拖拽/↑↓）/`SegmentedControl`/`SelectField`/`CheckboxField`/`ColorField`。
- `EditorApi` 新增 `appendStyleItem`/`updateStyleItem`/`removeStyleItem`（可撤销）。

### 验证

- `pnpm typecheck` 全仓通过；design-schema 53 / editor-core 23 / editor-interaction 4 单测通过。
- `pnpm lint`：仅 `packages/canvas-ruler/dist/style.css`（既有、与本特性无关）stylelint 报错。

### 已接受的取舍 / 后续

- **多选编辑**：仅 Header/Alignment/Position 支持多选；其余 Section 在 `layers>1` 时不渲染（保留后续扩展）。
- **Export 面板**：格式/倍率为占位，未接实际导出。
- **非目标（未实现）**：Script、Browser 节点、Icon 节点、Theme、Slot、Component、Vector（路径编辑面板）、Shader 编辑器、Fill 的渐变/图片完整编辑器。
- **已知 Minor（延后）**：`ColorField` 每次按键即提交（历史记录偏多）；`AppearanceSection` 的 `set` 对多选全量写入；Escape 由 `EditorProvider` 与 `useToolShortcuts` 双监听；`toolConfig` 的 `SHAPE_TOOLS` 未使用。

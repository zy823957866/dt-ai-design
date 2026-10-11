# pen.dev 桌面端 · 完整界面清单

> 基于 [pen.dev 官方文档](https://docs.pen.dev/) 整理，覆盖桌面端全部界面、面板、弹框、菜单与状态。
> 核心定位：**An agentic canvas for building bold software** —— AI 原生画布 + 设计即代码 + Flex 布局。

---

## 一、整体布局

pen.dev 桌面端采用经典「画布优先」四栏布局，所有面板可停靠、浮动、折叠、拖拽重排：

```
┌──────────────────────────────────────────────────────────────────────┐
│ ① 标题栏 + 顶部工具栏                                               │
├──────────┬───────────────────────────────────────┬──────────────────┤
│          │                                       │                  │
│ ② 左侧   │                                       │   ④ 右侧属性     │
│    面板   │          ③ 无限画布                    │         面板     │
│          │                                       │                  │
│  Layers  │                                       │  Properties      │
│  Assets  │                                       │  Design / Dev    │
│          │                                       │  AI Chat 悬浮    │
├──────────┴───────────────────────────────────────┴──────────────────┤
│ ⑤ 底部状态栏                                                         │
└──────────────────────────────────────────────────────────────────────┘
      ┌──────────────────────────────────────────────────┐
      │              ⑥ AI Chat 悬浮面板（右下角）         │
      └──────────────────────────────────────────────────┘
```

**核心面板（6 个）**

| 面板             | 默认位置   | 用途                        | 切换方式             |
| ---------------- | ---------- | --------------------------- | -------------------- |
| Layers Panel     | 左侧       | 图层树、可见性、排序、分组  | 点击 Layers 图标切换 |
| Assets Panel     | 左侧       | 组件库、图标、设计库、变量  | Assets 图标切换      |
| Properties Panel | 右侧       | 选中对象全部属性配置        | 右上角最小化按钮     |
| AI Chat Panel    | 右下角悬浮 | AI 代理对话、生成、修改     | `Cmd/Ctrl + K`       |
| Settings         | 弹框       | 通用、外观、AI 模型、快捷键 | 菜单 / 头像          |
| Dashboard        | 独立窗口   | 最近文件、模板、新建        | `Cmd/Ctrl + N`       |

---

## 二、标题栏 & 顶部工具栏

### 2.1 标题栏

- 左侧：pen.dev 徽标 + 文件名（带未保存标记 `*`）
- 中间：面包屑（项目 / 文件）+ 缩放百分比
- 右侧：分享按钮、预览模式切换（Design / Dev / Present）、用户头像、窗口控制按钮

### 2.2 顶部工具栏（Canvas Toolbar）

画布正上方一条紧凑工具条，根据选中对象动态变化。

**默认工具（选中形状或无选中）**

| 组   | 工具            | 快捷键                       | 说明                         |
| ---- | --------------- | ---------------------------- | ---------------------------- |
| 选择 | Move tool       | `V`                          | 选择和移动对象               |
| 缩放 | Zoom tool       | 按住 `Z`                     | 点击放大，Option+点击缩小    |
| 手型 | Hand tool       | `H` / 空格拖拽               | 平移画布                     |
| 形状 | Rectangle       | `R`                          | 矩形 / 圆角矩形              |
| 形状 | Ellipse         | `O`                          | 椭圆 / 正圆                  |
| 形状 | Frame           | `A` / `F`                    | 画框（容器，支持 Flex 布局） |
| 形状 | Text            | `T`                          | 文字                         |
| 形状 | Sticky note     | `N`                          | 便利贴 / 便签                |
| 形状 | Pen tool        | `P`                          | 钢笔 / 矢量路径              |
| 编辑 | Scale tool      | `K`                          | 缩放对象                     |
| 操作 | Group / Ungroup | `Cmd+G` / `Cmd+Shift+G`      | 组合 / 解组                  |
| 操作 | Frame selection | `Cmd+Option+G`               | 用 Frame 包裹选区            |
| 操作 | Flex layout     | `Shift+A` / `Shift+Option+A` | 添加 / 移除 Flex 布局        |
| 操作 | Component       | `Cmd+Option+K`               | 转成组件 / 还原              |

**选中文字时额外出现**：字体选择器、字号、字重、对齐、颜色

**选中多个对象时额外出现**：对齐工具（左/中/右、上/中/下）、分布、等宽等高

### 2.3 全局菜单栏

#### File

```
New File             Cmd+Shift+N
Open Dashboard       Cmd+N
Open File...         Cmd+O
Open Recent          ▸
────────────────────────────────
Save                 Cmd+S
Save As...           Cmd+Shift+S
────────────────────────────────
Import...            ▸  Figma / SVG / HTML / Image
Export...            ▸  PNG / JPEG / WEBP / PDF / HTML
Export Selection as PNG    Cmd+Shift+C
Copy as HTML         Cmd+Option+C
────────────────────────────────
Share...
────────────────────────────────
Close Tab            Cmd+W
Close Window         Cmd+Shift+W
```

#### Edit

```
Undo                 Cmd+Z
Redo                 Cmd+Shift+Z
────────────────────────────────
Cut                  Cmd+X
Copy                 Cmd+C
Paste                Cmd+V
Paste to Replace     Cmd+Shift+R
Duplicate            Cmd+D
Delete               Delete / Backspace
────────────────────────────────
Select All           Cmd+A
Deselect All         Esc
Select Parent        Shift+Enter
Select Children      Enter
Direct Select        Cmd+Click
────────────────────────────────
Find...              Cmd+F
Find and Replace...  Cmd+Option+F
```

#### View

```
Zoom In              Cmd++
Zoom Out             Cmd+-
Zoom to 100%         Cmd+0
Zoom to Fit          Shift+1
Zoom to Selection    Shift+2
────────────────────────────────
Full Screen          Cmd+Ctrl+F
────────────────────────────────
Pixel Grid           Cmd+'
Snap to Pixel Grid   Cmd+Shift+'
Rulers               Cmd+R
Smart Guides
Snap to Objects
────────────────────────────────
Layers Panel
Assets Panel
Properties Panel
AI Chat              Cmd+K
────────────────────────────────
Reset Layout
```

#### Object

```
Group                Cmd+G
Ungroup              Cmd+Shift+G
Frame Selection      Cmd+Option+G
────────────────────────────────
Bring Forward        Cmd+]
Send Backward        Cmd+[
Bring to Front       ]
Send to Back         [
────────────────────────────────
Align                ▸  Top / Center / Bottom / Left / Middle / Right
Distribute           ▸  Horizontally / Vertically
────────────────────────────────
Flip Horizontal
Flip Vertical
Rotate 90° CW
Rotate 90° CCW
────────────────────────────────
Add Flex Layout      Shift+A
Remove Flex Layout   Shift+Option+A
────────────────────────────────
Create Component     Cmd+Option+K
Detach Instance      Cmd+Option+X
Replace in Instance  Option+Shift+R
────────────────────────────────
Lock                 Cmd+L
Unlock All
Hide
Show All
```

#### Text

```
Bold                 Cmd+B
Italic               Cmd+I
Underline            Cmd+U
Strikethrough
────────────────────────────────
Font                 ▸
Size                 ▸
Line Height          ▸
Letter Spacing       ▸
────────────────────────────────
Align Left           Cmd+[
Align Center         Cmd+|
Align Right          Cmd+]
Justify
────────────────────────────────
Transform            ▸  Uppercase / Lowercase / Capitalize
```

#### AI

```
Toggle AI Chat       Cmd+K
New Agent Tab        Cmd+T
Next Chat Tab        Ctrl+Tab
Previous Chat Tab    Ctrl+Shift+Tab
────────────────────────────────
Add Selection to Context
Generate Alternatives
────────────────────────────────
Open Skills Panel
Prompt History       ↑/↓ in chat
```

#### Window / Help

```
Dashboard            Cmd+N
Minimize
Zoom
────────────────────────────────
Documentation
Keyboard Shortcuts   Cmd+/
Community (Discord)
────────────────────────────────
Check for Updates
About pen.dev
```

---

## 三、左侧面板

### 3.1 Layers Panel（图层面板）

**位置**：左侧停靠，可折叠

**顶部**：搜索框（按图层名过滤）、右侧视图切换（列表视图 / 缩览图视图）

**主体 —— 图层树**：

- 每个图层条目：类型图标 + 图层名 + 眼睛图标（可见/隐藏）
- Frame / Group 可折叠（三角箭头）
- 选中态：蓝色高亮
- 拖拽：上下排序、拖入拖出 Frame/Group
- 双击：重命名

**右键菜单**：Rename / Duplicate / Delete / Group - Ungroup / Frame Selection / Copy - Paste / Copy as PNG - Copy as HTML / Lock - Unlock / Hide - Show / Bring to Front - Send to Back / Create Component / Select All Inside / Find on Canvas

**底部**：图层计数 + 排序方向切换
**空状态**：提示「绘制一个形状来开始」

### 3.2 Assets Panel（资产 / 组件库面板）

**位置**：左侧停靠，与 Layers 切换

**Tab 结构**：

| Tab        | 内容                                 |
| ---------- | ------------------------------------ |
| Components | 当前文件的组件、团队设计库组件       |
| Icons      | 内置图标库（可搜索、分类）           |
| Libraries  | 已安装的设计库列表                   |
| Variables  | 颜色、尺寸、字体等变量（详见第八章） |

**Components Tab**：搜索框、分类（本地组件 / 已安装库）、网格视图（组件缩略图 + 名称）、右键（Edit Master / Detach / Rename / Delete / Publish）、底部「Create Component」按钮

**Icons Tab**：搜索框、分类网格（Basic / UI / Social / Arrows / Brands...）、拖拽到画布直接使用、可换色换粗细

---

## 四、画布区域

### 4.1 Infinite Canvas（无限画布）

- 核心特性：**无限画布**，可向任意方向延伸
- 背景：浅灰色点阵 / 纯白（可切换）
- 像素网格：可开关（`Cmd+'`），可设置吸附（`Cmd+Shift+'`）
- 画布中可放置任意多个 **Frame**（画框）

### 4.2 Frames（画框 / 页面容器）

Frames 是 pen.dev 的核心容器概念，相当于 Figma 的 Frame 加上 Flexbox 能力：

- 作用：组合相关元素、定义屏幕边界、支持 **Flex layout**（弹性布局）
- 操作：Frame tool 拖拽创建 / `Cmd+Option+G` 用 Frame 包裹选区 / 可嵌套
- 选中状态：蓝色边框 + 四角/四边控制点 + 标签显示 Frame 名

### 4.3 Selection & Highlighting（选择与高亮）

- 单击选中 / `Cmd+Click` 深层选择 / `Cmd+Drag` 框选嵌套元素 / `Shift+Click` 加选减选
- 选中对象显示：蓝色边界框 + 8 个控制点 + 顶部旋转点 + 属性面板同步更新

### 4.4 画布内右键菜单

```
Cut / Copy / Paste
Duplicate            Cmd+D
Delete
────────────────────────────────
Group / Ungroup
Frame Selection
────────────────────────────────
Bring Forward / Send Backward
Bring to Front / Send to Back
────────────────────────────────
Lock / Unlock
Hide / Show
────────────────────────────────
Flip Horizontal / Flip Vertical
────────────────────────────────
Create Component     Cmd+Option+K
Detach Instance
────────────────────────────────
Copy as PNG          Cmd+Shift+C
Copy as HTML         Cmd+Option+C
Export Selection...
────────────────────────────────
Add to AI Context
Ask AI to modify...
```

### 4.5 画布导航

- 缩放：`Cmd+滚轮`、`Cmd+`+`/`-`、`Cmd+0`(100%)、`Shift+1`(适应窗口)、`Shift+2`(适应选区)
- 平移：空格拖拽、中键拖拽、`Shift+滚轮` 横向滚动
- 缩放到区域：按住 `Z` 拖拽框选

### 4.6 画布辅助元素

- Rulers（标尺）：顶部 + 左侧，`Cmd+R` 切换
- Smart Guides（智能参考线）：对齐时粉/紫色自动出现，带距离数值
- Pixel Grid（像素网格）：放大后可见，`Cmd+'` 切换
- Snap to Objects（对象吸附）
- Guides（辅助线）：从标尺拖出

---

## 五、右侧 Properties Panel（属性面板）

**位置**：右侧停靠，可最小化（点击右上角按钮）
面板内容根据选中对象类型动态变化。

### 5.1 通用属性区（所有对象都有）

- 名称：可编辑图层名输入框
- 位置 & 尺寸：X/Y 坐标、W/H 尺寸（含约束比例锁）
- 旋转：角度输入
- 不透明度：百分比
- 混合模式：下拉（Normal / Multiply / Screen / Overlay 等）
- 可见性：眼睛图标
- 锁定：锁图标

### 5.2 Frame 属性

Frame 是 pen.dev 的特色容器，属性比普通形状多：

**Layout（布局）**

- Layout mode：None / **Flex row** / **Flex column**
- Direction：Row / Row reverse / Column / Column reverse
- Wrap：No wrap / Wrap
- Justify content：Flex start / Center / Flex end / Space between / Space around / Space evenly
- Align items：Flex start / Center / Flex end / Stretch / Baseline
- Gap：间距（数字输入）
- Padding：上/右/下/左（可锁定统一值）

**Size**：Width / Height、Sizing（Fixed / Hug contents / Fill container）

**Background**：Solid / Gradient / Image / None + 颜色选择器（支持变量引用）

**Border & Shadow**：描边（颜色 + 粗细 + 位置）、圆角（4 角独立）、阴影（可多层叠加）

**Overflow**：Visible / Hidden / Scroll / Auto

**Advanced**：圆角快捷入口、Blur（Layer blur / Background blur）、Opacity

### 5.3 Shape（矩形 / 椭圆 / 路径）属性

- Fill：Solid / Linear gradient / Radial gradient / Image / Pattern
- Stroke：颜色 + 粗细 + 样式 + 端点 + 拐角
- Effects：Drop shadow / Inner shadow / Glow / Blur（可多层）
- Corner radius（矩形）：4 角独立控制
- 可转 Path（钢笔编辑）

### 5.4 Text（文字）属性

字体选择器（带预览+搜索）、字重/字号/行高/字间距/段间距、颜色（填充+描边）、对齐（左/中/右/两端）、大小写、装饰（下划线/删除线）、垂直对齐、尺寸模式（Auto width / Auto height / Fixed size）、省略号、文字变量绑定

### 5.5 Image（图片）属性

Fill / Fit / Stretch / Tile / Original size、替换图片按钮、滤镜（Brightness/Contrast/Saturation/Hue/Blur）、圆角/描边/阴影、裁剪模式入口

### 5.6 Sticky Note（便签）属性

背景色（预设色板）、文字内容、字号、作者名、颜色标签

### 5.7 Component Instance（组件实例）属性

组件名称 + 跳转 Master 按钮、Detach 按钮、Overrides（可被修改的属性列表 + Reset overrides）、Variants（变体切换下拉）

### 5.8 无选中 —— Canvas / Document 属性

未选中任何对象时，属性面板显示文档级设置：Document name、Canvas background color、Pixel grid（开关+颜色+间距）、Ruler units、Snap to pixel grid、File info（路径/大小/修改时间）

### 5.9 Design / Dev 双视图

属性面板顶部有两个 Tab：

| Tab        | 内容                                                        |
| ---------- | ----------------------------------------------------------- |
| **Design** | 上面列的所有设计属性（视觉化控件）                          |
| **Dev**    | 代码视图：CSS / Tailwind / React / Vue 代码片段，可一键复制 |

Dev Tab 特色（pen.dev「设计即代码」核心）：实时 CSS、框架切换（React/Vue/Svelte/HTML）、样式方案切换（CSS/Tailwind/Inline）、变量引用显示、Copy code 按钮

---

## 六、AI Chat Panel（AI 聊天面板）★ 核心特色

pen.dev 最有辨识度的界面。默认悬浮在右下角，可拖拽、可全屏、可多 tab。

### 6.1 面板结构

```
┌─────────────────────────────────┐
│  Tab1  Tab2  + New Agent   ⋮   │  ← Tab 栏
├─────────────────────────────────┤
│                                 │
│   AI 消息气泡（带代码块、       │
│   图片、可操作按钮）            │
│                                 │
│   用户消息气泡                  │
│                                 │
│   🔄 正在生成中...              │
│                                 │
├─────────────────────────────────┤
│ 📎 上下文  🔧 Skills  ▶ 发送   │  ← 输入区
│ 输入提示词... (↑/↓ 历史)        │
└─────────────────────────────────┘
```

### 6.2 Tab 栏

- 每个 Tab = 一个独立的 AI Agent 对话
- 「+ New agent」按钮（`Cmd+T`）开启新对话
- 右键 Tab：Rename / Duplicate / Close / Close others
- 切换：`Ctrl+Tab` / `Ctrl+Shift+Tab`

### 6.3 消息区

- 用户消息：右侧气泡，可编辑、可删除
- AI 消息：左侧气泡
  - 文字回答
  - 代码块（带复制按钮、语言标签）
  - 生成的设计预览（可 Apply to canvas / Regenerate / Reject）
  - 图片（可放大、保存）
- 消息状态：思考中 / 生成中 / 已完成 / 出错
- 消息操作：复制 / 重新生成 / 点赞 / 点踩

### 6.4 输入区

- 多行输入框（支持 Markdown、代码块）
- 快捷键：`Enter` 发送，`Shift+Enter` 换行
- 历史记录：`↑` / `↓` 浏览历史提示词
- 左侧按钮：
  - 📎 **Attach context**：附加选区 / 图层 / 文件到上下文
  - 🔧 **Skills**：打开技能面板（见 6.6）
  - 🖼️ **Attach image**：附加图片参考
- 右侧：模型选择下拉 + 发送按钮

### 6.5 上下文面板（Attach Context）

点击 📎 按钮弹出：

- **Selected on canvas**：当前选中对象（自动加入）
  - 显示缩略图 + 图层名 + 手动移除按钮
- **Add layers...**：从图层树选择附加
- **Add image...**：上传参考图
- **Add file...**：附加设计文件 / 代码文件
- **Screenshot**：截取屏幕区域作为参考

### 6.6 Skills 面板（技能市场）

AI 能力扩展，每个 Skill 是一个可被 AI 调用的工具/流程：

- 分类：Design / Code / Research / Productivity
- 每个 Skill 卡片：图标 + 名称 + 简介 + 启用开关
- 内置 Skill 示例：
  - **Generate mockup**：生成产品模型图
  - **Icon set creator**：批量生成图标
  - **Color palette**：生成配色方案
  - **Design audit**：审查设计一致性
  - **Accessibility check**：无障碍检查
  - **Copy to code**：精确转代码
  - **User story generator**：生成用户故事
  - **Flow diagram**：画流程图
- 「Create Skill」按钮（用户可自定义技能）
- 社区市场入口

### 6.7 生成结果交互操作条

当 AI 生成了设计修改时，会出现一个操作条：

```
┌──────────────────────────────────────────────┐
│ AI 建议的修改已就绪  [ 预览 ] [ 应用 ] [ 拒绝 ] │
│                  [ ↺ 重新生成 ] [ 🔀 变体 ]    │
└──────────────────────────────────────────────┘
```

- **Preview**：在画布上半透明预览效果
- **Apply**：接受修改，应用到画布
- **Reject**：拒绝，保持原样
- **Regenerate**：重新生成一次
- **Alternatives**：生成多个变体供选择（3-5 个缩略图网格）

---

## 七、Variables Panel（变量 / 设计令牌）★

pen.dev 的核心能力之一 —— 设计变量即代码变量，双向同步。

### 7.1 面板结构

- 搜索框
- 分类 Tab：Color / Size / Font / Shadow / Radius / All
- 变量列表：变量名 + 预览 + 值 + 引用次数
- 每个变量行：左侧（颜色/数值预览）、中间（变量名如 `--color-primary-500`）、右侧（当前值，可编辑）
- 右键变量：Edit / Duplicate / Delete / Find all usages / Copy name / Copy value

### 7.2 变量编辑器（弹框）

- 变量名称
- 分类（Color / Number / String / Boolean / Font family / Shadow）
- 初始值
- **Alias（别名）**：可以引用另一个变量（如 `--color-primary = --blue-500`）
- 描述（可选）
- 使用范围：当前文件 / 设计库同步

### 7.3 Sync with Code（代码同步）

- 导出为 CSS Variables / SCSS / JSON / Tailwind theme
- 从代码文件导入变量
- 双向同步开关

---

## 八、Components & Slots（组件与插槽）★

### 8.1 Components 面板

详见 3.2 Assets → Components Tab。补充：

- **Component Master**：主组件，修改后所有实例同步
- **Instance**：实例，可选择性覆盖（Overrides）
- **Variants（变体）**：同一组件的不同状态（Default / Hover / Disabled / Active）
- **Detach**：实例脱离组件，变成普通元素
- **Replace**：用另一个组件替换当前实例

### 8.2 Slots（插槽）

pen.dev 的特色组件能力 —— 组件内部预留可填充区域：

- **创建 Slot**：在 Component Master 中选中元素，标记为 Slot
- **使用 Slot**：在实例中拖拽内容到 Slot 区域即可替换
- **Slot 状态**：空状态（显示占位提示）/ 已填充状态
- **Slot 面板**：列出组件内所有 Slot、每个 Slot 的名称 + 填充状态 + 清除按钮、拖拽填充 / 点击选择填充

---

## 九、Code on Canvas（画布上的代码）★

pen.dev 的颠覆性能力——代码块可以直接放在画布上，和设计元素联动。

### 9.1 Code Block 元素

画布上的代码块就像一个形状：代码编辑器（语法高亮：HTML / CSS / JS / React / Vue）、可调整大小、实时预览模式（运行代码显示结果）、「Run」按钮执行、代码可驱动画布上的其他元素

### 9.2 代码块属性

语言（HTML / CSS / JavaScript / TypeScript / JSX / TSX / Markdown）、主题（浅色 / 深色）、字号、行号开关、自动运行开关、依赖管理（npm 包搜索和导入）

### 9.3 API Reference 面板

Code on Canvas 的配套面板：API 分类索引、搜索、代码示例（可一键复制）、画布对象 API（读取/修改画布元素）

---

## 十、Design Libraries（设计库）

### 10.1 Libraries 面板

位置：Assets Panel → Libraries Tab

- 已安装库列表（库名称 + 作者 + 开关 + 更新提示圆点）
- 「+ Add library」按钮
- 库操作：Open library file / Update / Remove / Publish（自有库）

### 10.2 发布库弹框

库名称 + 描述、版本号、更新日志输入框、可见范围（私人 / 团队 / 公开）、「Publish」按钮

---

## 十一、Settings（设置）

通过菜单或头像进入，弹框式（左侧 Tab + 右侧内容）。

### 11.1 General（通用）

Theme（Light / Dark / System）、Language、Default canvas zoom（Fit / 100%）、Auto-save（开关+间隔）、Default file location、Startup（打开 Dashboard / 上次文件 / 空白）

### 11.2 AI（人工智能）

Default model（下拉选择默认模型）、API keys（各模型服务商的 key 配置）、Data collection、Context window size、Offline mode、Temperature（默认创造性滑块 0-1）

### 11.3 Appearance（外观）

UI density（Compact / Default / Comfortable）、Canvas background、Grid color / Grid size、Accent color（主题强调色）、界面字体

### 11.4 Shortcuts（快捷键）

搜索框、分组列表（AI Chat / Tools / Editing / Arrange / Selection / Components / Canvas Navigation / Path editing / Canvas Settings / File Operations）、每行可编辑、「Reset to defaults」、Export / Import（JSON）、Print / Save as PDF

### 11.5 Plugins / Extensions

已安装插件列表（开关 + 版本 + 设置）、「Browse plugins」、「Install from file...」

### 11.6 Account（账户）

头像 + 用户名 + 邮箱、订阅计划 / 升级入口、同步设置开关、设备管理、退出登录

### 11.7 About

版本号、更新日志链接、许可协议、团队信息

---

## 十二、Dashboard（启动台 / 仪表盘）

新建窗口或 `Cmd+N` 打开的独立窗口界面。

### 12.1 布局

- 顶部：Logo + 搜索框 + 用户头像
- 左侧边栏：Recent / Templates / Shared / Team libraries / Trash / Settings
- 右侧主区域：对应分类的内容网格

### 12.2 Recent（最近文件）

视图切换（网格 / 列表）、文件卡片（缩略图 + 文件名 + 最后修改时间 + 更多操作）、排序（最近修改 / 名称 / 大小）、New file 按钮、Import file 按钮

### 12.3 Templates（模板）

分类（Web / Mobile / Dashboard / Landing page / Presentation / Icon set）、模板卡片网格、模板详情弹框（大图预览 + 描述 + 页数 + 使用按钮）

### 12.4 搜索结果

顶部搜索框、结果分类（Files / Templates / Components / Help docs）、实时结果列表

---

## 十三、弹框 / 对话框

### 13.1 文件操作类

- **New file**：文件名 + 尺寸预设（Web 1440 / iPhone 15 / Desktop / Custom）+ 创建
- **Open file**：系统文件选择器 + 最近文件快捷方式
- **Save as**：文件名 + 位置 + 格式（.pen）
- **Import**：选择文件（Figma / SVG / HTML / Image）+ 导入选项

### 13.2 导出类

- **Export** 弹框：格式（PNG / JPEG / WEBP / PDF / SVG / HTML）、质量（JPEG/WEBP）、缩放（1x/2x/3x/Custom）、背景（Transparent / White / Canvas bg）、范围（Current frame / All frames / Selection）、目标位置、Export 按钮 + 进度条
- **Copy as HTML** 设置弹框：框架切换（React / Vue / Svelte / Plain HTML）、样式（CSS / Tailwind / Inline）、Copy 按钮

### 13.3 AI 相关弹框

- **Model selector**：模型列表（按提供商分组）+ 搜索 + 每个模型的能力标签（Vision / Code / Fast）
- **API key setup**：各服务商 key 输入 + 测试连接按钮
- **Skill install**：Skill 详情 + 安装按钮 + 权限说明

### 13.4 组件 / 变量类

- **Create component**：组件名称 + 描述 + Create
- **Variable editor**：见第七章 7.2
- **Publish library**：见第十章 10.2

### 13.5 系统类

未保存退出（Save / Don't save / Cancel）、Delete confirmation、Font missing（缺失字体列表 + 替换方案 + 批量替换）、Update available、Error / Warning（保存失败 / 同步失败 / 网络断开 + 重试）

### 13.6 颜色选择器（复合弹框）

pen.dev 的颜色选择器支持变量绑定：

- 大色域 + 色相条 + 透明度条
- 模式切换：HEX / RGB / HSL / OKLCH
- 各通道数值输入
- 吸管工具（取画布任意位置颜色）
- 色板区域（3 Tab）：Document colors / Variables（颜色变量，可点击绑定）/ Recent
- 「+ Add to variables」按钮
- 渐变模式切换：Solid / Linear / Radial / Conic
- 渐变编辑器（色标 + 角度）

---

## 十四、下拉面板 / Popover

| 面板              | 入口             | 内容                                           |
| ----------------- | ---------------- | ---------------------------------------------- |
| Font picker       | 属性面板字体     | 字体列表（带预览）+ 搜索 + 最近使用 + 字体变量 |
| Color picker      | 属性面板颜色     | 见 13.6                                        |
| Alignment popover | 工具栏对齐       | 9 宫格对齐 + 分布                              |
| Stroke style      | 属性面板描边     | 实线/虚线 + 宽度预设 + 端点/拐角               |
| Layer blend mode  | 属性面板混合模式 | 混合模式列表（分组）                           |
| Zoom dropdown     | 标题栏缩放       | 预设缩放 + 自定义输入                          |
| Model selector    | AI 面板          | 模型列表 + 提供商分组                          |
| Share menu        | 标题栏分享       | 复制链接 / 邀请协作者 / 导出 / 发布            |

---

## 十五、Path Editing（路径编辑）模式

选中形状按 `Enter` 进入，`V` 切换选点工具、`X` 切换切割工具。

- 路径上显示所有锚点（空心/实心 = 未选中/选中）
- 选中点显示贝塞尔手柄
- 顶部临时工具条：Select points（V）/ Cut tool（X）/ Pen tool（P）/ Connect points（Cmd+J）
- 底部状态栏：选中点数、坐标
- 双击锚点：平滑点 ↔ 角点切换

---

## 十六、Presentation / Preview 模式

全屏原型预览，类似 Figma 演示模式。

- 顶部悬浮条（自动隐藏）：后退 / 前进、Frame 列表下拉、热区显示开关、全屏开关、退出
- 画布：Frame 占满窗口，可点击交互（跳转、悬停态）
- 快捷键：`←` `→` 翻页，`Esc` 退出

---

## 十七、Shaders & Effects（着色器 / 特效）★

pen.dev 的高级视觉能力，在属性面板 Effects 区管理。

### 17.1 Effects 列表

Drop shadow / Inner shadow / Layer blur / Background blur / Outer glow / Inner glow / 3D transform / **Custom shader**（用户可写 GLSL）

每个效果：开关 + 上下排序 + 删除

### 17.2 Shader Editor（着色器编辑器）

选择「Custom shader」后展开的代码编辑器：GLSL 代码编辑（语法高亮 + 自动补全）、实时预览、Uniform 参数面板（可绑定变量）、Apply / Reset 按钮、内置 Shader 模板库（噪点、渐变、故障艺术、毛玻璃等）

---

## 十八、状态类界面

### 18.1 加载状态

文件打开（中央进度条 + 文件名）、AI 生成中（消息气泡内动画点 + "Generating..."）、图片加载（灰色占位 + spinner）、字体加载（底部 Toast）、同步中（标题栏旁小转圈）

### 18.2 空状态

空白画布（中央 "Start by drawing a frame" + 快捷键提示）、空 Layers、搜索无结果、空组件库、空 AI 对话（欢迎语 + 建议问题卡片）

### 18.3 错误 / 提示

- Toast 通知（右上角）：保存成功 ✓、已复制到剪贴板、组件已创建、网络已断开/已恢复、快捷键冲突
- 错误弹框：文件损坏 / 无法打开、版本不兼容、AI 服务不可用（带 Retry）

### 18.4 内置浏览器

pen.dev 有一个内置浏览器（Chrome extension 联动）：地址栏、返回/前进/刷新、「Import page to canvas」按钮、「Import selection」按钮、设备模拟（移动端尺寸切换）

---

## 十九、右键菜单汇总（按场景）

| 场景     | 主要菜单项                                                                            |
| -------- | ------------------------------------------------------------------------------------- |
| 画布空白 | Select all / Paste / Paste to replace / Grid options / Rulers / Smart guides / Import |
| 形状     | 标准编辑 + 排列 + 组合 + 组件 + 复制为 PNG/HTML + AI 修改                             |
| 文字     | 字体 / 字号 / 粗体斜体 / 对齐 / 变量绑定                                              |
| 图片     | 裁剪 / 滤镜 / 替换 / 追踪轮廓转矢量                                                   |
| 图层条目 | 重命名 / 复制 / 删除 / 锁定 / 隐藏 / 排序 / 转组件                                    |
| 组件实例 | Detach / Go to master / Reset overrides / Replace / 变体切换                          |
| Frame    | Flex 布局 / 取消 Frame / 转组件 / 导出                                                |

---

## 二十、深色主题

所有界面均提供 Dark mode：

- 面板背景：`#1E1E24` / `#2A2A33`
- 画布背景：`#141418`
- 文字：`#E4E4E7` / `#9CA3AF`
- 选中高亮：`#7C3AED`（紫色系，pen.dev 品牌色）
- 分割线：`#2F2F3A`
- 输入框：`#26262E`

---

## 二十一、界面数量统计

| 类别                                       | 数量                |
| ------------------------------------------ | ------------------- |
| 主菜单栏（7 个）                           | 7                   |
| 工具栏（1 主 + 上下文）                    | 2                   |
| 左侧面板（Layers / Assets 含 4 Tab）       | 2 面板 / 6 Tab      |
| 右侧属性面板（Design + Dev 双视图）        | 2 Tab               |
| 画布 + 选择 / 编辑模式                     | 多种状态            |
| AI Chat 面板（含 Context / Skills 子面板） | 1 主面板 + 3 子面板 |
| Variables 面板                             | 1 + 编辑器弹框      |
| Components + Slots                         | 2 个核心界面        |
| Code on Canvas 代码块 + API 面板           | 2                   |
| Design Libraries 面板                      | 1 + 发布弹框        |
| Settings（7 个 Tab）                       | 7                   |
| Dashboard（4 个分类视图）                  | 1 个窗口 + 多视图   |
| 弹框 / 对话框                              | 20+                 |
| 颜色选择器（复合弹框）                     | 1                   |
| 下拉面板 / Popover                         | 8+                  |
| 右键菜单（7 个场景）                       | 7                   |
| 路径编辑模式                               | 1                   |
| 原型预览模式                               | 1                   |
| 着色器编辑器                               | 1                   |
| 状态类界面（空/加载/错误/Toast）           | 15+                 |
| 深色主题                                   | 1 套                |

**总计**：约 **70+ 个独立界面/面板/弹框**，覆盖 pen.dev 桌面端全部核心场景。

---

## 二十二、AI 绘图提示词模板（直接可用）

> 丢给 AI 画图时，直接复制粘贴，修改括号里的内容。

**主界面全景图**：

```
请绘制一张 pen.dev 原型设计工具的桌面端主界面全景图（1920x1080，深色主题，紫色品牌色）。

画面组成：
- 顶部：深色标题栏（文件名 + 缩放 + 分享按钮）+ 白色主工具栏（选择、矩形、椭圆、Frame、文字、便签、钢笔、对齐工具）
- 左侧：Layers 图层面板（图层树，含 Frame、Group、形状、文字等图层，带眼睛图标）+ Assets 面板 Tab
- 中间：大片深色画布，画布上有一个手机移动端 Frame，包含顶部导航、Banner 图、列表卡片、底部 Tab 栏
- 右侧：Properties 属性面板，显示 Frame 选中状态下的 Flex 布局、填充、描边、阴影配置
- 右下角：悬浮的 AI Chat 面板（对话气泡 + 输入框 + 发送按钮，紫色主色）
- 底部：状态栏（缩放百分比、坐标、像素网格开关）

风格：现代、极简、专业、深色主题，紫色（#7C3AED）为品牌强调色，类 Figma 但更有 AI 未来感。
输出：高清 PNG，横向，无多余装饰。
```

**单个面板放大图（以 AI Chat 为例）**：

```
请绘制 pen.dev 的 AI Chat 面板（400x600，深色主题）。
顶部是两个 Tab + New agent 按钮，中间是对话区（一条 AI 消息带代码块和「Apply / Reject」操作条，一条用户消息），底部是多行输入框 + 📎上下文按钮 + 🔧Skills按钮 + 模型选择下拉 + 发送按钮。
风格：pen.dev 紫色品牌色，现代简洁，界面元素清晰。
```

---

## 二十三、选中不同对象时的属性面板字段对照表

> 核心使用场景：选中某个元素 → 右侧 Properties 面板动态显示对应字段。下面按对象类型完整列出。

### 23.1 通用字段（所有对象都显示，位于面板顶部）

| 区域        | 字段            | 控件类型            | 说明                                                                                                                                                                          |
| ----------- | --------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 基本信息    | 图层名称        | 文本输入框          | 可编辑，默认如 "Rectangle 1"                                                                                                                                                  |
| 位置 & 尺寸 | X               | 数字输入 + 上下微调 | 左边界坐标                                                                                                                                                                    |
|             | Y               | 数字输入 + 上下微调 | 上边界坐标                                                                                                                                                                    |
|             | W               | 数字输入 + 约束锁   | 宽度                                                                                                                                                                          |
|             | H               | 数字输入 + 约束锁   | 高度                                                                                                                                                                          |
|             | 约束比例        | 🔗 图标按钮         | 锁定后宽高比固定                                                                                                                                                              |
| 变换        | 旋转角度        | 数字 + 圆形旋钮     | 单位：度                                                                                                                                                                      |
|             | Flip Horizontal | 图标按钮            | 水平翻转                                                                                                                                                                      |
|             | Flip Vertical   | 图标按钮            | 垂直翻转                                                                                                                                                                      |
| 透明度      | Opacity         | 滑块 + 百分比数字   | 0% – 100%                                                                                                                                                                     |
| 混合模式    | Blend Mode      | 下拉选择            | Normal / Multiply / Screen / Overlay / Darken / Lighten / Color Dodge / Color Burn / Hard Light / Soft Light / Difference / Exclusion / Hue / Saturation / Color / Luminosity |
| 状态        | 可见性          | 👁 眼睛图标          | 显示/隐藏                                                                                                                                                                     |
|             | 锁定            | 🔒 锁图标           | 锁定/解锁                                                                                                                                                                     |
|             | 组件            | Component 跳转按钮  | 组件实例时显示                                                                                                                                                                |

---

### 23.2 选中 Frame（画框）时

Frame 是 pen.dev 最复杂的对象，属性面板字段最多。

**Design Tab**

#### 1. Layout（布局）

| 字段                 | 控件类型            | 可选值 / 说明                                                                         |
| -------------------- | ------------------- | ------------------------------------------------------------------------------------- |
| Layout mode          | 分段控件            | None / Row / Column                                                                   |
| Direction            | 下拉                | Row / Row reverse / Column / Column reverse                                           |
| Wrap                 | 分段控件            | No wrap / Wrap / Wrap reverse                                                         |
| Justify content      | 9 宫格图标 + 下拉   | Flex start / Center / Flex end / Space between / Space around / Space evenly          |
| Align items          | 分段图标 + 下拉     | Flex start / Center / Flex end / Stretch / Baseline                                   |
| Align content        | 分段图标 + 下拉     | Flex start / Center / Flex end / Space between / Space around / Stretch（多行时生效） |
| Gap                  | 数字输入 + 单位     | 行/列间距，默认 px                                                                    |
| Column gap           | 数字输入            | 列间距（独立模式）                                                                    |
| Row gap              | 数字输入            | 行间距（独立模式）                                                                    |
| Padding（4 字段）    | 数字输入 + 链接锁定 | Padding top / right / bottom / left                                                   |
| Auto layout children | 开关                | 子元素自动适应容器                                                                    |

#### 2. Size（尺寸）

| 字段       | 控件类型        | 可选值 / 说明                         |
| ---------- | --------------- | ------------------------------------- |
| Width      | 数字 + 尺寸模式 | Fixed / Hug contents / Fill container |
| Height     | 数字 + 尺寸模式 | Fixed / Hug contents / Fill container |
| Min width  | 数字            | 最小宽度                              |
| Min height | 数字            | 最小高度                              |
| Max width  | 数字            | 最大宽度                              |
| Max height | 数字            | 最大高度                              |

#### 3. Fill（填充 / 背景）

| 字段          | 控件类型            | 可选值 / 说明                                            |
| ------------- | ------------------- | -------------------------------------------------------- |
| Fill type     | 图标分段            | None / Solid / Linear gradient / Radial gradient / Image |
| Color         | 颜色选择器          | 支持变量绑定（见 13.6）                                  |
| Gradient 色条 | 色标编辑器          | 可增删色标、调整位置                                     |
| Angle         | 数字输入 + 圆形旋钮 | 渐变角度（渐变模式下）                                   |
| Image         | 缩略图 + 替换按钮   | 图片填充模式下                                           |
| Image fit     | 下拉                | Fill / Fit / Stretch / Tile / Original size              |
| Opacity       | 滑块 + 百分比       | 填充不透明度                                             |
| 添加 Fill 层  | + 按钮              | 可叠加多层填充                                           |

#### 4. Stroke（描边）

| 字段           | 控件类型   | 可选值 / 说明                    |
| -------------- | ---------- | -------------------------------- |
| Stroke color   | 颜色选择器 | 支持变量                         |
| Stroke width   | 数字输入   | 描边粗细                         |
| Stroke style   | 下拉       | Solid / Dashed / Dotted / Custom |
| Dash pattern   | 多数字输入 | 自定义虚线间隔                   |
| Position       | 分段       | Inside / Center / Outside        |
| Cap            | 图标分段   | Flat / Round / Square            |
| Join           | 图标分段   | Miter / Round / Bevel            |
| Miter limit    | 数字       | 斜接限制                         |
| 添加 Stroke 层 | + 按钮     | 可叠加多层描边                   |

#### 5. Corner Radius（圆角）

| 字段     | 控件类型         | 说明                                              |
| -------- | ---------------- | ------------------------------------------------- |
| 统一圆角 | 数字输入 + 🔗 锁 | 四角统一                                          |
| 独立四角 | 4 个数字输入     | Top-left / Top-right / Bottom-right / Bottom-left |
| 平滑圆角 | 开关             | Squircle / 平滑处理                               |

#### 6. Effects（特效）

| 效果            | 字段                                         | 控件类型             |
| --------------- | -------------------------------------------- | -------------------- |
| Drop shadow     | X / Y / Blur / Spread / Color / Opacity      | 数字 + 颜色          |
| Inner shadow    | X / Y / Blur / Spread / Color / Opacity      | 数字 + 颜色          |
| Outer glow      | Blur / Spread / Color / Opacity              | 数字 + 颜色          |
| Inner glow      | Blur / Spread / Color / Opacity              | 数字 + 颜色          |
| Layer blur      | Blur amount                                  | 滑块 + 数字          |
| Background blur | Blur amount                                  | 滑块 + 数字          |
| 3D transform    | Perspective / Rotate X / Rotate Y / Rotate Z | 数字 + 滑块          |
| Custom shader   | Shader 代码编辑器                            | GLSL 编辑 + Uniforms |

每个效果都有：开关 / 排序拖拽 / 删除按钮 / 复制按钮

#### 7. Overflow（溢出）

| 字段         | 控件类型 | 可选值                           |
| ------------ | -------- | -------------------------------- |
| Overflow     | 下拉     | Visible / Hidden / Scroll / Auto |
| Clip content | 开关     | 裁剪超出内容                     |

#### 8. Advanced（高级）

| 字段           | 控件类型 | 说明                 |
| -------------- | -------- | -------------------- |
| Border radius  | 快捷入口 | 同 Corner Radius     |
| Blur           | 快捷入口 | 同 Effects           |
| Opacity        | 快捷入口 | 同通用字段           |
| Pointer events | 开关     | 原型模式下是否可点击 |
| Tooltip        | 文本输入 | 悬停提示文字         |

**Dev Tab**（代码视图）

- 框架切换：React / Vue / Svelte / Plain HTML / Angular
- 样式方案：CSS / Tailwind CSS / Styled-components / Emotion
- 类名前缀输入框
- 代码展示区（语法高亮 + 行号 + 一键复制）
- 响应变量引用（如果使用了 Design Tokens）

---

### 23.3 选中 Rectangle（矩形）时

| 分组          | 字段                                                                      | 控件类型                  |
| ------------- | ------------------------------------------------------------------------- | ------------------------- |
| 通用          | 名称 / X / Y / W / H / 旋转 / 翻转 / Opacity / Blend mode / 可见性 / 锁定 | 同 23.1                   |
| Fill          | 填充类型 + 颜色/渐变/图片 + 透明度 + 多层填充                             | 同 Frame 的 Fill          |
| Stroke        | 颜色 + 粗细 + 样式 + 位置 + 端点 + 拐角 + 多层描边                        | 同 Frame 的 Stroke        |
| Corner radius | 统一圆角 / 四角独立 / 平滑圆角                                            | 同 Frame 的 Corner Radius |
| Effects       | Drop shadow / Inner shadow / Blur / Glow / 3D / Custom shader             | 同 Frame 的 Effects       |
| Advanced      | Opacity / Blend mode / Pointer events                                     | 同 Frame 的 Advanced      |

---

### 23.4 选中 Ellipse（椭圆 / 圆形）时

| 分组        | 字段                    | 差异点                         |
| ----------- | ----------------------- | ------------------------------ |
| 通用        | 同矩形                  | —                              |
| Fill        | 同矩形                  | —                              |
| Stroke      | 同矩形                  | —                              |
| Arc（弧形） | Start angle / End angle | 数字 + 旋钮，圆形变成环形/扇形 |
|             | Inner radius            | 数字，环形内径                 |
|             | Pie / Arc / Ring        | 分段切换                       |
| Effects     | 同矩形                  | —                              |

---

### 23.5 选中 Line / Arrow（直线 / 箭头）时

| 分组    | 字段                                   | 控件类型 / 可选值                                                  |
| ------- | -------------------------------------- | ------------------------------------------------------------------ |
| 通用    | 名称 / X1 / Y1 / X2 / Y2 / 长度 / 角度 | 数字输入                                                           |
| Stroke  | 颜色 / 粗细 / 样式                     | 同矩形                                                             |
| Caps    | Start cap / End cap                    | 下拉：None / Arrow / Triangle / Circle / Square / Diamond / Custom |
|         | Arrow size                             | 数字输入                                                           |
|         | Line cap                               | 下拉：Flat / Round / Square                                        |
| Curve   | Bend                                   | 数字 + 滑块，曲线弯曲度                                            |
|         | Curve type                             | 下拉：Straight / Bezier / Step / Step before / Step after          |
| Effects | Shadow / Glow                          | 同矩形                                                             |

---

### 23.6 选中 Text（文字）时

| 分组     | 字段                                                             | 控件类型 / 可选值                                            |
| -------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| 通用     | 名称 / X / Y / W / H / 旋转 / 翻转 / Opacity / Blend mode / 锁定 | 同 23.1                                                      |
| 字体     | Font family                                                      | 下拉 + 搜索 + 预览列表                                       |
|          | Font weight                                                      | 下拉（100–900）                                              |
|          | Font size                                                        | 数字输入 + 步进                                              |
|          | Line height                                                      | 数字 + 单位切换（px / 倍数）                                 |
|          | Letter spacing                                                   | 数字 + 单位（px / em）                                       |
|          | Paragraph spacing                                                | 数字                                                         |
| 样式     | Fill / Stroke                                                    | 颜色 + 描边粗细                                              |
|          | Text decoration                                                  | 分段：None / Underline / Strikethrough / Overline            |
|          | Text transform                                                   | 下拉：None / Uppercase / Lowercase / Capitalize / Small caps |
| 对齐     | Horizontal align                                                 | 分段：左 / 中 / 右 / 两端                                    |
|          | Vertical align                                                   | 分段：Top / Middle / Bottom                                  |
|          | Direction                                                        | LTR / RTL                                                    |
| 尺寸模式 | Sizing                                                           | 分段：Auto width / Auto height / Fixed size                  |
| 溢出     | Overflow                                                         | 下拉：Visible / Clip / Ellipsis                              |
|          | Lines count                                                      | 数字（多行省略号时）                                         |
| 变量     | Bind to variable                                                 | 按钮（字体/颜色/字号绑定变量）                               |
| 链接     | Link URL                                                         | 文本输入（原型模式可点击）                                   |
| Effects  | Shadow / Blur                                                    | 同矩形                                                       |

---

### 23.7 选中 Image（图片）时

| 分组    | 字段                                                             | 控件类型 / 可选值                                 |
| ------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| 通用    | 名称 / X / Y / W / H / 旋转 / 翻转 / Opacity / Blend mode / 锁定 | 同 23.1                                           |
| 内容    | Replace image                                                    | 按钮 + 缩略图                                     |
|         | Fit mode                                                         | 下拉：Fill / Fit / Stretch / Tile / Original size |
|         | Crop                                                             | 按钮（进入裁剪模式）                              |
|         | Image size                                                       | 显示原始尺寸（只读）                              |
| 滤镜    | Brightness                                                       | 滑块（0% – 200%）                                 |
|         | Contrast                                                         | 滑块（-100% – +100%）                             |
|         | Saturation                                                       | 滑块（-100% – +100%）                             |
|         | Hue                                                              | 滑块（-180° – +180°）                             |
|         | Blur                                                             | 滑块（0 – 50px）                                  |
|         | Sepia                                                            | 滑块（0% – 100%）                                 |
|         | Grayscale                                                        | 滑块（0% – 100%）                                 |
|         | Invert                                                           | 开关                                              |
|         | Reset filters                                                    | 按钮                                              |
| 边框    | Corner radius / Stroke                                           | 同矩形                                            |
| Effects | Drop shadow / Inner shadow / Blur / 3D                           | 同矩形                                            |
| 高级    | Alt text                                                         | 文本输入（无障碍）                                |
|         | Lazy load                                                        | 开关                                              |
|         | Object position                                                  | 9 宫格 + 百分比微调                               |

---

### 23.8 选中 Sticky Note（便签）时

| 分组 | 字段                                         | 控件类型 / 可选值                       |
| ---- | -------------------------------------------- | --------------------------------------- |
| 通用 | 名称 / X / Y / W / H / 旋转 / Opacity / 锁定 | 同 23.1                                 |
| 内容 | Text content                                 | 多行文本输入                            |
| 样式 | Color preset                                 | 颜色色板（黄 / 粉 / 蓝 / 绿 / 紫 / 灰） |
|      | Background color                             | 颜色选择器                              |
|      | Text color                                   | 颜色选择器                              |
|      | Font size                                    | 数字                                    |
| 作者 | Author                                       | 文本输入                                |
|      | Avatar                                       | 图片上传                                |
| 高级 | Date / Time                                  | 显示创建时间（只读）                    |
|      | Linked to layer                              | 下拉选择关联图层                        |

---

### 23.9 选中 Component Instance（组件实例）时

| 分组      | 字段                            | 说明                                                   |
| --------- | ------------------------------- | ------------------------------------------------------ |
| 组件信息  | Component name                  | 显示 + 「Edit Master」按钮                             |
|           | Variant                         | 下拉切换变体（Default / Hover / Disabled / Active...） |
|           | Detach                          | 按钮，脱离组件变普通元素                               |
| Overrides | 属性覆盖列表                    | 列出所有被修改过的属性 + 「Reset」按钮                 |
|           | Reset all overrides             | 按钮                                                   |
| 替换      | Replace component               | 下拉，用另一个组件替换                                 |
| Slots     | Slot 列表                       | 每个 Slot：名称 + 填充状态 + 清除按钮 + 选择填充内容   |
| 通用属性  | 位置 / 尺寸 / 透明度 / 混合模式 | 同普通对象（整体控制实例）                             |
| Dev       | 代码导出                        | 组件名 + Props 面板                                    |

---

### 23.10 选中 Group（组）时

| 分组    | 字段                                                      | 说明                     |
| ------- | --------------------------------------------------------- | ------------------------ |
| 通用    | 名称 / X / Y / W / H / 旋转 / Opacity / Blend mode / 锁定 | 同 23.1                  |
| 组信息  | Member count                                              | 显示组内对象数量（只读） |
|         | Ungroup                                                   | 按钮                     |
| 操作    | Enter group                                               | 按钮（进入组内编辑）     |
| Effects | Drop shadow / Blur                                        | 组整体效果               |
| Mask    | Use as mask                                               | 开关，用组作为裁剪蒙版   |

---

### 23.11 选中 Path（路径 / 钢笔形状）时

| 分组     | 字段                                         | 控件类型 / 可选值                       |
| -------- | -------------------------------------------- | --------------------------------------- |
| 通用     | 名称 / X / Y / W / H / 旋转 / Opacity / 锁定 | 同 23.1                                 |
| Fill     | 类型 + 颜色 + 规则                           | 同矩形 + Fill rule（Nonzero / Evenodd） |
| Stroke   | 颜色 + 粗细 + 样式 + 端点 + 拐角             | 同矩形                                  |
| 路径编辑 | Enter path edit                              | 按钮（进入点编辑模式）                  |
|          | Points count                                 | 显示锚点数量（只读）                    |
|          | Flatten path                                 | 按钮（转直线段）                        |
|          | Simplify                                     | 滑块 + 按钮（简化路径）                 |
|          | Offset path                                  | 数字输入（路径偏移）                    |
| 布尔操作 | Union / Subtract / Intersect / Exclude       | 图标按钮（多路径选中时）                |
| Effects  | 同矩形                                       | —                                       |

---

### 23.12 选中 Code Block（代码块）时

Code on Canvas 特色对象。

| 分组 | 字段                        | 控件类型 / 可选值                                                              |
| ---- | --------------------------- | ------------------------------------------------------------------------------ |
| 通用 | 名称 / X / Y / W / H / 锁定 | 同 23.1                                                                        |
| 代码 | Language                    | 下拉：HTML / CSS / JavaScript / TypeScript / JSX / TSX / Vue / Markdown / GLSL |
|      | Theme                       | 下拉：Light / Dark / 跟随系统                                                  |
| 显示 | Font size                   | 数字                                                                           |
|      | Line numbers                | 开关                                                                           |
|      | Word wrap                   | 开关                                                                           |
|      | Minimap                     | 开关                                                                           |
| 运行 | Auto run                    | 开关                                                                           |
|      | Run button                  | 按钮                                                                           |
|      | Output panel                | 开关（显示运行结果）                                                           |
| 依赖 | Dependencies                | 包搜索 + 已安装列表                                                            |
| 绑定 | Bind to canvas              | 选择器（画布元素 ID）                                                          |
|      | API access                  | 开关（允许代码操作画布）                                                       |

---

### 23.13 无选中 —— Document / Canvas 属性

未选中任何对象时，属性面板显示文档级设置。

| 分组     | 字段                  | 控件类型 / 可选值             |
| -------- | --------------------- | ----------------------------- |
| Document | File name             | 文本输入                      |
|          | File path             | 只读显示                      |
|          | Last modified         | 只读显示                      |
|          | File size             | 只读显示                      |
| Canvas   | Background color      | 颜色选择器                    |
|          | Show grid             | 开关                          |
|          | Grid size             | 数字（像素）                  |
|          | Grid color            | 颜色选择器                    |
|          | Grid type             | 下拉：Lines / Dots            |
| Ruler    | Ruler units           | 下拉：px / pt / dp / rem / em |
|          | Ruler visibility      | 开关                          |
| 吸附     | Snap to grid          | 开关                          |
|          | Snap to objects       | 开关                          |
|          | Snap threshold        | 数字（像素，吸附灵敏度）      |
|          | Smart guides          | 开关                          |
| 像素     | Pixel grid            | 开关                          |
|          | Snap to pixel grid    | 开关                          |
| 导出     | Default export format | 下拉：PNG / SVG / PDF         |
|          | Export scale          | 下拉：1x / 2x / 3x            |

---

### 23.14 多选对象时

选中多个对象时，属性面板显示「公共字段」：

| 字段             | 说明                                                          |
| ---------------- | ------------------------------------------------------------- |
| X / Y / W / H    | 整体选区的包围盒                                              |
| Opacity          | 所有对象的整体透明度（混合值显示为 —，修改则批量应用）        |
| Align            | 9 宫格对齐按钮（左/中/右 + 上/中/下）                         |
| Distribute       | 水平分布 / 垂直分布 按钮                                      |
| Match size       | 等宽 / 等高 / 等大小 按钮                                     |
| Group / Ungroup  | 组合 / 解组                                                   |
| Frame selection  | 用 Frame 包裹                                                 |
| Create component | 转组件                                                        |
| Arrangement      | Bring forward / Send backward / Bring to front / Send to back |
| Layer count      | 显示选中对象数量                                              |
| Batch actions    | 批量改填充色 / 批量改描边 / 批量改字体                        |

如果选中的对象类型相同（如都是矩形），则还会显示它们的公共属性字段（填充、描边等），支持批量修改。

---

### 23.15 属性面板字段总数速查

| 对象类型           | 主要字段分组数                                                                 | 估计字段总数 |
| ------------------ | ------------------------------------------------------------------------------ | ------------ |
| Frame              | 8 组（Layout / Size / Fill / Stroke / Radius / Effects / Overflow / Advanced） | ~80 个       |
| Rectangle          | 5 组（Fill / Stroke / Radius / Effects / Advanced）                            | ~45 个       |
| Ellipse            | + Arc 组                                                                       | ~50 个       |
| Line / Arrow       | + Caps / Curve                                                                 | ~30 个       |
| Text               | 字体 / 样式 / 对齐 / 溢出 / 链接                                               | ~35 个       |
| Image              | 内容 / 滤镜 / 边框 / Effects                                                   | ~40 个       |
| Sticky Note        | 内容 / 样式 / 作者                                                             | ~20 个       |
| Component Instance | Overrides + Slots + Variants                                                   | ~30 个       |
| Group              | 基础 + Effects + Mask                                                          | ~20 个       |
| Path               | 路径编辑 + 布尔                                                                | ~35 个       |
| Code Block         | 代码 + 显示 + 运行 + 依赖                                                      | ~25 个       |
| 无选中（Document） | 画布 + 标尺 + 吸附 + 导出                                                      | ~20 个       |
| 多选               | 对齐 + 分布 + 批量操作                                                         | ~15 个       |

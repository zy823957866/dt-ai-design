# pen.dev（原 pencil.dev）工具栏 + 属性面板 · 源码级参考

> **数据来源**：直接解包 pen.dev 桌面版 `Pen.exe`（Electron `app.asar`）的编辑器主包
> `out/editor/assets/index.js`，提取其中的工具栏注册表、命令注册表、属性面板注册表与各控件默认值。
> 与 `pencil-desktop-interface.md`（基于官方文档 + 推断）互补：本文档为**源码实证**，用于指导 `dt-ai-design` 的对齐实现。
>
> 说明：pen.dev 是 minified 打包，变量名为混淆名（如 `Ln`=属性键枚举、`Sn`=效果类型枚举、`ct`=填充类型枚举）。下文保留关键混淆标识以便回溯。

---

## 一、面板运行机制（重要）

右侧属性面板**不是「一个工具对应一套属性」**，而是由 **当前选中元素类型 + 当前激活工具** 共同决定。

面板是可插拔组件，注册表结构为 `{ name, useAvailable(), Panel }`。渲染时按上下文选用不同集合（源码实测）：

| 集合常量 | 组成                                                                                                                                                               | 触发场景              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| `PUn`    | Header, Component, Slot, Context, Alignment, Position, Layout, Appearance, Fill, Stroke, Typography, Icon, Script, Browser, Effects, Theme, Metadata, Code, Export | 默认（选中普通元素）  |
| `RUn`    | Header, Component, Slot, Context, **Scale**                                                                                                                        | Scale 工具激活（`K`） |
| `NUn`    | Header, **Vector**, Fill, Stroke                                                                                                                                   | 路径编辑模式          |
| `IUn`    | Header, **ShaderEdit**                                                                                                                                             | Shader 编辑模式       |
| `MUn`    | Header                                                                                                                                                             | 特殊/空态             |

各面板 `useAvailable()` 显示条件：

| Section    | 显示条件（源码）                   | 含义                                      |
| ---------- | ---------------------------------- | ----------------------------------------- |
| Header     | 始终                               | 图层名 / 类型 / Present / Copy all styles |
| Component  | `Cv()===1`                         | 单选且为组件或实例                        |
| Slot       | 单选且为可作 slot 的 Frame         |                                           |
| Context    | 单选                               | 上下文信息                                |
| Alignment  | 非只读                             | 对齐（多选/容器）                         |
| Position   | 始终                               |                                           |
| Layout     | 始终                               |                                           |
| Appearance | 始终                               |                                           |
| Fill       | 有 `fills`                         |                                           |
| Stroke     | 有 `strokeFills`                   |                                           |
| Typography | 有 `fontFamily`                    | 文本                                      |
| Icon       | 有 `iconFontName`                  | 图标                                      |
| Script     | 有 `scriptUri`                     |                                           |
| Browser    | 有 `url`                           | 网页节点                                  |
| Effects    | 有 `effects`                       |                                           |
| Theme      | 文档存在 themes                    |                                           |
| Metadata   | 单选且有 metadata                  |                                           |
| Code       | 非浏览器上下文                     |                                           |
| Export     | 非浏览器上下文                     |                                           |
| Vector     | 路径编辑中（`qX() instanceof Qd`） |                                           |
| ShaderEdit | Shader 编辑中                      |                                           |
| Scale      | Scale 工具激活                     |                                           |

---

## 二、左侧工具栏（源码 `WZn` 分组定义）

工具栏分组（自上而下）：

| 分组                          | 工具              | 快捷键    | 备注                               |
| ----------------------------- | ----------------- | --------- | ---------------------------------- |
| 移动工具（Move Tools）        | Move（移动/选择） | `V`       | `readonly`                         |
| 移动工具                      | Scale（缩放）     | `K`       | 激活后右栏切换为 Scale 集合        |
| 基元（Primitives，带 Flyout） | Rectangle         | `R`       | 钉在主按钮（`actions:[0,1]`）      |
| 基元                          | Ellipse           | `O`       | 钉在主按钮                         |
| 基元                          | Polygon           | —         | Flyout 内                          |
| 基元                          | Icon              | —         | Flyout 内                          |
| 基元                          | Script            | —         | Flyout 内                          |
| —                             | Pen               | `P`       | 激活后弹出竖向子工具栏             |
| —                             | Text              | `T`       |                                    |
| —                             | Frame             | `F` / `A` | 双快捷键                           |
| —                             | Sticky Note       | `N`       |                                    |
| —                             | Browser           | —         | 仅桌面版（Electron）显示           |
| —                             | Hand              | `H`       | `readonly`                         |
| —                             | Comment           | `C`       | 需 `comments` 特性开关，`button:1` |

**Pen 子工具栏（`HZn`）**：Pen(`P`) / Select points(`V`) / Cut(`X`) / Done(`Enter`)。

**Zoom**：不是独立按钮，**长按 `Z`**；`Cmd/Ctrl+滚轮` 缩放，`空格+拖拽` 平移。

**快捷键分类（工具栏参考面板）**：

- Tools：Move `V` / Scale `K` / Hand `H` / Comment `C` / Zoom（长按 `Z`）
- Shapes：Frame `A`,`F` / Text `T` / Sticky note `N` / Rectangle `R` / Ellipse `O` / Pen `P`

---

## 三、右侧各 Section 详细控件

控件类型约定：**数值框**（可拖拽调节，`↑↓`=1，`Shift`=大步进，支持单位后缀）、**带字母数值框**(X/Y/W/H)、**下拉框**、**分段按钮**、**复选框**、**颜色选择器**、**变量绑定菜单**、**填充列表编辑器**。

### Position

| 控件              | 类型           | 说明 / 默认                                               |
| ----------------- | -------------- | --------------------------------------------------------- |
| X                 | 带字母数值框   | 相对父级左上角                                            |
| Y                 | 带字母数值框   |                                                           |
| Rotation          | 数值框 + `°`   | Shift 步进 15°                                            |
| 翻转/锁定         | 3 个图标按钮组 | 水平翻转 / 垂直翻转 / 等                                  |
| Absolute Position | 复选框         | 脱离 Flex（`layoutPosition: auto/absolute`，默认 `auto`） |

### Layout（有 Flex 时标题变为 "Flex Layout"）

| 控件                     | 类型                            | 选项 / 默认                                                                                       |
| ------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| 布局模式                 | 分段按钮（3）                   | Freeform(`none`) / Vertical / Horizontal（新建 Frame 为 Freeform）                                |
| Alignment（仅 Flex）     | 3×3 网格 + space-between/around | 默认 `start`/`start`                                                                              |
| Gap                      | 单选 + 数值框                   | 自定义（min 0，默认 0）/ Space Between / Space Around                                             |
| Padding                  | 数值框组                        | Dual（上下、左右）↔ Quad（上右下左）；按钮 Edit sides individually / Edit sides in pairs（min 0） |
| Dimensions W / H         | 带字母数值框                    | min 0                                                                                             |
| Fill Width / Fill Height | 复选框                          | `fill_container`                                                                                  |
| Hug Width / Hug Height   | 复选框                          | `fit_content`（仅 Flex 时）                                                                       |
| Resizing（仅文本）       | 分段按钮（3）                   | Auto width(`auto`) / Auto height(`fixed-width`) / Fixed size(`fixed-width-height`)，默认 `auto`   |

### Appearance

| 控件                   | 类型                                         | 选项 / 默认                                                                                                                                                                                                          |
| ---------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Opacity                | 数值框（0–100%）                             | 默认 **100%**（存储 0–1）                                                                                                                                                                                            |
| Corner radius          | 数值框（min 0）+ "Edit corners individually" | 默认 **0**；展开后 TL/TR/BR/BL                                                                                                                                                                                       |
| Ellipse 组（仅椭圆）   | 3 数值框                                     | Start angle `°`（默认 0）/ Sweep `°`（默认 **360**，−360~360）/ Inner radius `%`（默认 0，0–100）                                                                                                                    |
| Polygon 组（仅多边形） | 数值框                                       | Count，默认 **3**，min 3，max 60                                                                                                                                                                                     |
| Clip Content           | 复选框                                       | 默认 **关闭**                                                                                                                                                                                                        |
| Blend mode             | 下拉框（18 项）                              | Normal(**默认**) / Darken / Multiply / Color Burn / Linear Burn / Lighten / Screen / Color Dodge / Linear Dodge / Overlay / Soft Light / Hard Light / Difference / Exclusion / Hue / Saturation / Color / Luminosity |

> 注：源码中 Blend mode 下拉是列表，Appearance 面板主体是 Opacity + Corner radius + Ellipse/Polygon + Clip Content。

### Fill

| 控件           | 类型           | 说明                                                                   |
| -------------- | -------------- | ---------------------------------------------------------------------- |
| Add fill       | `+` 按钮       | 新增填充                                                               |
| 填充项         | 填充列表编辑器 | 多条、拖拽排序、👁 隐藏、`−` 删除                                       |
| 类型           | 分段/下拉      | **Color** / **Gradient** / **Image** / **Shader**                      |
| Color          | 颜色选择器     | 格式下拉：**RGBA(默认)** / HEX / CSS / HSL；吸管取色；支持 Alpha       |
| Gradient 类型  | 下拉           | **Linear** / **Radial** / **Angular** / **Mesh**（Mesh 有 Grid 行列）  |
| Gradient Stops | 色标列表       | Add/Remove color stop，可拖位置                                        |
| Image 模式     | 下拉           | **Fill(cover，默认)** / **Fit(contain)** / **Stretch**                 |
| Image 操作     | 按钮           | Apply shader / Remove background / Vectorize image / Import image file |
| Shader         | 输入框         | "Shader path or URL" + Import shader file + Shader Gallery…            |
| Blend mode     | 下拉框         | 每条填充独立，默认 Normal                                              |

> 填充透明度只能通过 hex alpha 通道设置。

### Stroke

| 控件                    | 类型            | 选项 / 默认                          |
| ----------------------- | --------------- | ------------------------------------ |
| Add stroke              | `+` 按钮        | 首条色 `#000000ff`，后续 `#00000033` |
| 描边填充                | 同 Fill 编辑器  | 复用 Fill 列表编辑器（可多色）       |
| Position                | 下拉框          | **Center(默认)** / Inside / Outside  |
| Weight W                | 数值框（min 0） | 默认 1                               |
| Edit sides individually | 按钮            | 展开 4 边宽度                        |
| Join                    | 下拉框          | **Miter(默认)** / Round / Bevel      |
| Cap                     | 下拉框          | Butt(默认) / Square / Round          |

### Typography（文本）

| 控件            | 类型            | 选项 / 默认                                                                                        |
| --------------- | --------------- | -------------------------------------------------------------------------------------------------- |
| Font family     | 搜索下拉        | 默认 **Inter**；Custom Fonts 支持 .ttf/.otf/.woff/.woff2                                           |
| Weight/Style    | 下拉框          | Thin, Extra Light, Light, Regular, Medium, Semi Bold, Bold, Extra Bold, Black, Heavy + Italic 变体 |
| Size            | 数值框（min 0） | 默认 16                                                                                            |
| Line height     | 数值框 + `%`    | 默认 **Auto**（存 0），显示如 150%                                                                 |
| Letter spacing  | 数值框 + `px`   | 默认 0                                                                                             |
| Horizontal 对齐 | 分段按钮（4）   | Align Left(**默认**) / Center / Right / Justify                                                    |
| Vertical 对齐   | 分段按钮（3）   | Align Top(**默认**) / Middle / Bottom                                                              |

### Icon

| 控件     | 类型        | 选项 / 默认                                                                              |
| -------- | ----------- | ---------------------------------------------------------------------------------------- |
| 图标库   | 下拉框      | lucide / feather / phosphor / Material Symbols Outlined / Rounded / Sharp（默认 lucide） |
| 图标选择 | 弹窗 + 搜索 | "Search icons…" 网格                                                                     |
| Weight   | 数值框      | 100–700（部分库支持）                                                                    |

### Script

| 控件               | 类型   | 说明                                 |
| ------------------ | ------ | ------------------------------------ |
| Path               | 输入框 | "path to .js file"                   |
| Import script file | 按钮   |                                      |
| Convert to layers  | 按钮   |                                      |
| Script Gallery…    | 按钮   | 官方脚本（Clock/Radar/Gauge/Chart…） |

### Browser

| 控件   | 类型   | 默认                   |
| ------ | ------ | ---------------------- |
| URL    | 输入框 | "Enter a URL"          |
| Device | 下拉框 | 预设机型（缺省响应式） |
| Zoom   | 数值框 | 默认 1                 |

### Effects

"Add effect" 菜单项顺序（源码 `Mlt`）：**Drop Shadow / Inner Shadow / Layer Blur / Background Blur / Shader**。

| 控件                         | 类型                    | 默认 / 限制                                                                                                       |
| ---------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Remove effect / Add effect   | 按钮                    |                                                                                                                   |
| Shadow                       | 复选框 + 子项           | color 默认 `#000000`（拖影 `#00000040`）、blur 默认 0、blendMode 默认 normal、offset x/y；shadowType: outer/inner |
| Layer Blur / Background Blur | 数值框 radius           | **各自只能加一条**（重复项置灰，源码 `Plt`）                                                                      |
| Shader                       | 文件路径/URL + uniforms | GLSL WebGL1                                                                                                       |

### Theme

| 控件                     | 类型 | 说明                         |
| ------------------------ | ---- | ---------------------------- |
| Add theme / Remove theme | 按钮 | 轴→值（如 mode: light/dark） |
| 混合态                   | 只读 | "Mixed themes"               |

### Alignment

| 控件           | 类型       | 内容               |
| -------------- | ---------- | ------------------ |
| 第一行（水平） | 3 图标按钮 | 左 / 水平居中 / 右 |
| 第二行（垂直） | 3 图标按钮 | 顶 / 垂直居中 / 底 |

### Metadata

| 控件              | 类型   | 说明        |
| ----------------- | ------ | ----------- |
| Source            | 输入框 | `sourceUrl` |
| Tag               | 输入框 | `htmlId`    |
| Link              | 输入框 | 超链接      |
| Absolute Position | 复选框 |             |

### Code（Code export settings）

| 控件                              | 类型   | 默认                                             |
| --------------------------------- | ------ | ------------------------------------------------ |
| Format                            | 下拉框 | "Select code export format"                      |
| Assets                            | 下拉框 | "Select asset export mode"                       |
| Include HTML scaffold             | 复选框 | 开                                               |
| Center HTML body contents         | 复选框 |                                                  |
| Ask user where to export the file | 复选框 |                                                  |
| Open in Browser after Export      | 复选框 |                                                  |
| Include layer names               | 复选框 | 开                                               |
| Include layer IDs                 | 复选框 | 关                                               |
| 操作                              | 按钮   | Copy HTML / Export HTML / Import Web via Browser |

### Export

| 控件    | 类型   | 选项 / 默认                                     |
| ------- | ------ | ----------------------------------------------- |
| Type    | 下拉框 | **PNG / JPEG / WEBP / PDF**                     |
| Scale   | 下拉框 | 1x / **2x(默认)** / 3x                          |
| Quality | 下拉框 | **High(默认) / Low / Lossless**（仅 JPEG/WEBP） |
| Export  | 按钮   | "Export layer"                                  |

### Scale（Scale 工具专属）

| 控件     | 类型         | 说明                                                |
| -------- | ------------ | --------------------------------------------------- |
| W / H    | 数值框       | 等比联动                                            |
| 缩放因子 | 数值框       | 支持 `2` 或 `200%`                                  |
| Anchor   | 3×3 锚点网格 | 缩放基准点                                          |
| Presets  | 下拉框       | 0.25x / 0.5x / 0.75x / 1x / 2x / 3x / 4x / 5x / 10x |
| Done     | 按钮         | `Enter`                                             |

### Vector（路径）

| 控件    | 类型   | 选项 / 默认                  |
| ------- | ------ | ---------------------------- |
| Viewbox | 复选框 | "Fixed"                      |
| Winding | 下拉框 | **Nonzero(默认)** / Even-odd |

---

## 四、工具 / 元素类型 → 面板组合 映射

| 工具或选中对象      | 右侧 Section 组合（渲染顺序）                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| Move（单选矩形）    | Header, Alignment, Position, Layout, Appearance(圆角), Fill, Stroke, Effects, Export, Code, Metadata |
| Move（单选椭圆）    | 同上，但 Appearance 显示 **Ellipse 组**（Start/Sweep/Inner radius），无圆角                          |
| Polygon             | 同上，Appearance 显示 **Polygon Count**                                                              |
| Move（单选 Frame）  | 同上 + Layout Flex 相关 + Appearance 含 **Clip Content**                                             |
| Text `T`            | Header, Position, Layout(含 Resizing), Appearance, Fill, Stroke, **Typography**, Effects, Export…    |
| Icon                | Header, Position, Layout, Appearance, Fill, **Icon**, Effects…                                       |
| Script              | 同矩形 + **Script**                                                                                  |
| Pen `P`（路径编辑） | Header, **Vector**, Fill, Stroke                                                                     |
| Scale `K`           | Header, Component, Slot, Context, **Scale**                                                          |
| Browser 节点        | Header, Position, Layout, **Browser**, …（无 Code/Export）                                           |
| Sticky Note `N`     | Header, Position, Layout, Appearance, Fill/Typography 子集（固定配色）                               |
| Hand `H` / Zoom `Z` | 无属性                                                                                               |
| Comment `C`         | 评论线程 UI（非属性面板）                                                                            |

---

## 五、新建对象默认值（源码实测）

| 对象             | 默认属性                                                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rectangle        | `fill = #CCCCCC`                                                                                                                                                            |
| Ellipse          | `fill = #CCCCCC`                                                                                                                                                            |
| Polygon          | `fill = #CCCCCC`，`polygonCount = 3`                                                                                                                                        |
| Frame            | `fill = #FFFFFF`，`clip = true`，`layoutMode = None`，`horizontalSizing = Fixed`，`verticalSizing = Fixed`                                                                  |
| Text             | `fontSize = 16`，颜色**取点击处画布像素色**（取不到则 `#FFFFFF`）                                                                                                           |
| Sticky Note 配色 | 背景 `#FFF7E5`、标题条 `#FFF1D6`、描边 `#8B6311`、文字 `#664500`                                                                                                            |
| 通用             | opacity 1、cornerRadius 0、strokeWidth 1、strokeAlignment Center、lineJoin Miter、blendMode normal、shadow color `#000000`、image fill mode cover、color picker format RGBA |

---

## 六、与 `dt-ai-design` 现有 `design-schema` 的差异对照

| pen.dev 标准                                                         | `dt-ai-design` 现状                                                      | 差异                                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `fills[]` / `strokeFills` / `effects[]`                              | `fills[]` / `strokes[]` / `effects[]`                                    | 命名不同（`strokes` vs `strokeFills`），语义一致                              |
| 描边单条（多 fill）                                                  | `strokes[]` 多条，每条第 1 色                                            | 结构不同                                                                      |
| 布局 `none / vertical / horizontal`                                  | `FrameLayout.enabled` + `FlexDirection`(row/column/reverse) + wrap       | 模型不同：现在是 CSS-flex 风格（含 wrap/alignContent），pen.dev 是单轴无 wrap |
| 尺寸模式 `fit_content / fill_container`                              | `SizingMode: fixed / hugContents / fillContainer`                        | 基本一致                                                                      |
| 圆角 `cornerRadius`（支持四角）                                      | `cornerRadius: number`                                                   | 缺四角独立                                                                    |
| 效果类型：DropShadow/InnerShadow/LayerBlur/BackgroundBlur/**Shader** | DropShadow/InnerShadow/Blur/OuterGlow/InnerGlow/LayerBlur/BackgroundBlur | 多了 Glow，缺 Shader                                                          |
| 混合模式 18 项                                                       | 16 项（无 linearBurn/colorDodge 顺序差异等）                             | 基本一致                                                                      |
| 文本 `textGrowth`(auto/fixed-width/fixed-width-height)               | `TextSizing`(autoWidth/autoHeight/fixed)                                 | 语义等价，命名不同                                                            |
| 图片 fit：cover/contain/stretch                                      | fill/fit/stretch/tile/original                                           | 多了 tile/original                                                            |
| 元数据 `metadata`、Theme、Slot、Script、Browser 节点                 | 均无                                                                     | 缺失                                                                          |

---

## 七、`dt-ai-design` 当前实现盘点（对齐前）

- **工具栏**（`apps/desktop/src/components/editor/Toolbar.tsx`）：10 个按钮 `select / hand / zoom / rectangle / ellipse / triangle / frame / text / sticky / pen`。
  - 缺：Scale(`K`)、Comment(`C`)、Browser、Primitives Flyout（polygon/icon/script）、Pen 子工具栏。
  - 命名/图标需更新：`triangle` → `polygon`。
- **属性面板**（`PropertiesPanel.tsx`，462 行，单文件）：Design/Dev Tab、通用字段、填充/描边、文字、效果（阴影）、多选编辑、颜色选择器等；尚未拆分为 Section，也缺 Layout(Flex)、Icon、Export、Code、Metadata、Theme、Scale、Vector 等标准面板。
- **数据模型**（`packages/design-schema`）：已具备 layers / styles / flex / 文本 / 图片 / 组件实例等类型，比 UI 实现更完整。

---

_本文档由源码解包生成，用于指导 `dt-ai-design` 对齐 pen.dev 标准；实施范围与分期见 `doc/superpowers/specs/` 下的设计文档。_

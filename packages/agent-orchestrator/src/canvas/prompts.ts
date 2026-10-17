/** dt-ai-design 画布智能体提示词（AGENTS.md / schema.md / tools.md）。 */

export const buildAgentsMd = (): string =>
  `# dt-ai-design 画布设计智能体

你是内置在「深迪设计」画布中的 UI 设计智能体。你不能输出整份文档 JSON，
而是通过 \`execute\` 工具在画布上增量地、可回滚地创建与修改图层，并用
\`Get\` / \`Print\` 回读校验。

## 坐标系（非常重要）
- **所有坐标都是画布绝对坐标**（原点在画布左上角，x 向右、y 向下）。
- 子节点的 x/y **不会**叠加父节点的 x/y，也不是相对父节点——就是绝对坐标。
- 因此给出每个节点时，请按它在画布上的最终位置写 x/y。
- \`layout / padding / gap / sizingMode\` 目前**不会被渲染**，不要依赖它们来做布局；
  请显式给出每个节点的 x/y/width/height，并自己算好间距。
- 文本用 \`x/y\` 定位，绘制基线在 \`y + fontSize\`；水平居中用 \`textAlign:"center"\` 且
  \`x\` 指向文本框左侧、\`width\` 给足。

## 工作方式
- 每次调用 \`execute\` 写一小段 JavaScript（不写注释，尽量短）。
- 使用数组、for...of、对象展开、helper 生成重复结构。
- 每个新节点必须设置 name（人类可读）；回执返回 name→id 映射供后续引用。
- 跨 execute 持久化 id：直接赋值，不要用 const/let（如 heroId = Insert(...)）。
- 不要传 id，系统会生成唯一 id。
- 失败时不要重发整段；用返回的 editId + edits:[{find,replace}] 修补后重跑。
- 修改中的 frame 可先设 placeholder:true，完成后用 Update(id,{placeholder:false}) 清除。
- 画完立即用 \`Print(JSON.stringify(Get(id)))\` 或 \`Get\` 校验坐标与尺寸。

## 结构：只建必要的节点（严禁过度嵌套）
- **单个组件请求**（如「一个按钮」「一个卡片」）只创建**该组件本身**，不要套画板、
  不要套多余的居中容器。一个按钮 = 1 个 frame + 1 个 text。
- **整页请求**才创建画板 frame（桌面宽 1440 / 移动宽 375），页面里的区块按需再建 frame。
- frame 只在有真实结构/布局用途时使用；禁止 3 层以上无意义嵌套。
- 画布根节点放组件/容器/页面 frame；不要直接放裸 text（除非需求就是一段文字）。
- 画布为空时，从 (120,120) 附近开始放置内容，保证在可视区域内。

## 视觉质量（对齐 Pencil 品质）
- 尺寸：按钮高 40–48、圆角 8–12；间距用 8 的倍数（8/12/16/24）。
- 文本务必设置 \`fills\`（否则不可见）；按钮文字用白色 \`#FFFFFF\`。
- 主色可用 \`#EF4444\`（红）/\`#7C3AED\`（紫）等；注意与背景对比。
- 文字要用 \`width\` 框住并居中，避免溢出容器。
- 避免每个元素都套盒子；避免过度渐变/阴影/圆角。

## 验证清单（每次收尾自检）
- 组件尺寸合理、文字不溢出、在容器内居中对齐。
- 节点数量正确（不要多余容器层）。
- 删除空容器：无子节点且无填充的 frame/group 用 Delete 移除（系统也会兜底清理）。
- 与需求意图一致。

工具用法见 tools.md，数据结构见 schema.md。`;

export const buildSchemaMd = (): string =>
  `# .dt 文档结构（design-schema）

顶层对象 DesignDocument：
{ layers: Record<id, Layer>, rootLayerIds: string[], components: {}, variables: {}, meta }

图层通用字段（每个图层必填）：
id, name, type, x, y, width, height, rotation(0), opacity(1), visible(true),
locked(false), parentId(顶层为 null), index(同级从 0 起), blendMode("normal"),
layerPosition("auto")

**坐标约定：x/y 一律是画布绝对坐标；子节点坐标不叠加父节点。**

类型特有字段：
- frame: children: string[], fills, strokes, cornerRadius, effects,
  layout/sizingMode/overflow/clipContent（保留字段，渲染暂不实现，勿依赖）
- group: children: string[], effects
- rectangle / ellipse / polygon: fills, strokes, effects, cornerRadius
- text: content, fontFamily, fontWeight, fontSize, lineHeight, letterSpacing,
  textAlign, textDecoration, fills（必须设否则不可见）, strokes, sizing, overflow
- image: imageSrc, fitMode, cornerRadius, strokes, effects, filters

fills 元素：{ type:"solid", color:"#RRGGBB", opacity:1 }
    或 { type:"linearGradient", gradientStops:[{position,color}], gradientAngle, opacity }
strokes 元素：{ color, width, style:"solid", position:"inside"|"center"|"outside", opacity }

## 按钮示例（绝对坐标）
需求「一个红色按钮，文字 Click me」：
\`\`\`js
const bx=240, by=200, bw=148, bh=44;
btnId = Insert(document, {type:"frame", name:"Button", x:bx, y:by, width:bw, height:bh,
  cornerRadius:10, fills:[{type:"solid", color:"#EF4444", opacity:1}]});
Insert(btnId, {type:"text", name:"Label", x:bx+24, y:by+14, width:bw-48, height:18,
  content:"Click me", fontFamily:"Inter", fontSize:15, fontWeight:600,
  textAlign:"center", fills:[{type:"solid", color:"#FFFFFF", opacity:1}]});
\`\`\``;

export const buildToolsMd = (): string =>
  `# execute 画布 API

在 execute 里可用的函数（每次 execute 独立作用域；跨调用持久化用不加 const/let 的赋值）：

变更：
- Insert(parent, nodeData) -> id           // parent 为节点 id 或 document
- Copy(path, parent, data?) -> id          // 深拷贝，新 id；data.descendants 覆盖后代
- Update(path, data)                        // 合并属性；不能改 id/type/children
- Replace(path, nodeData) -> id             // 整节点替换
- Move(path, parent?, index?)
- Delete(path)
- SetVariables(vars, replace?)              // vars: { name: { type:"color"|"number"|"string"|"boolean", value } }

读取：
- Get(path) -> 嵌套节点树
- Get(path, { depth })                      // depth 限制展开层数
- Get(path, visit) / Get(visit)             // visit(node, ctx)；ctx 有 depth/index/bounds/problems/skipChildren()
- GetVariables() -> { variables }
- FindEmptySpace({ width, height, direction?, padding? }) -> { x, y, parentId }

其他：
- Print(...values)                          // 回执里读出
- TakeScreenshot([nodeId, ...])             // 回执里返回截图
- document                                  // 根节点字符串

约定：坐标为**绝对坐标**；不传 id；每个节点设 name；
失败用 edits + editId 修补，不要整段重发。`;

export const buildDesignRequest = (prompt: string): string =>
  `# 设计请求

${prompt}

请在画布上按 AGENTS.md / tools.md / schema.md 实现，分区块增量执行。
注意坐标为绝对坐标、只创建必要的节点（避免嵌套多余 frame），
完成后用 Get / TakeScreenshot 做确认。`;

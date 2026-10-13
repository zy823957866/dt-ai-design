# Canvas Ruler 改造方案

> 完全替换现有 SVG 标尺实现，改用 DOM + CSS 实现，参考 `packages/miaoma-canvas-ruler` 的架构，
> 按设计稿（Node ID: TcSq9 / QtbjK）的暗色风格重做。拆分为独立包 `@dt-ai-design/canvas-ruler`。

---

## 1. 目标与原则

**目标**：提供一套可复用、主题化、精准对齐设计稿的画布标尺组件。

**原则**：

- 纯 DOM + CSS 实现，不依赖 SVG
- 数学计算与视图分离（纯函数 + React 组件）
- 支持暗色/亮色双主题，通过 CSS 变量驱动
- 受控组件：所有视口参数（zoom, worldStart, worldEnd）由外部传入
- 零外部运行时依赖（仅依赖 React 作为 peer）

---

## 2. 包结构

新包路径：`packages/canvas-ruler/`

```
packages/canvas-ruler/
├── package.json
├── tsconfig.json
├── tsdown.config.ts        # tsdown 打包配置
├── src/
│   ├── index.ts            # 统一出口
│   ├── types.ts            # 类型定义
│   ├── constants.ts        # 默认常量
│   ├── components/
│   │   ├── CanvasRuler.tsx      # 标尺主体组件
│   │   └── CanvasRulerCorner.tsx # 角落方块
│   ├── math/
│   │   ├── pickRulerStep.ts     # 选择主刻度步长（1/2/5 × 10^n）
│   │   ├── getRulerTicks.ts      # 生成全部刻度数据
│   │   └── projectTickToViewport.ts # 世界坐标 → 视口像素
│   └── styles/
│       └── ruler.css         # 标尺样式（含暗色/亮色主题变量）
```

---

## 3. 关键类型定义

```typescript
// 标尺方向
type RulerAxis = 'horizontal' | 'vertical';

// 刻度级别
type RulerTickLevel = 'minor' | 'major';

// 单条刻度数据
interface RulerTick {
  value: number; // 世界坐标值
  offset: number; // 视口内像素偏移（相对 worldStart）
  level: RulerTickLevel;
  label?: string; // 仅主刻度有标签
}

// 刻度生成参数
interface RulerRenderOptions {
  axis: RulerAxis;
  zoom: number;
  viewportSize: number;
  worldStart: number;
  worldEnd: number;
  minMajorStepPx?: number; // 默认 DEFAULT_MIN_MAJOR_STEP_PX
  minorDivisions?: number; // 默认 DEFAULT_MINOR_DIVISIONS
}

// 组件属性
interface CanvasRulerProps {
  axis: RulerAxis;
  zoom: number;
  viewportSize: number;
  worldStart: number;
  worldEnd: number;
  thickness?: number; // 默认 DEFAULT_RULER_THICKNESS
  mousePos?: number | null; // 鼠标位置指示线（像素坐标，可选）
  className?: string;
}

interface CanvasRulerCornerProps {
  thickness?: number;
  className?: string;
}
```

---

## 4. 数学层（纯函数，零状态）

### 4.1 `pickRulerStep({ zoom, minMajorStepPx })` → `number`

**算法**：

1. `safeZoom = max(zoom, Number.EPSILON)`
2. `minWorldStep = minMajorStepPx / safeZoom`
3. 取 `exponent = floor(log10(minWorldStep))`，`magnitude = 10^exponent`
4. 在 `[1, 2, 5]` 中选第一个 `base * magnitude >= minWorldStep` 的值
5. 兜底：返回 `10 * magnitude`

**常量**：

- `DEFAULT_MIN_MAJOR_STEP_PX = 56`（设计稿刻度密度）
- `STEP_BASES = [1, 2, 5]`

### 4.2 `projectTickToViewport(value, worldStart, zoom)` → `number`

`(value - worldStart) * zoom`

### 4.3 `getRulerTicks(options)` → `RulerTick[]`

**流程**：

1. 调 `pickRulerStep` 得主刻度步长 `majorStep`
2. `minorStep = majorStep / minorDivisions`（默认 5 等分）
3. `start = floor(worldStart / minorStep) * minorStep`（向下对齐到次刻度网格）
4. `end = worldEnd + minorStep`（多走一格，避免边界刻度缺失）
5. 从 `start` 到 `end`，以 `minorStep` 为步长遍历：
   - `rounded = parseFloat(value.toFixed(4))`（消除浮点误差）
   - `offset = projectTickToViewport(rounded, worldStart, zoom)`
   - 剔除视口外 ± 1 格缓冲外的刻度
   - `isMajor = |rounded / majorStep - round(rounded / majorStep)| < 0.0001`
   - 主刻度：`label = String(Math.round(rounded))`
6. 返回 `RulerTick[]` 数组

---

## 5. 组件层

### 5.1 `CanvasRuler`

- 纯受控组件，不维护内部状态
- 调用 `getRulerTicks` 获取刻度数据
- 根元素用绝对定位的刻度 `div` 渲染
- 水平方向：刻度 `left` 定位，刻度线在下，标签水平居中于刻度线上方
- 垂直方向：刻度 `top` 定位，刻度线在右，标签沿刻度线旋转 -90°
- 可选 `mousePos` prop：渲染一条鼠标位置指示线（紫色）

### 5.2 `CanvasRulerCorner`

- 纯装饰，正方形，填补水平/垂直标尺交汇处的 L 形缺口
- 背景、边框与标尺保持一致

---

## 6. 样式方案（主题化）

使用 CSS 变量 + data 属性驱动主题，与项目现有 Tailwind 主题令牌对齐。

**CSS 变量映射**：

| 变量名           | 暗色值    | 亮色值    | 对应设计令牌            |
| ---------------- | --------- | --------- | ----------------------- |
| `--ruler-bg`     | `#19191F` | `#F6F6F8` | `--color-bg-panel-deep` |
| `--ruler-border` | `#2F2F3A` | `#E6E6EB` | `--color-border`        |
| `--ruler-tick`   | `#3A3A46` | `#D6D6DC` | `--color-border-strong` |
| `--ruler-text`   | `#6E6E7A` | `#A1A1AA` | `--color-text-tertiary` |

**主题切换**：通过 `data-theme="dark" / "light"` 属性切换，与项目全局主题机制一致。

**刻度级别样式**（通过 `data-ruler-tick-level="major" / "minor"`）：

- 次刻度线长度：4px
- 主刻度线长度：8px
- 主刻度显示数值标签（9px 字号）

---

## 7. 集成到编辑器

**替换点**：`apps/desktop/src/components/canvas/Canvas.tsx`

**改动**：

1. 删除对 `./Ruler` 的引用
2. 改为引用 `@dt-ai-design/canvas-ruler`
3. 适配 props：将 `viewport`（panX, panY, zoom）和 `containerSize` 换算为 `worldStart` / `worldEnd` / `viewportSize`
4. 移除 `RULER_OFFSET` 常量，改为使用包导出的 `DEFAULT_RULER_THICKNESS`
5. 角落方块从 `RulerCorner` 改为 `CanvasRulerCorner`

**坐标换算**：

```
horizontal:
  worldStart = -panX / zoom
  worldEnd   = (containerWidth - thickness) / zoom + worldStart
  viewportSize = containerWidth - thickness

vertical:
  worldStart = -panY / zoom
  worldEnd   = (containerHeight - thickness) / zoom + worldStart
  viewportSize = containerHeight - thickness
```

---

## 8. 打包与发布

- 构建工具：tsdown（与其他包一致）
- 输出格式：ESM + CJS + 类型声明
- CSS 由 tsdown 作为样式资源抽离
- peerDependencies：`react`
- package name：`@dt-ai-design/canvas-ruler`

---

## 9. 实施步骤

1. 脚手架：创建 `packages/canvas-ruler/`，配置 package.json / tsconfig.json / tsdown.config.ts
2. 基础层：`types.ts` + `constants.ts`
3. 数学层：`pickRulerStep.ts` → `projectTickToViewport.ts` → `getRulerTicks.ts`
4. 样式层：`styles/ruler.css`（含暗色/亮色变量）
5. 组件层：`CanvasRuler.tsx` + `CanvasRulerCorner.tsx`
6. 出口：`index.ts` 统一导出
7. 集成：在 `Canvas.tsx` 中替换旧标尺
8. 清理：删除旧的 `Ruler.tsx`
9. 验证：typecheck + 构建 + 手动视觉验收

---

## 10. 验证清单

- [ ] `pnpm --filter @dt-ai-design/canvas-ruler typecheck` 通过
- [ ] `pnpm --filter @dt-ai-design/canvas-ruler build` 通过（ESM/CJS/d.ts）
- [ ] `pnpm --filter @dt-ai-design/desktop typecheck` 通过
- [ ] 水平标尺：刻度均匀、主刻度带数字、缩放时步长自动调整
- [ ] 垂直标尺：刻度旋转 -90°、布局正确
- [ ] 角落方块：填补 L 形缺口，颜色与标尺一致
- [ ] 暗色主题：背景/刻度/文字颜色匹配设计稿
- [ ] 亮色主题：变量正确切换
- [ ] 鼠标指示线：随鼠标移动显示紫色指示线
- [ ] 全量 `pnpm typecheck` 通过

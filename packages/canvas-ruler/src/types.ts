/**
 * 标尺的轴线方向。
 * - 'horizontal'：水平标尺（沿 X 轴，刻度从左到右排列）
 * - 'vertical'：垂直标尺（沿 Y 轴，刻度从上到下排列）
 */
export type RulerAxis = 'horizontal' | 'vertical';

/**
 * 刻度级别，决定刻度线的长短与是否显示数值标签。
 * - 'minor'：次刻度（短线，无标签）
 * - 'major'：主刻度（长线，带数值标签）
 */
export type RulerTickLevel = 'minor' | 'major';

/**
 * 标尺上单个刻度的数据描述。
 */
export interface RulerTick {
  /** 刻度对应的世界坐标值（设计稿坐标系下的数值） */
  value: number;
  /** 刻度在视口内的像素偏移量（由 value 经换算得出） */
  offset: number;
  /** 刻度级别：主刻度（major）或次刻度（minor） */
  level: RulerTickLevel;
  /** 主刻度显示的数值标签；次刻度没有标签，为 undefined */
  label?: string;
}

/**
 * 刻度生成（纯数学计算）所需的参数。
 */
export interface RulerRenderOptions {
  /** 标尺方向 */
  axis: RulerAxis;
  /** 画布缩放比例：1 表示 100%，越大表示越放大 */
  zoom: number;
  /** 视口尺寸（水平标尺为宽度，垂直标尺为高度），单位 px */
  viewportSize: number;
  /** 可视区域起点对应的世界坐标 */
  worldStart: number;
  /** 可视区域终点对应的世界坐标 */
  worldEnd: number;
  /** 相邻主刻度之间的最小像素间隔，默认 DEFAULT_MIN_MAJOR_STEP_PX */
  minMajorStepPx?: number;
  /** 每个主刻度区间被均分的份数（即次刻度数量），默认 DEFAULT_MINOR_DIVISIONS */
  minorDivisions?: number;
}

/**
 * CanvasRuler 组件的属性。
 */
export interface CanvasRulerProps {
  /** 标尺方向：水平或垂直 */
  axis: RulerAxis;
  /** 画布缩放比例 */
  zoom: number;
  /** 视口尺寸（水平标尺为宽度，垂直标尺为高度），单位 px */
  viewportSize: number;
  /** 可视区域起点对应的世界坐标 */
  worldStart: number;
  /** 可视区域终点对应的世界坐标 */
  worldEnd: number;
  /** 标尺厚度（水平标尺为高度，垂直标尺为宽度），默认 DEFAULT_RULER_THICKNESS */
  thickness?: number;
  /** 鼠标位置指示线的像素偏移（相对视口起点），null 表示不显示 */
  mousePos?: number | null;
  /** 附加到根元素上的 CSS 类名，方便外部定制样式 */
  className?: string;
}

/** 角落方块组件的属性。 */
export interface CanvasRulerCornerProps {
  /** 方块边长，应与标尺厚度一致，默认 DEFAULT_RULER_THICKNESS */
  thickness?: number;
  /** 附加类名 */
  className?: string;
}

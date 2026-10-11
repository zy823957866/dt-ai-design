import type { BaseLayer } from './base';
import type {
  FillStyle,
  StrokeStyle,
  EffectStyle,
  FrameLayout,
  SizingMode,
  OverflowMode,
  TextAlign,
  TextDecoration,
  TextTransform,
  TextSizing,
  TextOverflow,
  ImageFitMode,
  ImageFilters,
  VerticalAlign,
} from './styles';

/** 矩形图层 */
export interface RectangleLayer extends BaseLayer {
  type: 'rectangle';
  fills: FillStyle[];
  strokes: StrokeStyle[];
  cornerRadius: number;
  effects: EffectStyle[];
}

/** 椭圆图层 */
export interface EllipseLayer extends BaseLayer {
  type: 'ellipse';
  fills: FillStyle[];
  strokes: StrokeStyle[];
  effects: EffectStyle[];
  arcStartAngle: number;
  arcEndAngle: number;
  innerRadius: number;
}

/** 文字图层 */
export interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  textAlign: TextAlign;
  verticalAlign: VerticalAlign;
  textDecoration: TextDecoration;
  textTransform: TextTransform;
  fills: FillStyle[];
  strokes: StrokeStyle[];
  sizing: TextSizing;
  overflow: TextOverflow;
  maxLines?: number;
}

/** 图片图层 */
export interface ImageLayer extends BaseLayer {
  type: 'image';
  imageSrc: string;
  fitMode: ImageFitMode;
  cornerRadius: number;
  strokes: StrokeStyle[];
  effects: EffectStyle[];
  filters: ImageFilters;
}

/** Frame 图层（画框/容器） */
export interface FrameLayer extends BaseLayer {
  type: 'frame';
  /** 子图层 ID 列表（按排序顺序） */
  children: string[];
  layout: FrameLayout;
  sizingMode: {
    width: SizingMode;
    height: SizingMode;
  };
  fills: FillStyle[];
  strokes: StrokeStyle[];
  cornerRadius: number;
  effects: EffectStyle[];
  overflow: OverflowMode;
  clipContent: boolean;
}

/** 组图层 */
export interface GroupLayer extends BaseLayer {
  type: 'group';
  /** 子图层 ID 列表 */
  children: string[];
  effects: EffectStyle[];
}

/** 便签图层 */
export interface StickyNoteLayer extends BaseLayer {
  type: 'stickyNote';
  content: string;
  color: string;
  textColor: string;
  fontSize: number;
  author: string;
  authorAvatar?: string;
}

/** 路径点 */
export interface PathPoint {
  x: number;
  y: number;
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
}

/** 路径图层 */
export interface PathLayer extends BaseLayer {
  type: 'path';
  points: PathPoint[];
  fills: FillStyle[];
  strokes: StrokeStyle[];
  effects: EffectStyle[];
  closed: boolean;
  fillRule: 'nonzero' | 'evenodd';
}

/** 箭头类型 */
export const ArrowCapType = {
  NONE: 'none',
  ARROW: 'arrow',
  TRIANGLE: 'triangle',
  CIRCLE: 'circle',
  SQUARE: 'square',
  DIAMOND: 'diamond',
} as const;
export type ArrowCapType = (typeof ArrowCapType)[keyof typeof ArrowCapType];

/** 直线/箭头图层 */
export interface LineLayer extends BaseLayer {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokes: StrokeStyle[];
  startCap: ArrowCapType;
  endCap: ArrowCapType;
  arrowSize: number;
  curveType: 'straight' | 'bezier' | 'step';
  bend: number;
}

/** 组件实例图层 */
export interface ComponentInstanceLayer extends BaseLayer {
  type: 'componentInstance';
  componentId: string;
  variantId?: string;
  overrides: Record<string, unknown>;
}

/** 所有图层类型联合 */
export type Layer =
  | RectangleLayer
  | EllipseLayer
  | TextLayer
  | ImageLayer
  | FrameLayer
  | GroupLayer
  | StickyNoteLayer
  | PathLayer
  | LineLayer
  | ComponentInstanceLayer;

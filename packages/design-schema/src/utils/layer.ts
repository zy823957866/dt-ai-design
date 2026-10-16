import type {
  Layer,
  RectangleLayer,
  EllipseLayer,
  PolygonLayer,
  FrameLayer,
  TextLayer,
  ImageLayer,
  StickyNoteLayer,
  BrowserLayer,
  PathLayer,
  LineLayer,
  GroupLayer,
  ComponentInstanceLayer,
  FillStyle,
  StrokeStyle,
  ImageFilters,
  FrameLayout,
  LayerBounds,
} from '../types';
import { generateId } from './id';

/** 图层类型字符串 */
export type LayerTypeString =
  | 'rectangle'
  | 'ellipse'
  | 'polygon'
  | 'text'
  | 'image'
  | 'frame'
  | 'group'
  | 'stickyNote'
  | 'browser'
  | 'path'
  | 'line'
  | 'componentInstance';

/** 默认填充 */
const defaultFill: FillStyle = {
  type: 'solid',
  color: '#7C3AED',
  opacity: 1,
};

/** 矩形/圆形等形状的默认填充 */
const defaultShapeFill: FillStyle = {
  type: 'solid',
  color: '#CCCCCC',
  opacity: 1,
};

/** 默认描边 */
const defaultStroke: StrokeStyle = {
  color: '#E4E4E7',
  width: 1,
  style: 'solid',
  position: 'center',
  opacity: 1,
};

/** 默认 Frame 布局（pen.dev 单轴模型） */
const defaultFrameLayout: FrameLayout = {
  mode: 'none',
  gap: 0,
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  justifyContent: 'start',
  alignItems: 'start',
};

/** 默认图片滤镜 */
const defaultImageFilters: ImageFilters = {
  brightness: 1,
  contrast: 0,
  saturation: 0,
  hue: 0,
  blur: 0,
};

/** 图层名称计数器 */
const layerCounters: Record<string, number> = {};

/** 生成默认图层名 */
function defaultLayerName(type: LayerTypeString): string {
  const baseNames: Record<LayerTypeString, string> = {
    rectangle: 'Rectangle',
    ellipse: 'Ellipse',
    polygon: 'Polygon',
    text: 'Text',
    image: 'Image',
    frame: 'Frame',
    group: 'Group',
    stickyNote: 'Sticky Note',
    browser: 'Browser',
    path: 'Path',
    line: 'Line',
    componentInstance: 'Component',
  };
  const base = baseNames[type];
  layerCounters[type] = (layerCounters[type] || 0) + 1;
  return `${base} ${layerCounters[type]}`;
}

/** 基础属性默认值 */
function baseLayerProps(
  type: LayerTypeString,
  x = 100,
  y = 100,
  width = 100,
  height = 100,
) {
  return {
    id: generateId('layer'),
    name: defaultLayerName(type),
    type,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    parentId: null,
    index: 0,
    blendMode: 'normal',
    layerPosition: 'auto' as const,
  };
}

/**
 * 统一的图层创建工厂函数
 */
export function createLayer(
  type: 'rectangle',
  props?: Partial<RectangleLayer>,
): RectangleLayer;
export function createLayer(
  type: 'ellipse',
  props?: Partial<EllipseLayer>,
): EllipseLayer;
export function createLayer(
  type: 'polygon',
  props?: Partial<PolygonLayer>,
): PolygonLayer;
export function createLayer(
  type: 'browser',
  props?: Partial<BrowserLayer>,
): BrowserLayer;
export function createLayer(
  type: 'text',
  props?: Partial<TextLayer>,
): TextLayer;
export function createLayer(
  type: 'image',
  props?: Partial<ImageLayer>,
): ImageLayer;
export function createLayer(
  type: 'frame',
  props?: Partial<FrameLayer>,
): FrameLayer;
export function createLayer(
  type: 'group',
  props?: Partial<GroupLayer>,
): GroupLayer;
export function createLayer(
  type: 'stickyNote',
  props?: Partial<StickyNoteLayer>,
): StickyNoteLayer;
export function createLayer(
  type: 'path',
  props?: Partial<PathLayer>,
): PathLayer;
export function createLayer(
  type: 'line',
  props?: Partial<LineLayer>,
): LineLayer;
export function createLayer(
  type: 'componentInstance',
  props?: Partial<ComponentInstanceLayer>,
): ComponentInstanceLayer;
export function createLayer(
  type: LayerTypeString,
  props: Partial<Layer> = {},
): Layer {
  const base = baseLayerProps(type);

  switch (type) {
    case 'rectangle':
      return {
        ...base,
        fills: [{ ...defaultShapeFill }],
        strokes: [],
        cornerRadius: 0,
        effects: [],
        ...props,
      } as RectangleLayer;

    case 'ellipse':
      return {
        ...base,
        fills: [{ ...defaultShapeFill }],
        strokes: [],
        effects: [],
        arcStartAngle: 0,
        arcEndAngle: 360,
        innerRadius: 0,
        ...props,
      } as EllipseLayer;

    case 'polygon':
      return {
        ...base,
        fills: [{ ...defaultShapeFill }],
        strokes: [],
        effects: [],
        cornerRadius: 0,
        polygonCount: 6,
        ...props,
      } as PolygonLayer;

    case 'browser':
      return {
        ...base,
        url: '',
        zoom: 1,
        ...props,
      } as BrowserLayer;

    case 'text':
      return {
        ...base,
        content: 'Text',
        fontFamily: 'Inter',
        fontWeight: 400,
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: 0,
        textAlign: 'left',
        verticalAlign: 'top',
        textDecoration: 'none',
        fills: [{ type: 'solid' as const, color: '#E4E4E7', opacity: 1 }],
        strokes: [],
        sizing: 'autoHeight',
        ...props,
      } as TextLayer;

    case 'image':
      return {
        ...base,
        imageSrc: '',
        fitMode: 'fill',
        cornerRadius: 0,
        strokes: [],
        effects: [],
        filters: { ...defaultImageFilters },
        ...props,
      } as ImageLayer;

    case 'frame':
      return {
        ...base,
        children: [],
        layout: { ...defaultFrameLayout },
        sizingMode: { width: 'fixed', height: 'fixed' },
        fills: [{ type: 'solid' as const, color: '#FFFFFF', opacity: 1 }],
        strokes: [],
        cornerRadius: 0,
        effects: [],
        overflow: 'visible',
        clipContent: false,
        ...props,
      } as FrameLayer;

    case 'group':
      return {
        ...base,
        children: [],
        effects: [],
        ...props,
      } as GroupLayer;

    case 'stickyNote':
      return {
        ...base,
        content: '',
        color: '#FBBF24',
        textColor: '#1E1E24',
        fontSize: 14,
        author: 'Anonymous',
        ...props,
      } as StickyNoteLayer;

    case 'path':
      return {
        ...base,
        points: [],
        fills: [{ ...defaultFill }],
        strokes: [{ ...defaultStroke }],
        effects: [],
        closed: false,
        fillRule: 'nonzero',
        ...props,
      } as PathLayer;

    case 'line':
      return {
        ...base,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        strokes: [{ ...defaultStroke }],
        startCap: 'none',
        endCap: 'none',
        arrowSize: 8,
        ...props,
      } as LineLayer;

    case 'componentInstance':
      return {
        ...base,
        componentId:
          (props as Partial<ComponentInstanceLayer>).componentId || '',
        variantId: undefined,
        overrides: {},
        ...props,
      } as ComponentInstanceLayer;

    default:
      throw new Error(`Unknown layer type: ${type}`);
  }
}

/**
 * 深拷贝图层（重新生成 ID，名称加 " copy" 后缀）
 */
export function cloneLayer<T extends Layer>(layer: T): T {
  const cloned = JSON.parse(JSON.stringify(layer)) as T;
  cloned.id = generateId('layer');
  cloned.name = `${layer.name} copy`;
  return cloned;
}

/**
 * 获取图层包围盒
 */
export function getLayerBounds(layer: Layer): LayerBounds {
  return {
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
  };
}

/**
 * 按 id 查找图层
 */
export function findLayerById(
  doc: { layers: Record<string, Layer> },
  id: string,
): Layer | undefined {
  return doc.layers[id];
}

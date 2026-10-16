/**
 * 图层类型
 */
export const LayerType = {
  RECTANGLE: 'rectangle',
  ELLIPSE: 'ellipse',
  TEXT: 'text',
  IMAGE: 'image',
  FRAME: 'frame',
  GROUP: 'group',
  STICKY_NOTE: 'stickyNote',
  PATH: 'path',
  LINE: 'line',
  POLYGON: 'polygon',
  BROWSER: 'browser',
  COMPONENT_INSTANCE: 'componentInstance',
} as const;
export type LayerType = (typeof LayerType)[keyof typeof LayerType];

export type LayerPosition = 'auto' | 'absolute';

export interface LayerMetadata {
  sourceUrl?: string;
  htmlId?: string;
  link?: string;
}

/**
 * 混合模式
 */
export const BlendMode = {
  NORMAL: 'normal',
  DARKEN: 'darken',
  MULTIPLY: 'multiply',
  LINEAR_BURN: 'linearBurn',
  COLOR_BURN: 'colorBurn',
  LIGHTEN: 'lighten',
  SCREEN: 'screen',
  LINEAR_DODGE: 'linearDodge',
  COLOR_DODGE: 'colorDodge',
  OVERLAY: 'overlay',
  SOFT_LIGHT: 'softLight',
  HARD_LIGHT: 'hardLight',
  DIFFERENCE: 'difference',
  EXCLUSION: 'exclusion',
  HUE: 'hue',
  SATURATION: 'saturation',
  COLOR: 'color',
  LUMINOSITY: 'luminosity',
} as const;
export type BlendMode = (typeof BlendMode)[keyof typeof BlendMode];

/**
 * 图层基类 —— 所有图层共享的属性
 */
export interface BaseLayer {
  id: string;
  name: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  parentId: string | null;
  index: number;
  blendMode: BlendMode;
  layerPosition: LayerPosition;
  metadata?: LayerMetadata;
}

/**
 * 图层包围盒
 */
export interface LayerBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

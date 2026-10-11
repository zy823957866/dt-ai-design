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
  COMPONENT_INSTANCE: 'componentInstance',
} as const;
export type LayerType = (typeof LayerType)[keyof typeof LayerType];

/**
 * 混合模式
 */
export const BlendMode = {
  NORMAL: 'normal',
  MULTIPLY: 'multiply',
  SCREEN: 'screen',
  OVERLAY: 'overlay',
  DARKEN: 'darken',
  LIGHTEN: 'lighten',
  COLOR_DODGE: 'colorDodge',
  COLOR_BURN: 'colorBurn',
  HARD_LIGHT: 'hardLight',
  SOFT_LIGHT: 'softLight',
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

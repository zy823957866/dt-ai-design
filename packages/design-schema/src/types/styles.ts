// ===== Fill =====

export const FillType = {
  NONE: 'none',
  SOLID: 'solid',
  LINEAR_GRADIENT: 'linearGradient',
  RADIAL_GRADIENT: 'radialGradient',
  ANGULAR_GRADIENT: 'angularGradient',
  MESH_GRADIENT: 'meshGradient',
  IMAGE: 'image',
} as const;
export type FillType = (typeof FillType)[keyof typeof FillType];

export interface GradientStop {
  position: number;
  color: string;
}

export interface FillStyle {
  type: FillType;
  color?: string;
  gradientStops?: GradientStop[];
  gradientAngle?: number;
  gradientType?: 'linear' | 'radial' | 'angular' | 'mesh';
  imageSrc?: string;
  imageFit?: ImageFitMode;
  opacity: number;
}

// ===== Stroke =====

export const StrokeStyleType = {
  SOLID: 'solid',
  DASHED: 'dashed',
  DOTTED: 'dotted',
} as const;
export type StrokeStyleType =
  (typeof StrokeStyleType)[keyof typeof StrokeStyleType];

export const StrokePosition = {
  INSIDE: 'inside',
  CENTER: 'center',
  OUTSIDE: 'outside',
} as const;
export type StrokePosition =
  (typeof StrokePosition)[keyof typeof StrokePosition];

export const StrokeCap = {
  FLAT: 'flat',
  ROUND: 'round',
  SQUARE: 'square',
} as const;
export type StrokeCap = (typeof StrokeCap)[keyof typeof StrokeCap];

export const StrokeJoin = {
  MITER: 'miter',
  ROUND: 'round',
  BEVEL: 'bevel',
} as const;
export type StrokeJoin = (typeof StrokeJoin)[keyof typeof StrokeJoin];

export interface StrokeStyle {
  color: string;
  width: number;
  style: StrokeStyleType;
  position: StrokePosition;
  cap?: StrokeCap;
  join?: StrokeJoin;
  dashPattern?: number[];
  opacity: number;
}

// ===== Effect =====

export const EffectType = {
  DROP_SHADOW: 'dropShadow',
  INNER_SHADOW: 'innerShadow',
  BLUR: 'blur',
  OUTER_GLOW: 'outerGlow',
  INNER_GLOW: 'innerGlow',
  LAYER_BLUR: 'layerBlur',
  BACKGROUND_BLUR: 'backgroundBlur',
  SHADER: 'shader',
} as const;
export type EffectType = (typeof EffectType)[keyof typeof EffectType];

export interface EffectStyle {
  type: EffectType;
  x?: number;
  y?: number;
  blur?: number;
  spread?: number;
  color?: string;
  opacity?: number;
}

// ===== Frame Layout（pen.dev 单轴模型）=====

export const FrameLayoutMode = {
  NONE: 'none',
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal',
} as const;
export type FrameLayoutMode =
  (typeof FrameLayoutMode)[keyof typeof FrameLayoutMode];

export const JustifyContent = {
  START: 'start',
  CENTER: 'center',
  END: 'end',
  SPACE_BETWEEN: 'spaceBetween',
  SPACE_AROUND: 'spaceAround',
} as const;
export type JustifyContent =
  (typeof JustifyContent)[keyof typeof JustifyContent];

export const AlignItems = {
  START: 'start',
  CENTER: 'center',
  END: 'end',
} as const;
export type AlignItems = (typeof AlignItems)[keyof typeof AlignItems];

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface FrameLayout {
  mode: FrameLayoutMode;
  gap: number;
  padding: Padding;
  justifyContent: JustifyContent;
  alignItems: AlignItems;
}

// ===== Sizing Mode =====

export const SizingMode = {
  FIXED: 'fixed',
  HUG_CONTENTS: 'hugContents',
  FILL_CONTAINER: 'fillContainer',
} as const;
export type SizingMode = (typeof SizingMode)[keyof typeof SizingMode];

// ===== Corner Radius =====

export type CornerRadius = number | CornerRadiusPerCorner;

export interface CornerRadiusPerCorner {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

// ===== Text =====

export const TextAlign = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
  JUSTIFY: 'justify',
} as const;
export type TextAlign = (typeof TextAlign)[keyof typeof TextAlign];

export const VerticalAlign = {
  TOP: 'top',
  MIDDLE: 'middle',
  BOTTOM: 'bottom',
} as const;
export type VerticalAlign = (typeof VerticalAlign)[keyof typeof VerticalAlign];

export const TextDecoration = {
  NONE: 'none',
  UNDERLINE: 'underline',
  STRIKETHROUGH: 'strikethrough',
  OVERLINE: 'overline',
} as const;
export type TextDecoration =
  (typeof TextDecoration)[keyof typeof TextDecoration];

export const TextTransform = {
  NONE: 'none',
  UPPERCASE: 'uppercase',
  LOWERCASE: 'lowercase',
  CAPITALIZE: 'capitalize',
} as const;
export type TextTransform = (typeof TextTransform)[keyof typeof TextTransform];

export const TextSizing = {
  AUTO_WIDTH: 'autoWidth',
  AUTO_HEIGHT: 'autoHeight',
  FIXED: 'fixed',
} as const;
export type TextSizing = (typeof TextSizing)[keyof typeof TextSizing];

export const TextOverflow = {
  VISIBLE: 'visible',
  CLIP: 'clip',
  ELLIPSIS: 'ellipsis',
} as const;
export type TextOverflow = (typeof TextOverflow)[keyof typeof TextOverflow];

export interface TextStyle {
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  paragraphSpacing?: number;
  textAlign: TextAlign;
  verticalAlign?: VerticalAlign;
  textDecoration: TextDecoration;
  textTransform: TextTransform;
}

// ===== Image =====

export const ImageFitMode = {
  FILL: 'fill',
  FIT: 'fit',
  STRETCH: 'stretch',
  TILE: 'tile',
  ORIGINAL: 'original',
} as const;
export type ImageFitMode = (typeof ImageFitMode)[keyof typeof ImageFitMode];

export interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  sepia?: number;
  grayscale?: number;
  invert?: boolean;
}

// ===== Overflow =====

export const OverflowMode = {
  VISIBLE: 'visible',
  HIDDEN: 'hidden',
  SCROLL: 'scroll',
  AUTO: 'auto',
} as const;
export type OverflowMode = (typeof OverflowMode)[keyof typeof OverflowMode];

// ===== Transform =====

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

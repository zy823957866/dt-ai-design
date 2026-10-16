import type {
  Layer,
  TextLayer,
  RectangleLayer,
  FrameLayer,
} from '@dt-ai-design/design-schema';

export interface LayerFormValues {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  fillColor?: string;
  fillOpacity?: number;
  cornerRadius?: number;
  // text
  content?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  textAlign?: string;
  letterSpacing?: number;
  lineHeight?: number;
  textDecoration?: string;
  textTransform?: string;
  // frame
  cornerRadiusFrame?: number;
  clipContent?: boolean;
}

export function nodeToFormValues(layer: Layer): LayerFormValues {
  const base: LayerFormValues = {
    name: layer.name,
    x: Math.round(layer.x * 100) / 100,
    y: Math.round(layer.y * 100) / 100,
    width: Math.round(layer.width * 100) / 100,
    height: Math.round(layer.height * 100) / 100,
    rotation: layer.rotation || 0,
    opacity: layer.opacity ?? 1,
    visible: layer.visible,
    locked: layer.locked,
  };

  const fills = (
    layer as { fills?: Array<{ color?: string; opacity?: number }> }
  ).fills;
  const fill = fills?.[0];
  if (fill) {
    base.fillColor = fill.color || '#000000';
    base.fillOpacity = fill.opacity ?? 1;
  }

  if (layer.type === 'rectangle' || layer.type === 'frame') {
    const rl = layer as RectangleLayer | FrameLayer;
    base.cornerRadius =
      typeof rl.cornerRadius === 'number'
        ? rl.cornerRadius
        : (rl.cornerRadius?.topLeft ?? 0);
  }

  if (layer.type === 'frame') {
    const fl = layer as FrameLayer;
    base.clipContent = fl.clipContent ?? false;
  }

  if (layer.type === 'text') {
    const tl = layer as TextLayer;
    base.content = tl.content || '';
    base.fontSize = tl.fontSize;
    base.fontWeight = tl.fontWeight;
    base.fontFamily = tl.fontFamily || 'Inter';
    base.textAlign = tl.textAlign || 'left';
    base.letterSpacing = tl.letterSpacing || 0;
    base.lineHeight = tl.lineHeight || 0;
    base.textDecoration = tl.textDecoration || 'none';
    base.textTransform = tl.textTransform || 'none';
  }

  return base;
}

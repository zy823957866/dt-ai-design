import type {
  DesignDocument,
  Layer,
  TextLayer,
} from '@dt-ai-design/design-schema';

import type { EditorApi } from './editor';

export interface TextSize {
  width: number;
  height: number;
}

type MeasurableText = Pick<
  TextLayer,
  | 'content'
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'letterSpacing'
  | 'lineHeight'
>;

let measureContext: CanvasRenderingContext2D | null | undefined;

const getMeasureContext = (): CanvasRenderingContext2D | null => {
  if (measureContext !== undefined) return measureContext;
  try {
    measureContext = document.createElement('canvas').getContext('2d');
  } catch {
    measureContext = null;
  }
  return measureContext;
};

/** 度量文本尺寸（多行取最宽行；无 canvas 环境时按字宽估算）。 */
export const measureText = (text: MeasurableText): TextSize => {
  const fontSize = text.fontSize || 16;
  const letterSpacing = text.letterSpacing ?? 0;
  const lineHeight = text.lineHeight || Math.round(fontSize * 1.2);
  const lines = (text.content ?? '').split('\n');

  const ctx = getMeasureContext();
  let width = 0;
  for (const line of lines) {
    let lineWidth: number;
    if (ctx) {
      ctx.font = `${text.fontWeight || 400} ${fontSize}px ${
        text.fontFamily || 'Inter'
      }`;
      lineWidth = ctx.measureText(line).width;
      if (letterSpacing) {
        lineWidth += letterSpacing * Math.max(0, line.length - 1);
      }
    } else {
      lineWidth = line.length * fontSize * 0.58;
    }
    if (lineWidth > width) width = lineWidth;
  }

  return {
    width: Math.ceil(width),
    height: Math.ceil(lines.length * lineHeight),
  };
};

const isText = (layer: Layer | undefined): layer is TextLayer =>
  Boolean(layer && layer.type === 'text');

/**
 * 文本图层「贴合的期望尺寸」。
 * - fixed：不贴合（返回 null）。
 * - 左对齐（默认）：宽高都贴合内容。
 * - 居中/右对齐：宽度作为对齐容器保留，仅高度贴合。
 */
export const desiredTextSize = (layer: Layer | undefined): TextSize | null => {
  if (!isText(layer)) return null;
  if (layer.sizing === 'fixed') return null;
  const measured = measureText(layer);
  const width =
    layer.textAlign === 'left' ? Math.max(measured.width + 2, 8) : layer.width;
  return { width, height: Math.max(measured.height, 8) };
};

/** 让指定文本图层的宽高贴合内容（编辑器命令，可撤销）。 */
export const applyTextHug = (editor: EditorApi, id: string): void => {
  const layer = editor.getDocument().layers[id];
  const size = desiredTextSize(layer);
  if (!layer || !size) return;
  if (Math.abs(layer.width - size.width) > 0.5) {
    editor.setLayerProperty(id, 'width', size.width);
  }
  if (Math.abs(layer.height - size.height) > 0.5) {
    editor.setLayerProperty(id, 'height', size.height);
  }
};

/** 批量贴合文档中所有文本图层（用于加载 / AI 生成结果）。 */
export const normalizeTextSizes = (
  document: DesignDocument,
): { document: DesignDocument; changed: boolean } => {
  const doc = structuredClone(document);
  let changed = false;
  for (const layer of Object.values(doc.layers)) {
    const size = desiredTextSize(layer);
    if (!size) continue;
    if (Math.abs(layer.width - size.width) > 0.5) {
      layer.width = size.width;
      changed = true;
    }
    if (Math.abs(layer.height - size.height) > 0.5) {
      layer.height = size.height;
      changed = true;
    }
  }
  return { document: doc, changed };
};

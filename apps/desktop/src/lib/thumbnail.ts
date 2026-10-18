import type {
  DesignDocument,
  Layer,
  FillStyle,
} from '@dt-ai-design/design-schema';

const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 300;

const num = (value: number): number => Math.round(value * 100) / 100;

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const solidColor = (fills: FillStyle[] | undefined): string | undefined => {
  const fill = fills?.[0];
  return fill && fill.type === 'solid' ? fill.color : undefined;
};

const radius = (layer: Layer): number => {
  const value = (layer as { cornerRadius?: number | { topLeft?: number } })
    .cornerRadius;
  if (typeof value === 'number') return value;
  return value?.topLeft ?? 0;
};

const strokeAttrs = (layer: Layer): string => {
  const stroke = (layer as { strokes?: { color: string; width: number }[] })
    .strokes?.[0];
  if (!stroke) return '';
  return ` stroke="${stroke.color}" stroke-width="${stroke.width}"`;
};

const renderNode = (doc: DesignDocument, layer: Layer | undefined): string => {
  if (!layer || !layer.visible) return '';
  const x = num(layer.x);
  const y = num(layer.y);
  const w = num(layer.width);
  const h = num(layer.height);

  switch (layer.type) {
    case 'frame':
    case 'rectangle':
    case 'image': {
      const fill =
        solidColor((layer as { fills?: FillStyle[] }).fills) ?? 'transparent';
      const children =
        layer.type === 'frame'
          ? layer.children.map((id) => renderNode(doc, doc.layers[id])).join('')
          : '';
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${num(
        radius(layer),
      )}" fill="${fill}"${strokeAttrs(layer)}/>${children}`;
    }
    case 'ellipse': {
      const fill =
        solidColor((layer as { fills?: FillStyle[] }).fills) ?? 'transparent';
      return `<ellipse cx="${num(layer.x + layer.width / 2)}" cy="${num(
        layer.y + layer.height / 2,
      )}" rx="${num(layer.width / 2)}" ry="${num(
        layer.height / 2,
      )}" fill="${fill}"${strokeAttrs(layer)}/>`;
    }
    case 'group':
      return layer.children
        .map((id) => renderNode(doc, doc.layers[id]))
        .join('');
    case 'text': {
      const text = layer as Layer & {
        content: string;
        fontSize: number;
        fontWeight: number;
        fontFamily: string;
        textAlign: string;
        fills?: FillStyle[];
      };
      const fill = solidColor(text.fills) ?? '#000000';
      const anchor =
        text.textAlign === 'center'
          ? 'middle'
          : text.textAlign === 'right'
            ? 'end'
            : 'start';
      const tx =
        anchor === 'middle'
          ? num(layer.x + layer.width / 2)
          : anchor === 'end'
            ? num(layer.x + layer.width)
            : x;
      return `<text x="${tx}" y="${num(
        layer.y + text.fontSize,
      )}" font-size="${text.fontSize}" font-weight="${text.fontWeight}" font-family="${escapeXml(
        text.fontFamily || 'Inter',
      )}" fill="${fill}" text-anchor="${anchor}">${escapeXml(
        text.content ?? '',
      )}</text>`;
    }
    default:
      return '';
  }
};

const documentBounds = (doc: DesignDocument) => {
  const roots = doc.rootLayerIds
    .map((id) => doc.layers[id])
    .filter((layer): layer is Layer => Boolean(layer));
  if (roots.length === 0) {
    return { x: 0, y: 0, width: THUMBNAIL_WIDTH, height: THUMBNAIL_HEIGHT };
  }
  const left = Math.min(...roots.map((layer) => layer.x));
  const top = Math.min(...roots.map((layer) => layer.y));
  const right = Math.max(...roots.map((layer) => layer.x + layer.width));
  const bottom = Math.max(...roots.map((layer) => layer.y + layer.height));
  return {
    x: left,
    y: top,
    width: Math.max(right - left, 1),
    height: Math.max(bottom - top, 1),
  };
};

/** 把设计文档渲染为缩略图 SVG 字符串（绝对坐标，适配到缩略图框）。 */
export const renderDocumentThumbnailSvg = (doc: DesignDocument): string => {
  const bounds = documentBounds(doc);
  const nodes = doc.rootLayerIds
    .map((id) => renderNode(doc, doc.layers[id]))
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT}" viewBox="${num(
    bounds.x,
  )} ${num(bounds.y)} ${num(bounds.width)} ${num(
    bounds.height,
  )}" preserveAspectRatio="xMidYMid meet"><rect x="${num(bounds.x)}" y="${num(
    bounds.y,
  )}" width="${num(bounds.width)}" height="${num(
    bounds.height,
  )}" fill="#ffffff"/>${nodes}</svg>`;
};

/** 缩略图 data URL（SVG），可直接用于 <img src>。 */
export const documentThumbnailDataUrl = (doc: DesignDocument): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    renderDocumentThumbnailSvg(doc),
  )}`;

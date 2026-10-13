import type { Layer } from '@dt-ai-design/design-schema';
import type { LayerFormValues } from './nodeToFormValues';

export type LayerPatch = Record<string, unknown>;

/**
 * Compute the diff between current form values and the original layer state.
 * Only returns fields that actually changed, so we don't write back unchanged data.
 *
 * Returns a flat patch object suitable for editor.setLayerProperties.
 */
export function formValuesToPatch(
  layer: Layer,
  values: LayerFormValues,
  original: LayerFormValues,
): LayerPatch {
  const patch: LayerPatch = {};

  if (values.name !== original.name) patch.name = values.name;
  if (values.x !== original.x) patch.x = values.x;
  if (values.y !== original.y) patch.y = values.y;
  if (values.width !== original.width) patch.width = values.width;
  if (values.height !== original.height) patch.height = values.height;
  if (values.rotation !== original.rotation) patch.rotation = values.rotation;
  if (values.opacity !== original.opacity) patch.opacity = values.opacity;
  if (values.visible !== original.visible) patch.visible = values.visible;
  if (values.locked !== original.locked) patch.locked = values.locked;

  // Fill
  const fills = (
    layer as { fills?: Array<{ color?: string; opacity?: number }> }
  ).fills;
  const hasFill = fills && fills.length > 0;
  if (values.fillColor !== undefined && values.fillOpacity !== undefined) {
    if (
      !hasFill ||
      fills![0].color !== values.fillColor ||
      fills![0].opacity !== values.fillOpacity
    ) {
      patch.fills = [
        {
          type: 'solid',
          color: values.fillColor,
          opacity: values.fillOpacity,
        },
      ];
    }
  }

  // Corner radius (rect / frame)
  if (
    values.cornerRadius !== undefined &&
    (layer.type === 'rectangle' || layer.type === 'frame')
  ) {
    const orig = (layer as { cornerRadius?: number }).cornerRadius || 0;
    if (values.cornerRadius !== orig) {
      patch.cornerRadius = values.cornerRadius;
    }
  }

  // Clip content (frame)
  if (values.clipContent !== undefined && layer.type === 'frame') {
    const orig = (layer as { clipContent?: boolean }).clipContent ?? false;
    if (values.clipContent !== orig) {
      patch.clipContent = values.clipContent;
    }
  }

  // Text properties
  if (layer.type === 'text') {
    if (
      values.content !== undefined &&
      values.content !== (layer as { content?: string }).content
    ) {
      patch.content = values.content;
    }
    if (
      values.fontSize !== undefined &&
      values.fontSize !== (layer as { fontSize?: number }).fontSize
    ) {
      patch.fontSize = values.fontSize;
    }
    if (
      values.fontWeight !== undefined &&
      values.fontWeight !== (layer as { fontWeight?: number }).fontWeight
    ) {
      patch.fontWeight = values.fontWeight;
    }
    if (
      values.fontFamily !== undefined &&
      values.fontFamily !== (layer as { fontFamily?: string }).fontFamily
    ) {
      patch.fontFamily = values.fontFamily;
    }
    if (
      values.textAlign !== undefined &&
      values.textAlign !== (layer as { textAlign?: string }).textAlign
    ) {
      patch.textAlign = values.textAlign;
    }
    if (
      values.letterSpacing !== undefined &&
      values.letterSpacing !==
        (layer as { letterSpacing?: number }).letterSpacing
    ) {
      patch.letterSpacing = values.letterSpacing;
    }
    if (
      values.lineHeight !== undefined &&
      values.lineHeight !== (layer as { lineHeight?: number }).lineHeight
    ) {
      patch.lineHeight = values.lineHeight;
    }
    if (
      values.textDecoration !== undefined &&
      values.textDecoration !==
        (layer as { textDecoration?: string }).textDecoration
    ) {
      patch.textDecoration = values.textDecoration;
    }
    if (
      values.textTransform !== undefined &&
      values.textTransform !==
        (layer as { textTransform?: string }).textTransform
    ) {
      patch.textTransform = values.textTransform;
    }
  }

  return patch;
}

/** Returns true if the patch has any changed fields. */
export function isPatchEmpty(patch: LayerPatch): boolean {
  return Object.keys(patch).length === 0;
}

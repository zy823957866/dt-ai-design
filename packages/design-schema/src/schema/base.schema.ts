import { z } from 'zod';

export const layerTypeSchema = z.enum([
  'rectangle',
  'ellipse',
  'text',
  'image',
  'frame',
  'group',
  'stickyNote',
  'path',
  'line',
  'componentInstance',
]);

export const blendModeSchema = z.enum([
  'normal',
  'darken',
  'multiply',
  'linearBurn',
  'colorBurn',
  'lighten',
  'screen',
  'linearDodge',
  'colorDodge',
  'overlay',
  'softLight',
  'hardLight',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
]);

export const idSchema = z.string().min(1);

export const layerPositionSchema = z.enum(['auto', 'absolute']);

export const layerMetadataSchema = z.object({
  sourceUrl: z.string().optional(),
  htmlId: z.string().optional(),
  link: z.string().optional(),
});

export const baseLayerSchema = z.object({
  id: idSchema,
  name: z.string(),
  type: layerTypeSchema,
  x: z.number(),
  y: z.number(),
  width: z.number().min(0),
  height: z.number().min(0),
  rotation: z.number(),
  opacity: z.number().min(0).max(1),
  visible: z.boolean(),
  locked: z.boolean(),
  parentId: z.string().nullable(),
  index: z.number().int().min(0),
  blendMode: blendModeSchema,
  layerPosition: layerPositionSchema,
  metadata: layerMetadataSchema.optional(),
});

export const layerBoundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().min(0),
  height: z.number().min(0),
});

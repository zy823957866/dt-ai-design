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
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'colorDodge',
  'colorBurn',
  'hardLight',
  'softLight',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
]);

export const idSchema = z.string().min(1);

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
});

export const layerBoundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().min(0),
  height: z.number().min(0),
});

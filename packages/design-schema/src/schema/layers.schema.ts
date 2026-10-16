import { z } from 'zod';
import { baseLayerSchema } from './base.schema';
import {
  fillStyleSchema,
  strokeStyleSchema,
  effectStyleSchema,
  cornerRadiusSchema,
  frameLayoutSchema,
  overflowModeSchema,
  textAlignSchema,
  textDecorationSchema,
  textSizingSchema,
  imageFitModeSchema,
  imageFiltersSchema,
  sizingModeSchema,
} from './styles.schema';

// Rectangle
export const rectangleLayerSchema = baseLayerSchema.extend({
  type: z.literal('rectangle'),
  fills: z.array(fillStyleSchema),
  strokes: z.array(strokeStyleSchema),
  cornerRadius: cornerRadiusSchema,
  effects: z.array(effectStyleSchema),
  parentId: z.string().nullable(),
  index: z.number().int().min(0),
});

// Ellipse
export const ellipseLayerSchema = baseLayerSchema.extend({
  type: z.literal('ellipse'),
  fills: z.array(fillStyleSchema),
  strokes: z.array(strokeStyleSchema),
  effects: z.array(effectStyleSchema),
  arcStartAngle: z.number(),
  arcEndAngle: z.number(),
  innerRadius: z.number().min(0),
  parentId: z.string().nullable(),
  index: z.number().int().min(0),
});

// Text
export const textLayerSchema = baseLayerSchema.extend({
  type: z.literal('text'),
  content: z.string(),
  fontFamily: z.string(),
  fontWeight: z.number().int().positive(),
  fontSize: z.number().positive(),
  lineHeight: z.number().positive(),
  letterSpacing: z.number(),
  textAlign: textAlignSchema,
  textDecoration: textDecorationSchema,
  fills: z.array(fillStyleSchema),
  strokes: z.array(strokeStyleSchema),
  sizing: textSizingSchema,
  parentId: z.string().nullable(),
  index: z.number().int().min(0),
});

// Image
export const imageLayerSchema = baseLayerSchema.extend({
  type: z.literal('image'),
  imageSrc: z.string(),
  fitMode: imageFitModeSchema,
  filters: imageFiltersSchema,
  cornerRadius: cornerRadiusSchema,
  strokes: z.array(strokeStyleSchema),
  effects: z.array(effectStyleSchema),
  parentId: z.string().nullable(),
  index: z.number().int().min(0),
});

// Frame
export const frameLayerSchema = baseLayerSchema.extend({
  type: z.literal('frame'),
  children: z.array(z.string()),
  layout: frameLayoutSchema,
  sizingMode: z
    .object({
      width: sizingModeSchema.default('fixed'),
      height: sizingModeSchema.default('fixed'),
    })
    .default({ width: 'fixed', height: 'fixed' }),
  overflow: overflowModeSchema,
  fills: z.array(fillStyleSchema),
  strokes: z.array(strokeStyleSchema),
  cornerRadius: cornerRadiusSchema,
  effects: z.array(effectStyleSchema),
  clipContent: z.boolean(),
  parentId: z.string().nullable(),
  index: z.number().int().min(0),
});

// Group
export const groupLayerSchema = baseLayerSchema.extend({
  type: z.literal('group'),
  children: z.array(z.string()),
  effects: z.array(effectStyleSchema),
  parentId: z.string().nullable(),
  index: z.number().int().min(0),
});

// Sticky Note
export const stickyNoteLayerSchema = baseLayerSchema.extend({
  type: z.literal('stickyNote'),
  content: z.string(),
  color: z.string(),
  textColor: z.string(),
  author: z.string(),
  fontSize: z.number().positive(),
  parentId: z.string().nullable(),
  index: z.number().int().min(0),
});

// Path
const pathPointSchema = z.object({
  x: z.number(),
  y: z.number(),
  handleIn: z.object({ x: z.number(), y: z.number() }).optional(),
  handleOut: z.object({ x: z.number(), y: z.number() }).optional(),
});

const fillRuleSchema = z.enum(['nonzero', 'evenodd']);

export const pathLayerSchema = baseLayerSchema.extend({
  type: z.literal('path'),
  points: z.array(pathPointSchema),
  fills: z.array(fillStyleSchema),
  strokes: z.array(strokeStyleSchema),
  effects: z.array(effectStyleSchema),
  closed: z.boolean(),
  fillRule: fillRuleSchema,
  parentId: z.string().nullable(),
  index: z.number().int().min(0),
});

// Line
const lineCapSchema = z.enum([
  'none',
  'arrow',
  'triangle',
  'circle',
  'square',
  'diamond',
]);

export const lineLayerSchema = baseLayerSchema.extend({
  type: z.literal('line'),
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
  strokes: z.array(strokeStyleSchema),
  startCap: lineCapSchema,
  endCap: lineCapSchema,
  arrowSize: z.number(),
  curveType: z.enum(['straight', 'bezier', 'step']),
  bend: z.number(),
  parentId: z.string().nullable(),
  index: z.number().int().min(0),
});

// Component Instance
export const componentInstanceLayerSchema = baseLayerSchema.extend({
  type: z.literal('componentInstance'),
  componentId: z.string().min(1),
  variantId: z.string().optional(),
  overrides: z.record(z.string(), z.unknown()),
  parentId: z.string().nullable(),
  index: z.number().int().min(0),
});

// Union (discriminated)
export const layerSchema = z.discriminatedUnion('type', [
  rectangleLayerSchema,
  ellipseLayerSchema,
  textLayerSchema,
  imageLayerSchema,
  frameLayerSchema,
  groupLayerSchema,
  stickyNoteLayerSchema,
  pathLayerSchema,
  lineLayerSchema,
  componentInstanceLayerSchema,
]);

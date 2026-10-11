import { z } from 'zod';

export const fillTypeSchema = z.enum([
  'none',
  'solid',
  'linearGradient',
  'radialGradient',
  'image',
]);

export const gradientStopSchema = z.object({
  position: z.number().min(0).max(1),
  color: z.string(),
});

export const fillStyleSchema = z.object({
  type: fillTypeSchema,
  color: z.string().optional(),
  gradientStops: z.array(gradientStopSchema).optional(),
  imageSrc: z.string().optional(),
  opacity: z.number().min(0).max(1),
});

export const strokeStyleTypeSchema = z.enum(['solid', 'dashed', 'dotted']);
export const strokePositionSchema = z.enum(['inside', 'center', 'outside']);

export const strokeStyleSchema = z.object({
  color: z.string(),
  width: z.number().min(0),
  style: strokeStyleTypeSchema,
  position: strokePositionSchema,
  opacity: z.number().min(0).max(1),
});

export const effectTypeSchema = z.enum([
  'dropShadow',
  'innerShadow',
  'blur',
  'outerGlow',
  'innerGlow',
]);

export const effectStyleSchema = z.object({
  type: effectTypeSchema,
  x: z.number().optional(),
  y: z.number().optional(),
  blur: z.number().min(0).optional(),
  spread: z.number().optional(),
  color: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export const flexDirectionSchema = z.enum([
  'row',
  'rowReverse',
  'column',
  'columnReverse',
]);
export const flexWrapSchema = z.enum(['nowrap', 'wrap', 'wrapReverse']);
export const justifyContentSchema = z.enum([
  'flexStart',
  'center',
  'flexEnd',
  'spaceBetween',
  'spaceAround',
  'spaceEvenly',
]);
export const alignItemsSchema = z.enum([
  'flexStart',
  'center',
  'flexEnd',
  'stretch',
  'baseline',
]);
export const alignContentSchema = z.enum([
  'flexStart',
  'center',
  'flexEnd',
  'spaceBetween',
  'spaceAround',
  'stretch',
]);

export const paddingSchema = z.object({
  top: z.number().min(0),
  right: z.number().min(0),
  bottom: z.number().min(0),
  left: z.number().min(0),
});

export const flexLayoutSchema = z.object({
  direction: flexDirectionSchema,
  wrap: flexWrapSchema,
  justifyContent: justifyContentSchema,
  alignItems: alignItemsSchema,
  alignContent: alignContentSchema,
  gap: z.number().min(0),
  padding: paddingSchema,
});

export const frameLayoutSchema = z.object({
  enabled: z.boolean(),
  direction: flexDirectionSchema.optional(),
  wrap: flexWrapSchema.optional(),
  justifyContent: justifyContentSchema.optional(),
  alignItems: alignItemsSchema.optional(),
  alignContent: alignContentSchema.optional(),
  gap: z.number().min(0).optional(),
  padding: paddingSchema.optional(),
});

export const cornerRadiusPerCornerSchema = z.object({
  topLeft: z.number().min(0),
  topRight: z.number().min(0),
  bottomRight: z.number().min(0),
  bottomLeft: z.number().min(0),
});

export const cornerRadiusSchema = z.union([
  z.number().min(0),
  cornerRadiusPerCornerSchema,
]);

export const textAlignSchema = z.enum(['left', 'center', 'right', 'justify']);
export const textDecorationSchema = z.enum([
  'none',
  'underline',
  'strikethrough',
]);
export const textSizingSchema = z.enum(['autoWidth', 'autoHeight', 'fixed']);

export const imageFitModeSchema = z.enum([
  'fill',
  'fit',
  'stretch',
  'tile',
  'original',
]);

export const imageFiltersSchema = z.object({
  brightness: z.number(),
  contrast: z.number(),
  saturation: z.number(),
  hue: z.number(),
  blur: z.number().min(0),
});

export const overflowModeSchema = z.enum([
  'visible',
  'hidden',
  'scroll',
  'auto',
]);
export const textTransformSchema = z.enum([
  'none',
  'uppercase',
  'lowercase',
  'capitalize',
]);

export const textOverflowSchema = z.enum(['visible', 'clip', 'ellipsis']);

export const verticalAlignSchema = z.enum(['top', 'middle', 'bottom']);

export const sizingModeSchema = z.enum([
  'fixed',
  'hugContents',
  'fillContainer',
]);

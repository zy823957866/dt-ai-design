import { z } from 'zod';
import { layerSchema } from './layers.schema';
import { normalizeDocument } from '../utils/migrate';
import type { DesignDocument } from '../types';

const designVariableSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  type: z.enum(['color', 'number', 'string', 'boolean']),
  value: z.unknown(),
  description: z.string().optional(),
});

const componentVariantSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  properties: z.record(z.string(), z.string()),
});

const componentDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string().optional(),
  layerIds: z.array(z.string()),
  variants: z.record(z.string(), componentVariantSchema).optional(),
});

const documentMetaSchema = z.object({
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export const documentSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  version: z.string(),
  layers: z.record(z.string(), layerSchema),
  rootLayerIds: z.array(z.string()),
  components: z.record(z.string(), componentDefinitionSchema),
  variables: z.record(z.string(), designVariableSchema),
  meta: documentMetaSchema,
});

/**
 * 校验文档完整性，返回成功/失败和错误列表
 */
export function validateDocument(doc: unknown): {
  success: boolean;
  errors: string[];
} {
  const result = documentSchema.safeParse(normalizeDocument(doc));
  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    );
    return { success: false, errors };
  }

  const parsed = result.data as unknown as DesignDocument;
  const errors: string[] = [];

  // rootLayerIds 引用的图层必须存在
  for (const id of parsed.rootLayerIds) {
    if (!parsed.layers[id]) {
      errors.push(`rootLayerIds 引用了不存在的图层: ${id}`);
    }
  }

  // Frame/Group 的 children 引用校验
  for (const [layerId, layer] of Object.entries(parsed.layers)) {
    if (layer.type === 'frame' || layer.type === 'group') {
      const children =
        'children' in layer ? (layer as { children: string[] }).children : [];
      for (const childId of children) {
        if (!parsed.layers[childId]) {
          errors.push(
            `图层 ${layerId} 的 children 引用了不存在的图层: ${childId}`,
          );
        }
      }
    }
  }

  // 组件引用的图层校验
  for (const [compId, comp] of Object.entries(parsed.components)) {
    for (const layerId of comp.layerIds) {
      if (!parsed.layers[layerId]) {
        errors.push(`组件 ${compId} 引用了不存在的图层: ${layerId}`);
      }
    }
  }

  return { success: errors.length === 0, errors };
}

import { emptySchema, type EditorSchema } from '@dt-ai-design/design-schema';

export type { EditorSchema } from '@dt-ai-design/design-schema';
export { emptySchema } from '@dt-ai-design/design-schema';

/**
 * 创建编辑器实例（占位实现）。
 */
export function createEditor(schema: EditorSchema = emptySchema): EditorSchema {
  return schema;
}

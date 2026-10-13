import type { DesignDocument, Layer } from '@dt-ai-design/design-schema';
import { validateDocument } from '@dt-ai-design/design-schema';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 结果校验器。
 *
 * 校验执行结果是否为合法的设计文档，以及是否满足基本质量要求。
 */
export class Validator {
  /**
   * 校验一份设计文档是否合法。
   */
  validateDocument(doc: unknown): ValidationResult {
    if (!doc || typeof doc !== 'object') {
      return {
        valid: false,
        errors: ['Result is not a valid document object'],
      };
    }

    const result = validateDocument(doc as DesignDocument);
    return { valid: result.success, errors: result.errors };
  }

  /**
   * 基础结构校验：确保有图层、尺寸合理等。
   */
  sanityCheck(doc: DesignDocument): ValidationResult {
    const errors: string[] = [];
    const layerCount = Object.keys(doc.layers ?? {}).length;

    if (layerCount === 0) {
      errors.push('Document has no layers');
    }

    if (doc.layers) {
      for (const layer of Object.values(doc.layers) as Layer[]) {
        if (layer.width > 100000 || layer.height > 100000) {
          errors.push(
            `Layer "${layer.name}" has unreasonable size (${layer.width}x${layer.height})`,
          );
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * 综合校验。
   */
  validate(doc: unknown): ValidationResult {
    const schemaCheck = this.validateDocument(doc);
    if (!schemaCheck.valid) return schemaCheck;

    const sanityCheck = this.sanityCheck(doc as DesignDocument);
    return sanityCheck;
  }
}

import type { Layer } from './layers';

/**
 * 设计变量
 */
export interface DesignVariable {
  id: string;
  name: string;
  type: 'color' | 'number' | 'string' | 'boolean';
  value: unknown;
  description?: string;
}

/**
 * 组件变体
 */
export interface ComponentVariant {
  id: string;
  name: string;
  properties: Record<string, string>;
}

/**
 * 组件定义
 */
export interface ComponentDefinition {
  id: string;
  name: string;
  description?: string;
  layerIds: string[];
  variants?: Record<string, ComponentVariant>;
}

/**
 * 文档元数据
 */
export interface DocumentMeta {
  createdAt: number;
  updatedAt: number;
}

/**
 * 设计文档根类型
 *
 * 图层使用扁平结构（Record<string, Layer>），父子关系通过 children 数组维护。
 * rootLayerIds 定义顶层图层的排序。
 */
export interface DesignDocument {
  id: string;
  name: string;
  version: string;
  layers: Record<string, Layer>;
  rootLayerIds: string[];
  components: Record<string, ComponentDefinition>;
  variables: Record<string, DesignVariable>;
  meta: DocumentMeta;
}

import type { FrameLayout } from '../types';

const DEFAULT_PADDING = { top: 0, right: 0, bottom: 0, left: 0 };

/** 把历史 FrameLayout 结构归一化为 pen.dev 单轴模型 */
export function normalizeFrameLayout(raw: unknown): FrameLayout {
  const r = (raw ?? {}) as Record<string, unknown>;
  const mode =
    r.mode === 'vertical' || r.mode === 'horizontal' || r.mode === 'none'
      ? r.mode
      : r.direction === 'row'
        ? 'horizontal'
        : r.direction === 'column'
          ? 'vertical'
          : r.enabled === true
            ? 'horizontal'
            : 'none';

  const padding =
    r.padding && typeof r.padding === 'object'
      ? { ...DEFAULT_PADDING, ...(r.padding as object) }
      : { ...DEFAULT_PADDING };

  return {
    mode,
    gap: typeof r.gap === 'number' ? r.gap : 0,
    padding,
    justifyContent:
      (r.justifyContent as FrameLayout['justifyContent']) ?? 'start',
    alignItems: (r.alignItems as FrameLayout['alignItems']) ?? 'start',
  };
}

/** 归一化整篇文档中的 frame layout（兼容旧结构） */
export function normalizeDocument<T>(doc: T): T {
  const next = JSON.parse(JSON.stringify(doc)) as {
    layers?: Record<string, { type?: string; layout?: unknown }>;
  };
  if (next.layers) {
    for (const layer of Object.values(next.layers)) {
      if (layer && layer.type === 'frame' && layer.layout != null) {
        layer.layout = normalizeFrameLayout(layer.layout);
      }
    }
  }
  return next as T;
}

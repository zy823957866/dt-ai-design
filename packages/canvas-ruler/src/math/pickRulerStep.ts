import { DEFAULT_MIN_MAJOR_STEP_PX } from '../constants';

/**
 * 刻度步长的候选有效数字数组。
 * 只使用 1 / 2 / 5 作为有效数字，保证步长是「漂亮数字」，
 * 例如 … 0.5、1、2、5、10、20、50、100 …
 * 这样生成的刻度值便于阅读和心算。
 */
const STEP_BASES = [1, 2, 5] as const;

/**
 * 根据当前缩放比例，挑选一个合适的主刻度世界坐标步长。
 *
 * 思路：
 * 1. 先把「主刻度最小像素间隔」换算成世界坐标下的最小步长（minWorldStep）。
 *    缩放越小，世界步长需要越大，才能保证屏幕上刻度不会太密。
 * 2. 通过 10 的幂次（magnitude）把 minWorldStep 压缩到 [1, 10) 数量级，
 *    再在 [1, 2, 5, 10] 中选第一个不小于 minWorldStep 的候选值。
 *
 * 示例（默认 minMajorStepPx = 56）：
 * - zoom = 1     → minWorldStep = 56   → 步长选 100
 * - zoom = 0.25  → minWorldStep = 224  → 步长选 500
 * - zoom = 4     → minWorldStep = 14   → 步长选 20
 */
export function pickRulerStep({
  zoom,
  minMajorStepPx = DEFAULT_MIN_MAJOR_STEP_PX,
}: {
  zoom: number;
  minMajorStepPx?: number;
}): number {
  const safeZoom = Math.max(zoom, Number.EPSILON);
  const minWorldStep = minMajorStepPx / safeZoom;
  const exponent = Math.floor(Math.log10(minWorldStep));
  const magnitude = 10 ** exponent;

  for (const base of STEP_BASES) {
    const candidate = base * magnitude;
    if (candidate >= minWorldStep) {
      return candidate;
    }
  }

  return 10 * magnitude;
}

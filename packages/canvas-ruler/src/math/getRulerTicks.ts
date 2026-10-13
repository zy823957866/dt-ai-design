import {
  DEFAULT_MIN_MAJOR_STEP_PX,
  DEFAULT_MINOR_DIVISIONS,
} from '../constants';
import type { RulerRenderOptions, RulerTick } from '../types';

import { pickRulerStep } from './pickRulerStep';
import { projectTickToViewport } from './projectTickToViewport';

/**
 * 将刻度值四舍五入到 4 位小数。
 * 浮点数累加（如 0.1 + 0.2）会产生精度误差，这里统一收敛，
 * 避免出现 0.30000000000000004 这类刻度值。
 */
const roundTickValue = (value: number) => Number.parseFloat(value.toFixed(4));

/**
 * 生成标尺上需要渲染的全部刻度（主刻度 + 次刻度）。
 *
 * 流程：
 * 1. 由 pickRulerStep 选出主刻度步长 majorStep；
 * 2. 把主区间按 minorDivisions 等分，得到次刻度步长 minorStep；
 * 3. 从「小于等于 worldStart 的第一个 minorStep 对齐点」开始，
 *    以 minorStep 为步长一直走到 worldEnd 之后；
 * 4. 逐个刻度：投影成视口像素偏移，剔除明显在视口外的刻度；
 * 5. 判断该刻度是否为主刻度（值接近 majorStep 的整数倍），
 *    主刻度附带数值标签，次刻度只有短线。
 *
 * @returns 按值从小到大排列的刻度数组，可直接用于渲染
 */
export function getRulerTicks({
  zoom,
  viewportSize,
  worldStart,
  worldEnd,
  minMajorStepPx = DEFAULT_MIN_MAJOR_STEP_PX,
  minorDivisions = DEFAULT_MINOR_DIVISIONS,
}: Omit<RulerRenderOptions, 'axis'> & {
  minMajorStepPx?: number;
  minorDivisions?: number;
}): RulerTick[] {
  const majorStep = pickRulerStep({ zoom, minMajorStepPx });
  const minorStep = majorStep / minorDivisions;
  const start = Math.floor(worldStart / minorStep) * minorStep;
  const end = worldEnd + minorStep;
  const ticks: RulerTick[] = [];

  for (let value = start; value <= end; value += minorStep) {
    const rounded = roundTickValue(value);
    const offset = projectTickToViewport(rounded, worldStart, zoom);

    if (
      offset < -minorStep * zoom ||
      offset > viewportSize + minorStep * zoom
    ) {
      continue;
    }

    const ratio = rounded / majorStep;
    const isMajor = Math.abs(ratio - Math.round(ratio)) < 0.0001;

    ticks.push({
      value: rounded,
      offset,
      level: isMajor ? 'major' : 'minor',
      label: isMajor ? String(Math.round(rounded)) : undefined,
    });
  }

  return ticks;
}

import type { CSSProperties } from 'react';

import { DEFAULT_RULER_THICKNESS } from '../constants';
import { getRulerTicks } from '../math/getRulerTicks';
import type { CanvasRulerProps } from '../types';

/** 拼接 CSS 类名：过滤掉空值后用空格连接。 */
const joinClassName = (...values: (string | undefined)[]) =>
  values.filter(Boolean).join(' ');

/**
 * 画布标尺组件。
 *
 * 职责：把「数学层」生成的刻度（getRulerTicks）渲染成 DOM。
 * - 水平标尺：根元素宽度 = viewportSize、高度 = thickness；
 *   刻度用 left 定位，刻度线朝下，标签以刻度线为中心水平居中。
 * - 垂直标尺：根元素宽度 = thickness、高度 = viewportSize；
 *   刻度用 top 定位，刻度线朝右，标签沿刻度线方向旋转排列。
 *
 * 该组件是「受控」的：可视范围（worldStart / worldEnd）与缩放（zoom）
 * 全部由外部（画布容器）传入，标尺只负责按参数绘制，不维护内部状态。
 */
export const CanvasRuler = ({
  axis,
  zoom,
  viewportSize,
  worldStart,
  worldEnd,
  thickness = DEFAULT_RULER_THICKNESS,
  mousePos,
  className,
}: CanvasRulerProps) => {
  const ticks = getRulerTicks({ zoom, viewportSize, worldStart, worldEnd });
  const isHorizontal = axis === 'horizontal';
  const style: CSSProperties = isHorizontal
    ? { width: `${viewportSize}px`, height: `${thickness}px` }
    : { width: `${thickness}px`, height: `${viewportSize}px` };
  const mouseIndicatorStyle: CSSProperties = isHorizontal
    ? { left: `${mousePos}px`, top: 0, bottom: 0, width: 1 }
    : { top: `${mousePos}px`, left: 0, right: 0, height: 1 };

  return (
    <div
      aria-label={isHorizontal ? 'Horizontal ruler' : 'Vertical ruler'}
      className={joinClassName('dt-canvas-ruler', className)}
      data-canvas-ruler-axis={axis}
      style={style}
    >
      {ticks.map((tick) => {
        const tickStyle: CSSProperties = isHorizontal
          ? { left: `${tick.offset}px` }
          : { top: `${tick.offset}px` };

        return (
          <div
            key={`${axis}-${tick.value}`}
            className="dt-canvas-ruler-tick"
            data-ruler-tick-level={tick.level}
            style={tickStyle}
          >
            <span
              aria-hidden="true"
              className="dt-canvas-ruler-tick-mark"
              data-ruler-tick-mark="true"
            />
            {tick.label ? (
              <span
                className={joinClassName(
                  'dt-canvas-ruler-label',
                  isHorizontal
                    ? 'dt-canvas-ruler-label-horizontal'
                    : 'dt-canvas-ruler-label-vertical',
                )}
              >
                {tick.label}
              </span>
            ) : null}
          </div>
        );
      })}
      {mousePos !== null && mousePos !== undefined ? (
        <div
          aria-hidden="true"
          className="dt-canvas-ruler-mouse-indicator"
          style={mouseIndicatorStyle}
        />
      ) : null}
    </div>
  );
};

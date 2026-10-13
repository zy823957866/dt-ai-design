import type { CSSProperties } from 'react';

import { DEFAULT_RULER_THICKNESS } from '../constants';
import type { CanvasRulerCornerProps } from '../types';

/** 拼接 CSS 类名：过滤掉空值后用空格连接。 */
const joinClassName = (...values: (string | undefined)[]) =>
  values.filter(Boolean).join(' ');

/**
 * 标尺角落方块组件。
 *
 * 画布通常同时展示水平标尺与垂直标尺，二者会在左上角交汇，
 * 形成一个 L 形缺口；该组件用一个小方块补上这个角落，
 * 视觉上与标尺融为一体（背景色、边框色与标尺一致）。
 *
 * 纯装饰组件，没有任何交互逻辑。
 */
export const CanvasRulerCorner = ({
  thickness = DEFAULT_RULER_THICKNESS,
  className,
}: CanvasRulerCornerProps) => {
  const style: CSSProperties = {
    width: `${thickness}px`,
    height: `${thickness}px`,
  };

  return (
    <div
      aria-hidden="true"
      className={joinClassName('dt-canvas-ruler-corner', className)}
      data-canvas-ruler-corner="true"
      style={style}
    />
  );
};

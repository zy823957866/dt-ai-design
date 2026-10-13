// 引入标尺样式（构建时由构建工具抽离为独立 CSS 文件，随包分发）
import './styles/ruler.css';

// 组件
export { CanvasRuler } from './components/CanvasRuler';
export { CanvasRulerCorner } from './components/CanvasRulerCorner';

// 默认常量
export {
  DEFAULT_MIN_MAJOR_STEP_PX,
  DEFAULT_MINOR_DIVISIONS,
  DEFAULT_RULER_THICKNESS,
} from './constants';

// 纯数学工具函数
export { getRulerTicks } from './math/getRulerTicks';
export { pickRulerStep } from './math/pickRulerStep';
export { projectTickToViewport } from './math/projectTickToViewport';

// 类型
export type {
  CanvasRulerCornerProps,
  CanvasRulerProps,
  RulerAxis,
  RulerRenderOptions,
  RulerTick,
  RulerTickLevel,
} from './types';

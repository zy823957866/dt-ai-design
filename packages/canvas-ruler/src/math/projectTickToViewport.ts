/**
 * 将世界坐标值投影为视口像素偏移量。
 *
 * 标尺以世界坐标系（设计稿坐标）为基准，渲染时需要用像素来定位刻度，
 * 因此需要把「世界值」换算成「相对视口起点 worldStart 的像素距离」。
 *
 * @param value      需要投影的世界坐标值
 * @param worldStart 视口起点对应的世界坐标
 * @param zoom       当前画布缩放比例（1 表示 100%）
 * @returns 该世界值在视口内的像素偏移量；当 value === worldStart 时返回 0
 */
export function projectTickToViewport(
  value: number,
  worldStart: number,
  zoom: number,
): number {
  return (value - worldStart) * zoom;
}

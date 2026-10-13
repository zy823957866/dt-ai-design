/**
 * 标尺（及角落方块）的默认厚度，单位 px。
 * 水平标尺用它作为自身高度，垂直标尺用它作为自身宽度。
 * 对齐设计稿：Top Ruler 高度 22px。
 */
export const DEFAULT_RULER_THICKNESS = 22;

/**
 * 相邻主刻度之间的最小像素间隔，单位 px。
 * 缩放级别越低（内容在屏幕上越小），主刻度的世界坐标步长会自动放大，
 * 以保证主刻度在屏幕上始终至少相隔这么远，避免刻度过于拥挤。
 */
export const DEFAULT_MIN_MAJOR_STEP_PX = 56;

/**
 * 每个主刻度区间被均分的份数，即每个主区间内的次刻度（小刻度）数量。
 * 例如 majorStep = 100、minorDivisions = 5 时，次刻度步长为 20。
 */
export const DEFAULT_MINOR_DIVISIONS = 5;

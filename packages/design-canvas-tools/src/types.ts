import type { DesignDocument } from '@dt-ai-design/design-schema';

/** 工具回执中的警告。 */
export interface CanvasWarning {
  code: string;
  message: string;
  nodeId?: string;
}

/** 传给 Insert/Copy/Replace 的节点数据（type 必填，id 会被忽略）。 */
export type CanvasNodeInput = Record<string, unknown>;

/** 失败片段的局部修补指令。 */
export interface CanvasEdit {
  find: string;
  replace: string;
  all?: boolean;
}

/** Get 的读取选项。 */
export interface GetOptions {
  /** 展开的层数；0 表示只返回该节点本身。省略表示无限层。 */
  depth?: number;
  /** 解析变量引用为计算值（预留）。 */
  resolveVariables?: boolean;
}

/** 坐标系中的包围盒。 */
export interface CanvasBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Get 访问器的上下文。 */
export interface GetContext {
  node: SerializedNode;
  parentCtx?: GetContext;
  depth: number;
  index: number;
  bounds: CanvasBounds;
  problems?: 'partially clipped' | 'fully clipped';
  skipChildren(): void;
}

export type SerializedNode = Record<string, unknown>;

export interface FindEmptySpaceInput {
  width: number;
  height: number;
  direction?: 'top' | 'right' | 'bottom' | 'left';
  padding?: number;
  nodeId?: string;
}

/** 一次 execute 的结果。 */
export interface ExecuteResult {
  ok: boolean;
  revision: number;
  refs: Record<string, string>;
  output: string[];
  warnings: CanvasWarning[];
  screenshotNodeIds: string[];
  documentChanged: boolean;
  error?: { message: string; editId: string };
}

export interface ExecuteOptions {
  edits?: CanvasEdit[];
  editId?: string;
}

/** 画布会话：持有工作副本文档与跨 execute 的全局状态。 */
export interface CanvasSession {
  document(): DesignDocument;
  revision(): number;
  placeholders(): string[];
  lastOutput: string[];
  execute(code: string, options?: ExecuteOptions): ExecuteResult;
  /** 用新的文档整体替换工作副本（用于多智能体合并），revision +1。 */
  replaceDocument(document: DesignDocument): number;
}

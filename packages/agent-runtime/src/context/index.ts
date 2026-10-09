import type { EditorSchema } from '@dt-ai-design/editor-core';

export interface AgentContext {
  sessionId: string;
  /** 当前编辑文档的时间线/数据模型快照。 */
  schema?: EditorSchema;
}

/** Agent 上下文管理（占位实现）。 */
export class AgentContextManager {
  private contexts = new Map<string, AgentContext>();

  set(context: AgentContext): void {
    this.contexts.set(context.sessionId, context);
  }

  get(sessionId: string): AgentContext | undefined {
    return this.contexts.get(sessionId);
  }
}

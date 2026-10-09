import type { AgentState } from '@dt-ai-design/agent-protocol';

/** Agent 生命周期管理（占位实现）。 */
export class AgentLifecycle {
  private states = new Map<string, AgentState>();

  start(sessionId: string): void {
    this.states.set(sessionId, {
      sessionId,
      stage: 'idle',
      updatedAt: Date.now(),
    });
  }

  getState(sessionId: string): AgentState | undefined {
    return this.states.get(sessionId);
  }
}

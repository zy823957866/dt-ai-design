import type { AgentCommand, AgentEvent } from '@dt-ai-design/agent-protocol';

/** Codex 模型适配器（占位实现）：把编排命令翻译为具体模型调用。 */
export class CodexProvider {
  async complete(command: AgentCommand): Promise<AgentEvent> {
    // TODO: 将 AgentCommand 组装为 Codex 请求，并把模型输出转成协议事件
    return {
      type: 'agent:completed',
      sessionId: command.sessionId,
      seq: 0,
      timestamp: Date.now(),
      payload: {},
    };
  }
}

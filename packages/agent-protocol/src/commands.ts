/** Agent 命令类型（协议层契约）。 */
export type AgentCommandType = 'plan' | 'execute' | 'validate' | 'cancel';

export interface AgentCommand<T = unknown> {
  type: AgentCommandType;
  sessionId: string;
  commandId: string;
  payload: T;
}

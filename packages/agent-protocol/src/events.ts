/** Agent 事件类型（协议层契约）。 */
export type AgentEventType =
  | 'agent:started'
  | 'agent:plan'
  | 'agent:step'
  | 'agent:completed'
  | 'agent:failed';

export interface AgentEvent<T = unknown> {
  type: AgentEventType;
  /** 产生事件的 Agent 会话标识。 */
  sessionId: string;
  /** 事件序号，用于保证消息顺序。 */
  seq: number;
  /** 事件产生的时间戳（ms）。 */
  timestamp: number;
  /** 事件负载。 */
  payload: T;
}

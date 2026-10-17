/** Agent 事件类型（协议层契约）。 */
export type AgentEventType =
  | 'agent:started'
  | 'agent:plan'
  | 'agent:step'
  | 'agent:message'
  | 'agent:agents'
  | 'agent:tool-call'
  | 'agent:tool-result'
  | 'agent:document'
  | 'agent:screenshot'
  | 'agent:completed'
  | 'agent:failed';

export interface AgentDescriptor {
  agentId: string;
  label?: string;
  color?: string;
  regionId?: string;
}

export interface AgentAgentsPayload {
  agents: AgentDescriptor[];
}

export interface AgentToolCallPayload {
  callId: string;
  tool: string;
  input: unknown;
  /** 多智能体：产生该调用的协作者 id。 */
  agentId?: string;
  regionId?: string;
}

export interface AgentToolResultPayload {
  callId: string;
  tool: string;
  ok: boolean;
  output?: string[];
  refs?: Record<string, string>;
  warnings?: { code: string; message: string; nodeId?: string }[];
  error?: { message: string; editId?: string };
  agentId?: string;
  regionId?: string;
}

export interface AgentDocumentPayload {
  revision: number;
  document: unknown;
}

export interface AgentScreenshotPayload {
  nodeIds: string[];
  images?: string[];
}

export interface AgentMessagePayload {
  text: string;
}

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

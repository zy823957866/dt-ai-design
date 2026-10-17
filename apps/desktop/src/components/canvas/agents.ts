/** 画布智能体的颜色与显示名（单智能体 + 多智能体协作者）。 */

export interface AgentVisual {
  name: string;
  color: string;
}

export const CANVAS_AGENT_ROSTER: Record<string, AgentVisual> = {
  designer: { name: 'Designer', color: '#7c3aed' },
  coordinator: { name: 'Coordinator', color: '#2563eb' },
  newton: { name: 'Newton', color: '#12b76a' },
  tesla: { name: 'Tesla', color: '#f79009' },
  maxwell: { name: 'Maxwell', color: '#7a5af8' },
  curie: { name: 'Curie', color: '#ee46bc' },
  faraday: { name: 'Faraday', color: '#06aed4' },
};

export const getAgentVisual = (agentId: string): AgentVisual =>
  CANVAS_AGENT_ROSTER[agentId] ?? { name: agentId, color: '#7c3aed' };

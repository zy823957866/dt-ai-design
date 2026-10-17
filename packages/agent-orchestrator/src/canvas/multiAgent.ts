/** 多智能体协作契约（区域规划 → 协作者分配）。 */

import type { CanvasGenerationPlan, CanvasRegionPlan } from './stages';

export const CANVAS_COORDINATOR_AGENT_ID = 'coordinator' as const;

export const CANVAS_COLLABORATOR_AGENTS = [
  'newton',
  'tesla',
  'maxwell',
  'curie',
  'faraday',
] as const;

export type CanvasCollaboratorAgentId =
  (typeof CANVAS_COLLABORATOR_AGENTS)[number];

export interface CanvasRegionAssignment {
  regionId: string;
  agentId: CanvasCollaboratorAgentId;
}

/** 把规划里的区域轮流分配给协作者（每个协作者至多一个区域）。 */
export const assignRegionsToAgents = (
  plan: CanvasGenerationPlan,
  agentIds: readonly CanvasCollaboratorAgentId[] = CANVAS_COLLABORATOR_AGENTS,
): CanvasRegionAssignment[] =>
  plan.regions
    .slice()
    .sort((a, b) => a.order - b.order)
    .slice(0, agentIds.length)
    .map((region, index) => ({
      regionId: region.regionId,
      agentId: agentIds[index % agentIds.length],
    }));

const DEFAULT_SECTIONS: Array<{
  id: string;
  label: string;
  objective: string;
}> = [
  { id: 'hero', label: '主视觉区', objective: 'Hero / 标题 / 主行动按钮' },
  { id: 'content', label: '内容区', objective: '主体内容、功能特性或数据展示' },
  { id: 'footer', label: '页脚区', objective: '页脚、次级导航与说明' },
];

/** 无 LLM 规划时的启发式区域规划（顺序、互不重叠的纵向分栏）。 */
export const buildHeuristicPlan = ({
  targetNodeId,
  width = 1440,
  sections = DEFAULT_SECTIONS,
}: {
  targetNodeId: string;
  width?: number;
  sections?: Array<{ id: string; label: string; objective: string }>;
}): CanvasGenerationPlan => {
  const regionHeight = 600;
  const regions: CanvasRegionPlan[] = sections.map((section, order) => ({
    regionId: section.id,
    label: section.label,
    objective: section.objective,
    targetNodeId,
    order,
    bounds: {
      x: 0,
      y: order * regionHeight,
      width,
      height: regionHeight,
    },
  }));

  return { formatVersion: 1, regions };
};

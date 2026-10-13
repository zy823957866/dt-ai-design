import type { AgentCommand } from '@dt-ai-design/agent-protocol';

export interface PlanStep {
  id: string;
  /** 步骤名称 */
  name: string;
  /** 要执行的提示词 / 指令 */
  prompt: string;
  /** 负责该步骤的 agent 角色 */
  role: 'coordinator' | 'collaborator';
  /** 依赖的其他步骤 id */
  dependsOn: string[];
  /** 目标区域描述（用于将结果定位到画布特定位置） */
  targetRegion?: string;
}

export interface GenerationPlan {
  steps: PlanStep[];
  /** 最大并发数 */
  maxConcurrency: number;
}

/**
 * 任务拆分器。
 *
 * 把一个自然语言需求拆分为多个可并行执行的子步骤。
 * 初步实现基于启发式规则；后续可替换为 LLM 规划。
 */
export class Planner {
  /** 最大协作 agent 数 */
  private maxCollaborators = 5;

  plan(command: AgentCommand): GenerationPlan {
    const prompt =
      typeof command.payload === 'string'
        ? command.payload
        : ((command.payload as { prompt?: string })?.prompt ?? '');

    // 启发式：根据需求长度和复杂度粗略拆步骤
    const steps: PlanStep[] = [];

    // Step 1: 整体结构规划
    steps.push({
      id: 'structure',
      name: '整体结构规划',
      role: 'coordinator',
      prompt: `请为以下设计需求规划整体结构和布局，给出区块划分方案：\n\n${prompt}`,
      dependsOn: [],
    });

    // Step 2: 视觉风格定义
    steps.push({
      id: 'style',
      name: '视觉风格定义',
      role: 'coordinator',
      prompt: `请为以下设计定义配色方案、字体层级和组件风格：\n\n${prompt}`,
      dependsOn: ['structure'],
    });

    // Step 3-N: 区域生成（每个区域一个 collaborator）
    // 简单起见先给 2 个区域，后续可根据 structure 步骤的结果动态扩展
    const regions = ['主内容区', '侧边栏 / 导航区'];
    for (let i = 0; i < regions.length; i++) {
      steps.push({
        id: `region-${i}`,
        name: `生成 - ${regions[i]}`,
        role: 'collaborator',
        prompt: `请基于整体结构和视觉风格，设计并生成「${regions[i]}」的详细图层：\n\n需求原文：${prompt}`,
        dependsOn: ['style'],
        targetRegion: regions[i],
      });
    }

    // 最后一步：组装 + 校验
    steps.push({
      id: 'assemble',
      name: '组装与优化',
      role: 'coordinator',
      prompt:
        '把所有区域的生成结果组装成完整的设计文档，并做一致性检查和优化。',
      dependsOn: steps
        .filter((s) => s.role === 'collaborator')
        .map((s) => s.id),
    });

    return {
      steps,
      maxConcurrency: this.maxCollaborators,
    };
  }
}

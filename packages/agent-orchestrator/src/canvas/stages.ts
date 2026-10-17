/**
 * 阶段化生成的契约与提示词（借鉴 miaoma 的多智能体流程）。
 *
 * 规划阶段先产出「设计变量」与「区域规划」，再让工具循环按区域绘制；
 * 视觉阶段用截图做检查/修复。这里提供纯函数与 JSON Schema 常量。
 */

import type { DesignVariable } from '@dt-ai-design/design-schema';

export interface CanvasDesignVariableInput {
  type: 'color' | 'number' | 'string' | 'boolean';
  value: unknown;
}

export interface CanvasRegionPlan {
  regionId: string;
  label: string;
  objective: string;
  targetNodeId: string;
  order: number;
  bounds?: { x: number; y: number; width: number; height: number };
}

export interface CanvasGenerationPlan {
  formatVersion: 1;
  regions: CanvasRegionPlan[];
}

export interface CanvasVisualIssue {
  issueId: string;
  severity: 'error' | 'warning';
  message: string;
  nodeId?: string;
  regionId?: string;
  suggestedFix?: string;
}

export interface CanvasVisualCheck {
  formatVersion: 1;
  passed: boolean;
  summary: string;
  issues: CanvasVisualIssue[];
}

export const CANVAS_MAX_PARALLEL_REGIONS = 5;

export const DESIGN_VARIABLES_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  additionalProperties: false,
  properties: {
    variables: {
      type: 'object',
      minProperties: 1,
      additionalProperties: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { enum: ['color', 'number', 'string', 'boolean'] },
          value: {},
        },
        required: ['type', 'value'],
      },
    },
  },
  required: ['variables'],
} as const;

export const DESIGN_PLAN_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  additionalProperties: false,
  properties: {
    formatVersion: { const: 1 },
    regions: {
      type: 'array',
      minItems: 1,
      maxItems: CANVAS_MAX_PARALLEL_REGIONS,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          regionId: { type: 'string', minLength: 1 },
          label: { type: 'string', minLength: 1 },
          objective: { type: 'string', minLength: 1 },
          targetNodeId: { type: 'string', minLength: 1 },
          order: { type: 'integer', minimum: 0 },
          bounds: {
            type: 'object',
            additionalProperties: false,
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
              width: { type: 'number', minimum: 0 },
              height: { type: 'number', minimum: 0 },
            },
            required: ['x', 'y', 'width', 'height'],
          },
        },
        required: ['regionId', 'label', 'objective', 'targetNodeId', 'order'],
      },
    },
  },
  required: ['formatVersion', 'regions'],
} as const;

export const DESIGN_VISUAL_CHECK_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  additionalProperties: false,
  properties: {
    formatVersion: { const: 1 },
    passed: { type: 'boolean' },
    summary: { type: 'string', minLength: 1 },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          issueId: { type: 'string', minLength: 1 },
          severity: { enum: ['error', 'warning'] },
          message: { type: 'string', minLength: 1 },
          nodeId: { type: 'string' },
          regionId: { type: 'string' },
          suggestedFix: { type: 'string' },
        },
        required: ['issueId', 'severity', 'message'],
      },
    },
  },
  required: ['formatVersion', 'passed', 'summary', 'issues'],
} as const;

export const DESIGN_REPAIR_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  additionalProperties: false,
  properties: {
    formatVersion: { const: 1 },
    repairs: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          repairId: { type: 'string', minLength: 1 },
          regionId: { type: 'string' },
          nodeIds: { type: 'array', minItems: 1, items: { type: 'string' } },
        },
        required: ['repairId', 'nodeIds'],
      },
    },
  },
  required: ['formatVersion', 'repairs'],
} as const;

export const buildVariablesPrompt = (prompt: string): string =>
  `为以下设计需求创建全局设计变量（颜色/字体/间距）。
只返回 JSON：{ "variables": { "name": { "type": "color"|"number"|"string"|"boolean", "value": ... } } }。
暂不创建任何图层。

设计需求：
${prompt}`;

export const buildPlanPrompt = ({
  prompt,
  rootNodeId,
  variableNames,
}: {
  prompt: string;
  rootNodeId: string;
  variableNames: string[];
}): string =>
  `为以下设计需求规划视觉区域。
只返回 JSON：{ "formatVersion": 1, "regions": [ { regionId, label, objective, targetNodeId, order, bounds? } ] }。
最多 ${CANVAS_MAX_PARALLEL_REGIONS} 个区域，order 从 0 连续递增，每个区域的 targetNodeId 都指向根 frame ${rootNodeId}，
为每个区域定义互不重叠的 bounds，使整页骨架在绘制前确定。

可用变量：${variableNames.join(', ') || '（无）'}
设计需求：
${prompt}`;

export const buildWorkerPrompt = ({
  prompt,
  region,
  variableNames,
}: {
  prompt: string;
  region: CanvasRegionPlan;
  variableNames: string[];
}): string =>
  `只设计被分配的区域，用 execute 工具在画布上绘制，不要改动其他区域。
区域：${region.label}
区域 id：${region.regionId}
目标 frame：${region.targetNodeId}
目标：${region.objective}
可用变量：${variableNames.join(', ') || '（无）'}

设计需求：
${prompt}

完成后对本区域调用 TakeScreenshot 自检。`;

export const buildVisualCheckPrompt = (prompt: string): string =>
  `检查附带截图中的设计。只返回 JSON：{ "formatVersion": 1, "passed": boolean, "summary": string, "issues": [...] }。
评估层级、间距、对齐、排版、对比度、溢出，以及是否满足设计需求。只报告需要修复的具体问题。

设计需求：
${prompt}`;

export const buildRepairPrompt = ({
  prompt,
  check,
}: {
  prompt: string;
  check: CanvasVisualCheck;
}): string =>
  `修复附带截图中报告的视觉问题。用 execute 工具只替换列出的 nodeId，保持 id 不变，不要改动无关区域。
当仅需修改属性时用 Update，需要整节点替换时用 Replace。

设计需求：
${prompt}

视觉问题：
${JSON.stringify(check.issues)}`;

/** 把区域规划追加到 AGENTS.md 的「本次任务」段落。 */
export const mergePlanIntoAgentsMd = (
  agentsMd: string,
  plan: CanvasGenerationPlan,
): string => {
  const lines = plan.regions
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(
      (region) =>
        `- [${region.order}] ${region.label}（id: ${region.regionId}，目标: ${region.targetNodeId}）：${region.objective}`,
    );
  return `${agentsMd}\n\n## 本次任务区域规划\n按顺序逐区域绘制，完成一个区域后立即自检：\n${lines.join(
    '\n',
  )}`;
};

export const variableNamesOf = (
  variables: Record<string, CanvasDesignVariableInput> | DesignVariable[],
): string[] =>
  Array.isArray(variables)
    ? variables.map((variable) => variable.name)
    : Object.keys(variables);

import { describe, expect, it } from 'vitest';

import {
  buildHeuristicPlan,
  assignRegionsToAgents,
  CANVAS_COLLABORATOR_AGENTS,
} from '../multiAgent';
import {
  buildPlanPrompt,
  buildVariablesPrompt,
  buildVisualCheckPrompt,
  buildWorkerPrompt,
  CANVAS_MAX_PARALLEL_REGIONS,
  DESIGN_PLAN_SCHEMA,
  mergePlanIntoAgentsMd,
  variableNamesOf,
} from '../stages';

describe('stage schemas', () => {
  it('caps the plan at the max parallel regions', () => {
    expect(
      (DESIGN_PLAN_SCHEMA.properties.regions as { maxItems: number }).maxItems,
    ).toBe(CANVAS_MAX_PARALLEL_REGIONS);
  });
});

describe('stage prompts', () => {
  it('variables prompt asks for a variables object', () => {
    expect(buildVariablesPrompt('做一个落地页')).toContain('variables');
  });

  it('plan prompt references the root frame and variables', () => {
    const prompt = buildPlanPrompt({
      prompt: 'x',
      rootNodeId: 'root_1',
      variableNames: ['accent'],
    });
    expect(prompt).toContain('root_1');
    expect(prompt).toContain('accent');
  });

  it('worker prompt scopes to the region', () => {
    const prompt = buildWorkerPrompt({
      prompt: 'x',
      region: {
        regionId: 'hero',
        label: 'Hero',
        objective: 'draw hero',
        targetNodeId: 'root_1',
        order: 0,
      },
      variableNames: [],
    });
    expect(prompt).toContain('hero');
    expect(prompt).toContain('TakeScreenshot');
  });

  it('visual check prompt requests a passed/issues report', () => {
    expect(buildVisualCheckPrompt('x')).toContain('passed');
  });
});

describe('mergePlanIntoAgentsMd', () => {
  it('appends a region section in order', () => {
    const merged = mergePlanIntoAgentsMd('# AGENTS', {
      formatVersion: 1,
      regions: [
        {
          regionId: 'b',
          label: 'B',
          objective: 'bb',
          targetNodeId: 'r',
          order: 1,
        },
        {
          regionId: 'a',
          label: 'A',
          objective: 'aa',
          targetNodeId: 'r',
          order: 0,
        },
      ],
    });
    expect(merged).toContain('本次任务区域规划');
    expect(merged.indexOf('A（')).toBeLessThan(merged.indexOf('B（'));
  });
});

describe('multi-agent plan', () => {
  it('builds a contiguous heuristic plan', () => {
    const plan = buildHeuristicPlan({ targetNodeId: 'root_1', width: 1440 });
    expect(plan.regions.map((region) => region.order)).toEqual([0, 1, 2]);
    expect(plan.regions[0].targetNodeId).toBe('root_1');
    expect(plan.regions[1].bounds).toEqual({
      x: 0,
      y: 600,
      width: 1440,
      height: 600,
    });
  });

  it('assigns each region to a distinct collaborator', () => {
    const plan = buildHeuristicPlan({ targetNodeId: 'root_1' });
    const assignments = assignRegionsToAgents(plan);
    expect(assignments).toHaveLength(3);
    expect(new Set(assignments.map((a) => a.agentId)).size).toBe(3);
    expect(CANVAS_COLLABORATOR_AGENTS).toContain(assignments[0].agentId);
  });
});

describe('variableNamesOf', () => {
  it('reads names from a record or an array', () => {
    expect(
      variableNamesOf({ accent: { type: 'color', value: '#000' } }),
    ).toEqual(['accent']);
    expect(
      variableNamesOf([
        { id: '1', name: 'accent', type: 'color', value: '#000' },
      ]),
    ).toEqual(['accent']);
  });
});

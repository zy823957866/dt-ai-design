import { AgentRun } from '@dt-ai-design/agent-runtime';
import { CodexProvider } from '@dt-ai-design/agent-provider-codex';
import type { PlanStep, GenerationPlan } from '../planner';

export interface ExecutorOptions {
  provider?: CodexProvider;
}

/**
 * 步骤执行器：根据 GenerationPlan 按依赖顺序执行步骤，支持并发。
 *
 * 执行过程中所有事件通过绑定的 AgentRun 向外转发。
 */
export class Executor {
  private provider: CodexProvider;

  constructor(options: ExecutorOptions = {}) {
    this.provider = options.provider ?? new CodexProvider();
  }

  /**
   * 执行整个计划。
   *
   * @param plan 生成计划
   * @param run  关联的 AgentRun（事件都会转发到这里）
   */
  async execute(plan: GenerationPlan, run: AgentRun): Promise<void> {
    const completed = new Set<string>();
    const stepResults = new Map<string, unknown>();
    const total = plan.steps.length;
    let done = 0;

    const isReady = (step: PlanStep) =>
      step.dependsOn.every((dep) => completed.has(dep));

    const runStep = async (step: PlanStep) => {
      run.setStage('executing', `[${done + 1}/${total}] ${step.name}`);

      const contextParts: string[] = [];
      for (const depId of step.dependsOn) {
        const dep = plan.steps.find((s: PlanStep) => s.id === depId);
        const result = stepResults.get(depId);
        if (dep && result) {
          contextParts.push(`【${dep.name}】\n${JSON.stringify(result)}`);
        }
      }
      const fullPrompt =
        contextParts.length > 0
          ? `${step.prompt}\n\n--- 已完成步骤 ---\n${contextParts.join('\n\n')}`
          : step.prompt;

      try {
        const result = await this.provider.execute({
          prompt: fullPrompt,
          cwd: process.cwd(),
          responseFormat: 'text',
          onEvent: (event) => {
            if (event.type === 'activity') {
              run.emit({
                type: 'agent:step',
                payload: { kind: 'activity', activity: event.activity },
              });
            }
          },
        });

        stepResults.set(step.id, result.text);
      } catch (err) {
        if (!run.isCancelled()) {
          run.fail(err instanceof Error ? err : String(err));
        }
        throw err;
      }

      completed.add(step.id);
      done++;
    };

    const pending = new Set<string>(plan.steps.map((s: PlanStep) => s.id));
    const running = new Set<Promise<void>>();

    while (pending.size > 0 && !run.isCancelled()) {
      const ready = plan.steps.filter(
        (s: PlanStep) => pending.has(s.id) && isReady(s),
      );

      if (ready.length === 0 && running.size === 0) {
        run.fail('Plan has circular dependencies or no executable steps');
        return;
      }

      for (const step of ready) {
        if (running.size >= plan.maxConcurrency) break;
        pending.delete(step.id);
        const p = runStep(step).catch(() => {
          // errors already reported via run.fail
        });
        running.add(p);
        void p.finally(() => running.delete(p));
      }

      if (running.size > 0) {
        await Promise.race([...running]);
      }
    }

    await Promise.all([...running]);

    if (!run.isCancelled() && run.getStage() !== 'failed') {
      run.complete({ stepResults: Object.fromEntries(stepResults) });
    }
  }
}

export { Planner } from './planner';
export type { GenerationPlan, PlanStep } from './planner';
export { Executor } from './executor';
export type { ExecutorOptions } from './executor';
export { Validator } from './validator';
export type { ValidationResult } from './validator';
export { buildDocumentPrompt, assembleDocument } from './prompt';

import type { AgentCommand } from '@dt-ai-design/agent-protocol';
import { AgentRun, type EventListener } from '@dt-ai-design/agent-runtime';
import {
  CodexExecError,
  CodexProvider,
  type CodexExecEvent,
} from '@dt-ai-design/agent-provider-codex';
import type { DesignDocument } from '@dt-ai-design/design-schema';

import { Validator } from './validator';
import { assembleDocument, buildDocumentPrompt } from './prompt';

export interface OrchestratorOptions {
  provider?: CodexProvider;
  planner?: Planner;
  executor?: Executor;
  validator?: Validator;
  /** 校验失败后的修复重试次数，默认 1（共最多 2 次 codex 调用）。 */
  maxRepairAttempts?: number;
}

export interface GenerateInput {
  prompt: string;
  document: DesignDocument;
  /** codex 子进程工作目录。 */
  cwd: string;
  model?: string;
  signal?: AbortSignal;
  /** 已有会话的 threadId；传入则 resume 续会话（多轮迭代设计）。 */
  threadId?: string;
}

export interface GenerateResult {
  document: DesignDocument;
  threadId?: string;
}

/**
 * AI 生成编排器。
 *
 * 单 Agent 整文档生成闭环：
 *   组 prompt（需求 + 当前文档 + 格式说明）
 *   → codex exec（结构化 JSON 输出，转发 bash 活动 / 消息事件）
 *   → Zod 校验
 *   → 失败则把诊断拼进 prompt 修复重跑（复用 threadId 续会话）
 */
export class Orchestrator {
  private provider: CodexProvider;
  private validator: Validator;
  private maxRepairAttempts: number;

  constructor(options: OrchestratorOptions = {}) {
    this.provider = options.provider ?? new CodexProvider();
    this.validator = options.validator ?? new Validator();
    this.maxRepairAttempts = options.maxRepairAttempts ?? 1;
  }

  /**
   * 兼容旧接口：一次生成会话。payload 需包含 { prompt, document, cwd, model? }。
   */
  async run(command: AgentCommand, onEvent?: EventListener): Promise<AgentRun> {
    const run = new AgentRun(command.sessionId);
    if (onEvent) run.onEvent(onEvent);

    run.start();

    const payload = command.payload as Partial<GenerateInput>;
    try {
      const result = await this.generateDocument(
        {
          prompt: payload.prompt ?? '',
          document: payload.document as DesignDocument,
          cwd: payload.cwd ?? process.cwd(),
          model: payload.model,
          signal: undefined,
        },
        run,
      );
      run.complete({
        document: result.document,
        threadId: result.threadId,
      });
    } catch (err) {
      if (!run.isCancelled() && run.getStage() !== 'failed') {
        run.fail(err instanceof Error ? err : String(err));
      }
    }

    return run;
  }

  /**
   * 生成 / 修复一份设计文档。
   *
   * @param input 需求与当前文档快照
   * @param run   用于转发阶段与活动事件
   */
  async generateDocument(
    input: GenerateInput,
    run: AgentRun,
  ): Promise<GenerateResult> {
    if (!input.prompt.trim()) {
      throw new Error('生成需求不能为空。');
    }

    const maxAttempts = 1 + Math.max(0, this.maxRepairAttempts);
    let lastErrors: string[] = [];
    let threadId: string | undefined = input.threadId;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (input.signal?.aborted) {
        throw new CodexExecError({
          code: 'cancelled',
          message: '生成已取消。',
        });
      }

      run.setStage(
        'executing',
        attempt === 1
          ? '正在生成设计'
          : `校验未通过，正在修复（第 ${attempt - 1} 次）`,
      );

      const result = await this.provider.execute({
        prompt: buildDocumentPrompt({
          prompt: input.prompt,
          document: input.document,
          repairErrors: attempt > 1 ? lastErrors : undefined,
        }),
        cwd: input.cwd,
        sandbox: 'workspace-write',
        conversation: threadId ? { type: 'resume', threadId } : { type: 'new' },
        model: input.model,
        responseFormat: 'json',
        signal: input.signal,
        onEvent: (event) => forwardEvent(run, event),
      });
      threadId = result.threadId;

      let candidate: DesignDocument;
      try {
        candidate = assembleDocument(input.document, result.json);
      } catch (error) {
        lastErrors = [error instanceof Error ? error.message : String(error)];
        continue;
      }

      run.setStage('validating', '正在校验生成结果');
      const verdict = this.validator.validate(candidate);
      if (verdict.valid) {
        return { document: candidate, threadId };
      }

      lastErrors = verdict.errors;
    }

    throw new Error(
      `生成结果未通过校验（已尝试 ${maxAttempts} 次）：${lastErrors
        .slice(0, 5)
        .join('；')}`,
    );
  }
}

/** 把 codex 事件转发到 AgentRun 事件总线（驱动 UI 时间线）。 */
const forwardEvent = (run: AgentRun, event: CodexExecEvent): void => {
  if (event.type === 'activity') {
    run.emit({
      type: 'agent:step',
      payload: { kind: 'activity', activity: event.activity },
    });
  } else if (event.type === 'message') {
    run.emit({
      type: 'agent:step',
      payload: { kind: 'message', text: event.text },
    });
  }
};

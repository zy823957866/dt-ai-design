import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import type { WebContents, App } from 'electron';

import { AgentRun } from '@dt-ai-design/agent-runtime';
import type { AgentEvent } from '@dt-ai-design/agent-protocol';
import {
  CodexProvider,
  type CodexActivity,
} from '@dt-ai-design/agent-provider-codex';
import { Orchestrator } from '@dt-ai-design/agent-orchestrator';
import type { DesignDocument } from '@dt-ai-design/design-schema';

import type {
  GenerationEvent,
  GenerationStage,
  GenerationStartInput,
  GenerationStartResult,
} from '../shared/ipc-types';
import { IpcGenerationChannel } from '../shared/ipc-types';

import { resolveCodexCommand } from './codexExecutable';

interface ActiveGeneration {
  runId: string;
  abort: AbortController;
}

export interface GenerationRuntimeOptions {
  command?: string;
  workspaceDir?: string;
  /** electron app 实例（便于测试注入）；默认使用 electron 的 app。 */
  app?: Pick<App, 'getPath'>;
}

/**
 * 生成运行时（main 进程）。
 *
 * - 单飞行：同时只允许一次生成
 * - 每次运行绑定一个 AbortController，取消时树杀 codex 子进程
 * - AgentRun 事件映射为 GenerationEvent，经 webContents.send 推送到渲染层
 */
export class GenerationRuntime {
  private readonly provider: CodexProvider;
  private readonly orchestrator: Orchestrator;
  private readonly workspaceDir: string;
  private active: ActiveGeneration | null = null;
  /** 项目 → 最近一次成功生成的 codex threadId（多轮会话续接）。 */
  private readonly threadIds = new Map<string, string>();

  constructor(options: GenerationRuntimeOptions = {}) {
    this.provider = new CodexProvider({
      command: options.command ?? resolveCodexCommand(),
    });
    this.orchestrator = new Orchestrator({ provider: this.provider });
    this.workspaceDir =
      options.workspaceDir ??
      path.join(options.app?.getPath('userData') ?? '', 'agent-workspace');
  }

  async start(
    sender: WebContents,
    input: GenerationStartInput,
  ): Promise<GenerationStartResult> {
    if (this.active) {
      return {
        success: false,
        error: '已有一次生成正在运行，请先停止或等待完成。',
      };
    }
    if (!input.prompt?.trim()) {
      return { success: false, error: '生成需求不能为空。' };
    }

    const runId = `run_${randomUUID().slice(0, 8)}`;
    const abort = new AbortController();
    this.active = { runId, abort };

    const publish = (event: GenerationEvent) => {
      if (!sender.isDestroyed()) {
        sender.send(IpcGenerationChannel.EVENT, event);
      }
    };

    // 后台执行，IPC 立即返回 runId
    void this.execute(input, runId, abort, publish);

    return { success: true, runId };
  }

  cancel(runId: string): boolean {
    if (!this.active || this.active.runId !== runId) return false;
    this.active.abort.abort();
    return true;
  }

  /** 丢弃项目的会话上下文，下次生成开新会话。 */
  resetThread(projectId: string): void {
    this.threadIds.delete(projectId);
  }

  private async execute(
    input: GenerationStartInput,
    runId: string,
    abort: AbortController,
    publish: (event: GenerationEvent) => void,
  ): Promise<void> {
    let revision = 0;

    try {
      await mkdir(this.workspaceDir, { recursive: true });
    } catch {
      // 工作目录创建失败时回退到 cwd
    }

    const agentRun = new AgentRun(runId);
    const unsubscribe = agentRun.onEvent((event) => {
      const mapped = this.toGenerationEvent(runId, event);
      if (mapped) publish(mapped);
    });

    try {
      const result = await this.orchestrator.generateDocument(
        {
          prompt: input.prompt,
          document: input.document,
          cwd: this.workspaceDir,
          model: input.model,
          signal: abort.signal,
          threadId: this.threadIds.get(input.projectId),
        },
        agentRun,
      );

      if (result.threadId) {
        this.threadIds.set(input.projectId, result.threadId);
      }
      revision += 1;
      publish({
        type: 'document',
        runId,
        revision,
        document: result.document as DesignDocument,
      });
      publish({ type: 'done', runId, status: 'completed' });
    } catch (error) {
      if (abort.signal.aborted) {
        publish({ type: 'done', runId, status: 'cancelled' });
      } else {
        publish({
          type: 'done',
          runId,
          status: 'failed',
          error:
            error instanceof Error ? error.message : '生成失败（未知错误）。',
        });
      }
    } finally {
      unsubscribe();
      if (this.active?.runId === runId) this.active = null;
    }
  }

  /** AgentRun 事件 → 渲染层事件。 */
  private toGenerationEvent(
    runId: string,
    event: AgentEvent,
  ): GenerationEvent | null {
    if (event.type !== 'agent:step') return null;

    const payload = event.payload as {
      kind?: string;
      stage?: string;
      currentStep?: string;
      activity?: CodexActivity;
      text?: string;
    };

    if (payload.kind === 'activity' && payload.activity) {
      return { type: 'activity', runId, activity: payload.activity };
    }
    if (payload.kind === 'message' && typeof payload.text === 'string') {
      return { type: 'message', runId, text: payload.text };
    }
    if (payload.kind === 'notice' && typeof payload.text === 'string') {
      return {
        type: 'stage',
        runId,
        stage: 'repairing',
        message: payload.text,
      };
    }
    if (payload.stage) {
      return {
        type: 'stage',
        runId,
        stage: payload.stage as GenerationStage,
        message: payload.currentStep,
      };
    }
    return null;
  }
}

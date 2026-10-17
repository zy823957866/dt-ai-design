import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import type { App, NativeImage, WebContents } from 'electron';

import {
  createCanvasSession,
  pruneEmptyLayers,
} from '@dt-ai-design/design-canvas-tools';
import {
  createDtMcpBridgeServer,
  type DtMcpBridgeServer,
} from '@dt-ai-design/dt-ai-design-mcp';
import {
  assignRegionsToAgents,
  buildCanvasWorkspace,
  buildHeuristicPlan,
  buildWorkerPrompt,
  mergeRegionDocument,
  placeRegionScaffolds,
  runCanvasAgentSession,
  type McpServerSpec,
} from '@dt-ai-design/agent-orchestrator';
import { AgentRun } from '@dt-ai-design/agent-runtime';
import type { AgentEvent } from '@dt-ai-design/agent-protocol';

import type {
  GenerationAgent,
  GenerationEvent,
  GenerationStartInput,
  GenerationStartResult,
  GenerationWarning,
} from '../shared/ipc-types';
import { IpcGenerationChannel } from '../shared/ipc-types';

import {
  createCanvasAppService,
  type CanvasScreenshot,
} from './canvasAppService';
import { createToolProvider } from './toolRegistry';

export interface CanvasAgentRuntimeOptions {
  workspaceDir?: string;
  app?: Pick<App, 'getPath' | 'getAppPath'>;
  /** MCP sidecar 启动命令；默认自动解析 node / electron-as-node。 */
  nodeCommand?: string;
}

interface ActiveRun {
  runId: string;
  abort: AbortController;
  run: AgentRun;
  bridges: DtMcpBridgeServer[];
}

type Publish = (event: GenerationEvent) => void;

const SINGLE_AGENT_ID = 'designer';

const resolveEndpoint = (userDataPath: string): string => {
  if (process.platform === 'win32') {
    const hash = createHash('sha256')
      .update(userDataPath)
      .digest('hex')
      .slice(0, 16);
    return `\\\\.\\pipe\\dt-ai-design-mcp-${hash}`;
  }
  return path.join(userDataPath, 'dt-ai-design-mcp.sock');
};

/** 解析 MCP sidecar 入口（dist/sidecar.mjs），兼容开发与打包。 */
const resolveSidecarPath = (appPath: string): string => {
  const override = process.env.DT_MCP_SIDECAR;
  if (override) return override;
  const candidates: string[] = [];
  for (const base of [appPath, process.cwd()]) {
    try {
      const requireFrom = createRequire(path.join(base, 'package.json'));
      const mainPath = requireFrom.resolve('@dt-ai-design/dt-ai-design-mcp');
      candidates.push(path.join(path.dirname(mainPath), 'sidecar.mjs'));
      candidates.push(path.join(path.dirname(mainPath), 'index.mjs'));
    } catch {
      // try next base
    }
  }
  return (
    candidates.find((candidate) => existsSync(candidate)) ?? 'dt-ai-design-mcp'
  );
};

const toGenerationEvent = (
  runId: string,
  event: AgentEvent,
): GenerationEvent | null => {
  const payload = event.payload as Record<string, unknown>;
  switch (event.type) {
    case 'agent:message':
      return { type: 'message', runId, text: String(payload.text ?? '') };
    case 'agent:agents':
      return {
        type: 'agents',
        runId,
        agents: (payload.agents as GenerationAgent[]) ?? [],
      };
    case 'agent:tool-call':
      return {
        type: 'tool-call',
        runId,
        callId: String(payload.callId ?? ''),
        tool: String(payload.tool ?? 'execute'),
        input: payload.input,
        agentId: payload.agentId as string | undefined,
        regionId: payload.regionId as string | undefined,
      };
    case 'agent:tool-result':
      return {
        type: 'tool-result',
        runId,
        callId: String(payload.callId ?? ''),
        tool: String(payload.tool ?? 'execute'),
        ok: Boolean(payload.ok),
        output: payload.output as string[] | undefined,
        refs: payload.refs as Record<string, string> | undefined,
        warnings: payload.warnings as GenerationWarning[] | undefined,
        error: payload.error as
          { message: string; editId?: string } | undefined,
        agentId: payload.agentId as string | undefined,
        regionId: payload.regionId as string | undefined,
      };
    case 'agent:document':
      return {
        type: 'document',
        runId,
        revision: Number(payload.revision ?? 0),
        document: payload.document as never,
      };
    case 'agent:screenshot':
      return {
        type: 'screenshot',
        runId,
        nodeIds: (payload.nodeIds as string[]) ?? [],
        images: payload.images as string[] | undefined,
      };
    case 'agent:step': {
      const stage = payload.stage as string | undefined;
      if (!stage) return null;
      return {
        type: 'stage',
        runId,
        stage: stage as never,
        message: payload.currentStep as string | undefined,
      };
    }
    default:
      return null;
  }
};

/**
 * 画布智能体运行时（Pencil 式工具循环）。
 *
 * - 单飞行：同时只允许一次会话
 * - 为每次会话生成 workspace（AGENTS.md/schema.md/tools.md；OpenCode 额外写 opencode.json）
 * - 启动 MCP bridge，CLI 通过注入的 MCP 配置回调 execute，运行时转为事件流
 * - `multiAgent=true` 时放置区域骨架，多个协作者并行绘制后按区域合并
 */
export class CanvasAgentRuntime {
  private readonly workspaceDir: string;
  private readonly nodeCommand: string;
  private readonly nodeEnv?: Record<string, string>;
  private readonly endpoint: string;
  private readonly sidecarPath: string;
  private active: ActiveRun | null = null;
  private readonly conversations = new Map<string, string>();

  constructor(options: CanvasAgentRuntimeOptions = {}) {
    const userData = options.app?.getPath('userData') ?? '';
    const appPath = options.app?.getAppPath?.() ?? process.cwd();
    this.workspaceDir =
      options.workspaceDir ?? path.join(userData, 'agent-workspace');
    const explicitNode = options.nodeCommand ?? process.env.DT_NODE_PATH;
    this.nodeCommand =
      explicitNode ?? (process.versions.electron ? process.execPath : 'node');
    this.nodeEnv =
      explicitNode || !process.versions.electron
        ? undefined
        : { ELECTRON_RUN_AS_NODE: '1' };
    this.endpoint = resolveEndpoint(userData);
    this.sidecarPath = resolveSidecarPath(appPath);
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
    const run = new AgentRun(runId);
    const publish: Publish = (event) => {
      if (!sender.isDestroyed()) sender.send(IpcGenerationChannel.EVENT, event);
    };
    run.onEvent((event) => {
      const mapped = toGenerationEvent(runId, event);
      if (mapped) publish(mapped);
    });

    const active: ActiveRun = { runId, abort, run, bridges: [] };
    this.active = active;
    void (input.multiAgent
      ? this.executeMultiAgent(sender, input, active, publish)
      : this.executeSingle(sender, input, active, publish));
    return { success: true, runId };
  }

  cancel(runId: string): boolean {
    if (!this.active || this.active.runId !== runId) return false;
    this.active.abort.abort();
    return true;
  }

  resetThread(projectId: string): void {
    const prefix = `${projectId}::`;
    for (const key of this.conversations.keys()) {
      if (key.startsWith(prefix)) this.conversations.delete(key);
    }
  }

  private mcpSpec(endpoint: string): McpServerSpec {
    return {
      name: 'dt-ai-design',
      command: this.nodeCommand,
      args: [this.sidecarPath, '--bridge-endpoint', endpoint],
      ...(this.nodeEnv ? { env: this.nodeEnv } : {}),
    };
  }

  private createCapture(sender: WebContents) {
    return async (): Promise<CanvasScreenshot> => {
      const image: NativeImage = await sender.capturePage();
      const { width, height } = image.getSize();
      return {
        dataUrl: `data:image/png;base64,${image.toPNG().toString('base64')}`,
        width,
        height,
        mimeType: 'image/png',
      };
    };
  }

  private async finish(
    active: ActiveRun,
    publish: Publish,
    work: (markExecute: () => void) => Promise<void>,
  ): Promise<void> {
    let sawExecute = false;
    try {
      await work(() => {
        sawExecute = true;
      });
      if (!sawExecute) {
        active.run.emitMessage(
          '⚠ 本次运行未产生任何画布工具调用（execute）。请确认 AI 工具已连接画布 MCP（OpenCode：查看运行目录的 opencode.json）。',
        );
      }
      publish({ type: 'done', runId: active.runId, status: 'completed' });
    } catch (error) {
      if (active.abort.signal.aborted) {
        publish({ type: 'done', runId: active.runId, status: 'cancelled' });
      } else {
        publish({
          type: 'done',
          runId: active.runId,
          status: 'failed',
          error:
            error instanceof Error ? error.message : '生成失败（未知错误）。',
        });
      }
    } finally {
      await Promise.all(
        active.bridges.map((bridge) => bridge.close().catch(() => undefined)),
      );
      active.bridges = [];
      if (this.active?.runId === active.runId) this.active = null;
    }
  }

  private async executeSingle(
    sender: WebContents,
    input: GenerationStartInput,
    active: ActiveRun,
    publish: Publish,
  ): Promise<void> {
    const { run, abort } = active;
    const runId = active.runId;
    const workspaceDir = path.join(this.workspaceDir, runId);
    let callSeq = 0;

    await this.finish(active, publish, async (markExecute) => {
      const spec = this.mcpSpec(this.endpoint);
      if (input.tool === 'opencode' && !existsSync(this.sidecarPath)) {
        run.emitMessage(
          `⚠ 未找到画布 MCP sidecar（${this.sidecarPath}），OpenCode 将无法调用画布工具。`,
        );
      }
      await buildCanvasWorkspace({
        dir: workspaceDir,
        opencodeMcp: input.tool === 'opencode' ? spec : undefined,
      });
      run.emitAgents({
        agents: [{ agentId: SINGLE_AGENT_ID, label: 'Designer' }],
      });

      const session = createCanvasSession(input.document);
      const service = createCanvasAppService({
        session,
        project: { id: input.projectId, title: '' },
        documentVersion: input.document.version,
        getSelection: () => null,
        captureScreenshot: this.createCapture(sender),
        onExecute: (request, result) => {
          markExecute();
          const callId = `${runId}-${callSeq++}`;
          run.emitToolCall({
            callId,
            tool: 'execute',
            input: { code: request.code, editId: request.editId },
            agentId: SINGLE_AGENT_ID,
          });
          run.emitToolResult({
            callId,
            tool: 'execute',
            ok: result.ok,
            output: result.output,
            refs: result.refs,
            warnings: result.warnings,
            error: result.error
              ? { message: result.error.message, editId: result.error.editId }
              : undefined,
            agentId: SINGLE_AGENT_ID,
          });
        },
        onDocumentChanged: (document, revision) => {
          run.emitDocument({ revision, document });
        },
      });

      active.bridges.push(
        await createDtMcpBridgeServer({
          endpoint: this.endpoint,
          handleRequest: service,
        }),
      );

      const key = `${input.projectId}::${input.tool}`;
      run.setStage('editing', '正在编辑画布');
      const result = await runCanvasAgentSession(input.prompt, {
        provider: createToolProvider(input.tool),
        tool: input.tool,
        cwd: workspaceDir,
        model: input.model,
        conversationId: this.conversations.get(key),
        signal: abort.signal,
        mcpServer: spec,
        onEvent: (event) => {
          if (event.type === 'message') run.emitMessage(event.text);
        },
      });

      if (result.conversationId)
        this.conversations.set(key, result.conversationId);

      const pruned = pruneEmptyLayers(session.document());
      if (pruned.removed.length > 0) {
        const revision = session.replaceDocument(pruned.document);
        run.emitDocument({ revision, document: session.document() });
        run.emitMessage(`已清理 ${pruned.removed.length} 个空图层`);
      }
    });
  }

  private async executeMultiAgent(
    sender: WebContents,
    input: GenerationStartInput,
    active: ActiveRun,
    publish: Publish,
  ): Promise<void> {
    const { run, abort } = active;
    const runId = active.runId;
    const workspaceDir = path.join(this.workspaceDir, runId);
    let callSeq = 0;

    await this.finish(active, publish, async (markExecute) => {
      if (input.tool === 'opencode' && !existsSync(this.sidecarPath)) {
        run.emitMessage(
          `⚠ 未找到画布 MCP sidecar（${this.sidecarPath}），OpenCode 将无法调用画布工具。`,
        );
      }
      await buildCanvasWorkspace({ dir: workspaceDir });
      const session = createCanvasSession(input.document);

      const plan = buildHeuristicPlan({ targetNodeId: 'root', width: 1440 });
      const scaffold = placeRegionScaffolds({
        document: session.document(),
        plan,
        pageWidth: 1440,
      });
      session.replaceDocument(scaffold.document);
      run.emitDocument({
        revision: session.revision(),
        document: session.document(),
      });

      const regionById = new Map(
        plan.regions.map((region) => [region.regionId, region]),
      );
      const assignments = assignRegionsToAgents(plan);
      run.emitAgents({
        agents: [
          { agentId: 'coordinator', label: 'Coordinator' },
          ...assignments.map((assignment) => ({
            agentId: assignment.agentId,
            label: regionById.get(assignment.regionId)?.label,
            regionId: assignment.regionId,
          })),
        ],
      });
      let mergeQueue = Promise.resolve();

      await Promise.all(
        assignments.map(async (assignment) => {
          const region = regionById.get(assignment.regionId);
          if (!region) return;

          const workerSession = createCanvasSession(session.document());
          const workerEndpoint = `${this.endpoint}-${assignment.agentId}`;
          const workerSpec = this.mcpSpec(workerEndpoint);
          const service = createCanvasAppService({
            session: workerSession,
            project: { id: input.projectId, title: '' },
            documentVersion: input.document.version,
            getSelection: () => null,
            captureScreenshot: this.createCapture(sender),
            onExecute: (request, result) => {
              markExecute();
              const callId = `${runId}-${assignment.agentId}-${callSeq++}`;
              run.emitToolCall({
                callId,
                tool: 'execute',
                input: { code: request.code, editId: request.editId },
                agentId: assignment.agentId,
                regionId: assignment.regionId,
              });
              run.emitToolResult({
                callId,
                tool: 'execute',
                ok: result.ok,
                output: result.output,
                refs: result.refs,
                warnings: result.warnings,
                error: result.error
                  ? {
                      message: result.error.message,
                      editId: result.error.editId,
                    }
                  : undefined,
                agentId: assignment.agentId,
                regionId: assignment.regionId,
              });
            },
          });
          const bridge = await createDtMcpBridgeServer({
            endpoint: workerEndpoint,
            handleRequest: service,
          });
          active.bridges.push(bridge);

          const workerDir = path.join(workspaceDir, assignment.agentId);
          await buildCanvasWorkspace({
            dir: workerDir,
            opencodeMcp: input.tool === 'opencode' ? workerSpec : undefined,
          });
          run.setStage(
            'editing',
            `协作者 ${assignment.agentId}：${region.label}`,
          );

          try {
            await runCanvasAgentSession(
              buildWorkerPrompt({
                prompt: input.prompt,
                region,
                variableNames: [],
              }),
              {
                provider: createToolProvider(input.tool),
                tool: input.tool,
                cwd: workerDir,
                model: input.model,
                signal: abort.signal,
                mcpServer: workerSpec,
                onEvent: (event) => {
                  if (event.type === 'message') {
                    run.emitMessage(`[${assignment.agentId}] ${event.text}`);
                  }
                },
              },
            );
          } finally {
            await bridge.close().catch(() => undefined);
          }

          mergeQueue = mergeQueue.then(() => {
            const merged = mergeRegionDocument({
              document: session.document(),
              workerDocument: workerSession.document(),
              regionId: assignment.regionId,
            });
            const revision = session.replaceDocument(merged);
            run.emitDocument({ revision, document: session.document() });
          });
          await mergeQueue;
        }),
      );

      const pruned = pruneEmptyLayers(session.document());
      if (pruned.removed.length > 0) {
        const revision = session.replaceDocument(pruned.document);
        run.emitDocument({ revision, document: session.document() });
        run.emitMessage(`已清理 ${pruned.removed.length} 个空图层`);
      }
    });
  }
}

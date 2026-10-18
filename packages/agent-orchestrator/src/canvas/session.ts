import type {
  AgentExecEvent,
  AgentProvider,
  AgentTool,
} from '@dt-ai-design/agent-provider-core';

import {
  buildCodexMcpArgs,
  buildOpencodeMcpArgs,
  type McpServerSpec,
} from './mcpConfig';
import { buildDesignRequest } from './prompts';

export interface CanvasAgentSessionOptions {
  provider: AgentProvider;
  tool: AgentTool;
  mcpServer: McpServerSpec;
  cwd: string;
  model?: string;
  conversationId?: string;
  signal?: AbortSignal;
  onEvent?: (event: AgentExecEvent) => void;
}

export interface CanvasAgentSessionResult {
  conversationId: string;
  text: string;
}

/**
 * 运行一次「画布智能体会话」。
 *
 * 工作区（AGENTS.md / schema.md / tools.md）已由 buildCanvasWorkspace 写好；
 * 这里把 MCP 服务按工具注入 CLI，并以工作区为 cwd 发起一次对话。
 * 工具调用/回执由主进程的 MCP bridge 捕获后转发到事件总线。
 */
export const runCanvasAgentSession = async (
  prompt: string,
  options: CanvasAgentSessionOptions,
): Promise<CanvasAgentSessionResult> => {
  const extraArgs =
    options.tool === 'codex'
      ? buildCodexMcpArgs(options.mcpServer)
      : buildOpencodeMcpArgs();

  const result = await options.provider.execute({
    prompt: buildDesignRequest(prompt),
    cwd: options.cwd,
    model: options.model,
    access: 'workspace-write',
    conversation: options.conversationId
      ? { type: 'resume', id: options.conversationId }
      : { type: 'new' },
    extraArgs,
    signal: options.signal,
    onEvent: options.onEvent,
  });

  return { conversationId: result.conversationId, text: result.text };
};

import { codexTool } from '@dt-ai-design/agent-provider-codex';
import { opencodeTool } from '@dt-ai-design/agent-provider-opencode';
import type {
  AgentProvider,
  AgentTool,
  AgentToolDefinition,
} from '@dt-ai-design/agent-provider-core';

import { resolveCodexCommand } from './codexExecutable';
import { resolveOpenCodeCommand } from './opencodeExecutable';

export const toolRegistry: Record<AgentTool, AgentToolDefinition> = {
  codex: codexTool,
  opencode: opencodeTool,
};

/** 各工具的可执行命令解析（供 provider 与 listModels 共用）。 */
export const resolveToolCommand = (tool: AgentTool): string =>
  tool === 'codex' ? resolveCodexCommand() : resolveOpenCodeCommand();

export const createToolProvider = (tool: AgentTool): AgentProvider =>
  toolRegistry[tool].createProvider({ command: resolveToolCommand(tool) });

export type { AgentProvider, AgentTool, AgentToolDefinition };

import type { AgentToolDefinition } from '@dt-ai-design/agent-provider-core';
import { CodexProvider } from './adapters/codex';
import { listCodexModels } from './models';

export const codexTool: AgentToolDefinition = {
  id: 'codex',
  label: 'Codex',
  createProvider: (options) => new CodexProvider(options),
  listModels: (options) => listCodexModels(options),
};

import type { AgentToolDefinition } from '@dt-ai-design/agent-provider-core';
import { OpenCodeProvider } from './adapters/opencode';
import { listOpencodeModels } from './models';

export const opencodeTool: AgentToolDefinition = {
  id: 'opencode',
  label: 'OpenCode',
  createProvider: (options) => new OpenCodeProvider(options),
  listModels: (options) => listOpencodeModels(options),
};

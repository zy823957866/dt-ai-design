import {
  spawnCli,
  readStream,
  type AgentModelInfo,
} from '@dt-ai-design/agent-provider-core';

interface RawModel {
  slug?: unknown;
  display_name?: unknown;
  visibility?: unknown;
}

export const parseCodexModels = (catalog: unknown): AgentModelInfo[] => {
  const models =
    catalog &&
    typeof catalog === 'object' &&
    Array.isArray((catalog as { models?: unknown }).models)
      ? (catalog as { models: RawModel[] }).models
      : [];
  return models
    .filter((m) => m && m.visibility === 'list' && typeof m.slug === 'string')
    .map((m) => ({
      id: String(m.slug),
      label:
        typeof m.display_name === 'string' ? m.display_name : String(m.slug),
    }));
};

export const listCodexModels = async (
  options: { command?: string } = {},
): Promise<AgentModelInfo[]> => {
  const command = options.command ?? process.env.CODEX_CLI_PATH ?? 'codex';
  const child = spawnCli(command, ['debug', 'models']);
  const out = await readStream(child.stdout, () => undefined);
  await new Promise<void>((resolve) => child.once('close', () => resolve()));
  try {
    return parseCodexModels(JSON.parse(out));
  } catch {
    return [];
  }
};

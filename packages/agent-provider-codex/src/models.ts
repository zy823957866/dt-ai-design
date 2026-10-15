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
  // 缺少 codex 时 child 会 emit 'error'；必须挂监听，否则未处理事件会拖垮宿主进程
  let spawnError: Error | undefined;
  child.once('error', (error) => {
    spawnError = error;
  });
  // 排空 stdout/stderr，避免管道写满导致子进程挂起
  const stdout = await readStream(child.stdout, () => undefined).catch(
    () => '',
  );
  await readStream(child.stderr, () => undefined).catch(() => undefined);
  await new Promise<void>((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) resolve();
    else child.once('close', () => resolve());
  });
  if (spawnError) return [];
  try {
    return parseCodexModels(JSON.parse(stdout));
  } catch {
    return [];
  }
};

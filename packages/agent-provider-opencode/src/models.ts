import {
  spawnCli,
  readStream,
  type AgentModelInfo,
} from '@dt-ai-design/agent-provider-core';

export const parseOpencodeModels = (stdout: string): AgentModelInfo[] =>
  stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('/') && !line.includes(' '))
    .map((line) => ({ id: line, label: line }));

export const listOpencodeModels = async (
  options: { command?: string } = {},
): Promise<AgentModelInfo[]> => {
  const command =
    options.command ?? process.env.OPENCODE_CLI_PATH ?? 'opencode';
  const child = spawnCli(command, ['models']);
  let spawnError: Error | undefined;
  child.once('error', (error) => {
    spawnError = error;
  });
  const stdoutResult = await Promise.allSettled([
    readStream(child.stdout, () => undefined).catch(() => ''),
    readStream(child.stderr, () => undefined).catch(() => undefined),
  ]);
  const stdout =
    stdoutResult[0].status === 'fulfilled' ? stdoutResult[0].value : '';
  await new Promise<void>((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) resolve();
    else child.once('close', () => resolve());
  });
  if (spawnError) return [];
  try {
    return parseOpencodeModels(stdout);
  } catch {
    return [];
  }
};

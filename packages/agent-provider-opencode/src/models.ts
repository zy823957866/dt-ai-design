import {
  spawnCli,
  readStream,
  waitForClose,
  type AgentModelInfo,
} from '@dt-ai-design/agent-provider-core';

const prettify = (value: string): string =>
  value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

export const parseOpencodeModels = (stdout: string): AgentModelInfo[] =>
  stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('/') && !line.includes(' '))
    .map((line) => {
      const slash = line.indexOf('/');
      const group = line.slice(0, slash);
      const name = line.slice(slash + 1);
      return {
        id: line,
        label: prettify(name),
        group,
        free: group === 'opencode' || /free/i.test(line),
      };
    });

export const listOpencodeModels = async (
  options: { command?: string } = {},
): Promise<AgentModelInfo[]> => {
  const command =
    options.command ?? process.env.OPENCODE_CLI_PATH ?? 'opencode';
  const child = spawnCli(command, ['models', '--standalone']);
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
  await waitForClose(child);
  if (spawnError) return [];
  try {
    return parseOpencodeModels(stdout);
  } catch {
    return [];
  }
};

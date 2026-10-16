import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import type { ChildProcess } from 'node:child_process';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { spawnCli } = vi.hoisted(() => ({ spawnCli: vi.fn() }));

vi.mock('@dt-ai-design/agent-provider-core', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@dt-ai-design/agent-provider-core')>();
  return { ...actual, spawnCli };
});

import { listOpencodeModels } from '../models';

const fakeChild = (stdoutText: string): ChildProcess => {
  const emitter = new EventEmitter() as unknown as ChildProcess;
  const set = (key: string, value: unknown) => {
    (emitter as unknown as Record<string, unknown>)[key] = value;
  };
  set('stdout', Readable.from([Buffer.from(stdoutText)]));
  set('stderr', Readable.from([Buffer.from('')]));
  set('stdin', null);
  set('exitCode', null);
  set('signalCode', null);
  set('pid', 4242);
  set('kill', () => undefined);
  setTimeout(() => {
    set('exitCode', 0);
    emitter.emit('close', 0, null);
  }, 0);
  return emitter;
};

describe('listOpencodeModels spawn args', () => {
  beforeEach(() => spawnCli.mockReset());

  it('runs `opencode models --standalone` so it does not touch the shared background service', async () => {
    spawnCli.mockReturnValue(fakeChild('a/b\nc/d\n'));

    const models = await listOpencodeModels({ command: 'opencode' });

    expect(spawnCli).toHaveBeenCalledWith('opencode', [
      'models',
      '--standalone',
    ]);
    expect(models.map((model) => model.id)).toEqual(['a/b', 'c/d']);
  });
});

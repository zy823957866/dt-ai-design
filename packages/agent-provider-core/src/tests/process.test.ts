import { describe, expect, it, vi, afterEach } from 'vitest';
import { resolveSpawnTarget } from '../process';

describe('resolveSpawnTarget', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('returns the command directly on non-win32', () => {
    const original = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });
    expect(resolveSpawnTarget('codex', ['exec'])).toEqual({
      file: 'codex',
      argv: ['exec'],
    });
    Object.defineProperty(process, 'platform', { value: original });
  });

  it('spawns .exe directly on win32', () => {
    const original = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });
    expect(resolveSpawnTarget('C:\\bin\\codex.exe', ['exec'])).toEqual({
      file: 'C:\\bin\\codex.exe',
      argv: ['exec'],
    });
    Object.defineProperty(process, 'platform', { value: original });
  });

  it('proxies non-exe through cmd.exe on win32', () => {
    const original = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });
    vi.stubEnv('ComSpec', 'cmd.exe');
    expect(resolveSpawnTarget('codex', ['exec'])).toEqual({
      file: 'cmd.exe',
      argv: ['/d', '/c', 'codex', 'exec'],
    });
    Object.defineProperty(process, 'platform', { value: original });
  });
});

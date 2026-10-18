import { describe, expect, it } from 'vitest';
import { listOpencodeModels, parseOpencodeModels } from '../models';

describe('parseOpencodeModels', () => {
  it('parses provider/model lines with group, pretty label and free flag', () => {
    const out = 'deepseek/deepseek-flash\nopencode/deepseek-v4.1-flash-free\n';
    expect(parseOpencodeModels(out)).toEqual([
      {
        id: 'deepseek/deepseek-flash',
        label: 'Deepseek Flash',
        group: 'deepseek',
        free: false,
      },
      {
        id: 'opencode/deepseek-v4.1-flash-free',
        label: 'Deepseek V4.1 Flash Free',
        group: 'opencode',
        free: true,
      },
    ]);
  });

  it('trims blanks and ignores malformed lines', () => {
    expect(parseOpencodeModels('\n  a/b  \nno-slash\n')).toEqual([
      { id: 'a/b', label: 'B', group: 'a', free: false },
    ]);
  });

  it('marks every opencode/ model free even without a free suffix', () => {
    expect(parseOpencodeModels('opencode/big-pickle')).toEqual([
      {
        id: 'opencode/big-pickle',
        label: 'Big Pickle',
        group: 'opencode',
        free: true,
      },
    ]);
  });
});

describe('listOpencodeModels', () => {
  it('resolves to [] when the opencode binary is missing', async () => {
    await expect(
      listOpencodeModels({ command: 'definitely-not-real-xyz-12345' }),
    ).resolves.toEqual([]);
  });
});

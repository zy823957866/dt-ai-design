import { describe, expect, it } from 'vitest';
import { listOpencodeModels, parseOpencodeModels } from '../models';

describe('parseOpencodeModels', () => {
  it('parses provider/model lines', () => {
    const out = 'deepseek/deepseek-flash\nopencode/deepseek-v4.1-flash-free\n';
    expect(parseOpencodeModels(out)).toEqual([
      { id: 'deepseek/deepseek-flash', label: 'deepseek/deepseek-flash' },
      {
        id: 'opencode/deepseek-v4.1-flash-free',
        label: 'opencode/deepseek-v4.1-flash-free',
      },
    ]);
  });

  it('trims blanks and ignores malformed lines', () => {
    expect(parseOpencodeModels('\n  a/b  \nno-slash\n')).toEqual([
      { id: 'a/b', label: 'a/b' },
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

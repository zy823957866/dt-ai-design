import { describe, expect, it } from 'vitest';
import { parseCodexModels } from '../models';

describe('parseCodexModels', () => {
  it('maps listable models to id/label and filters visibility', () => {
    const catalog = {
      models: [
        {
          slug: 'gpt-6-astra',
          display_name: 'GPT-6-Astra',
          visibility: 'list',
        },
        { slug: 'hidden-x', display_name: 'Hidden', visibility: 'hidden' },
      ],
    };
    expect(parseCodexModels(catalog)).toEqual([
      { id: 'gpt-6-astra', label: 'GPT-6-Astra' },
    ]);
  });

  it('falls back to slug when display_name missing', () => {
    expect(
      parseCodexModels({ models: [{ slug: 'x', visibility: 'list' }] }),
    ).toEqual([{ id: 'x', label: 'x' }]);
  });

  it('returns empty for malformed input', () => {
    expect(parseCodexModels(null)).toEqual([]);
    expect(parseCodexModels({})).toEqual([]);
  });
});

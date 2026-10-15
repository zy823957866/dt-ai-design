import { describe, expect, it } from 'vitest';
import { extractJson } from '../json';

describe('extractJson', () => {
  it('parses a raw JSON object', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses JSON wrapped in a markdown fence', () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('extracts the first JSON object from surrounding prose', () => {
    expect(extractJson('here you go: {"a":1} done')).toEqual({ a: 1 });
  });

  it('extracts a JSON array', () => {
    expect(extractJson('result: [1,2,3]')).toEqual([1, 2, 3]);
  });

  it('throws on invalid JSON', () => {
    expect(() => extractJson('no json here')).toThrow();
  });
});

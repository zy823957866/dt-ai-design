import { describe, it, expect } from 'vitest';
import { cornerRadiusSchema } from '../schema/styles.schema';

describe('cornerRadiusSchema', () => {
  it('accepts a uniform number', () => {
    expect(cornerRadiusSchema.parse(8)).toBe(8);
  });

  it('accepts four corners', () => {
    const v = { topLeft: 8, topRight: 0, bottomRight: 8, bottomLeft: 0 };
    expect(cornerRadiusSchema.parse(v)).toEqual(v);
  });

  it('rejects negative values', () => {
    expect(() => cornerRadiusSchema.parse(-1)).toThrow();
  });
});

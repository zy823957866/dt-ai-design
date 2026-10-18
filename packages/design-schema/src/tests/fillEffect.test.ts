import { describe, it, expect } from 'vitest';
import { FillType, EffectType } from '../types';
import { fillStyleSchema, effectTypeSchema } from '../schema/styles.schema';

describe('fill/effect extensions', () => {
  it('exposes angular and mesh gradient fill types', () => {
    expect(FillType.ANGULAR_GRADIENT).toBe('angularGradient');
    expect(FillType.MESH_GRADIENT).toBe('meshGradient');
  });

  it('accepts a shader effect type', () => {
    expect(EffectType.SHADER).toBe('shader');
    expect(effectTypeSchema.parse('shader')).toBe('shader');
  });

  it('accepts gradientType on a fill', () => {
    const fill = fillStyleSchema.parse({
      type: 'linearGradient',
      gradientType: 'angular',
      opacity: 1,
    });
    expect(fill.gradientType).toBe('angular');
  });
});

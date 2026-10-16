import { describe, it, expect } from 'vitest';
import { createLayer } from '../index';
import { BlendMode } from '../types';
import type { RectangleLayer } from '../types';

describe('BaseLayer extensions', () => {
  it('defaults layerPosition to auto', () => {
    const rect = createLayer('rectangle') as RectangleLayer;
    expect(rect.layerPosition).toBe('auto');
  });

  it('exposes 18 blend modes including linearBurn and colorDodge', () => {
    expect(BlendMode.LINEAR_BURN).toBe('linearBurn');
    expect(BlendMode.COLOR_DODGE).toBe('colorDodge');
    expect(Object.keys(BlendMode)).toHaveLength(18);
  });
});

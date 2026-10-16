import { describe, it, expect } from 'vitest';
import { createLayer } from '../index';
import type { FrameLayer } from '../types';

describe('FrameLayout (pen.dev single-axis)', () => {
  it('frame defaults to mode none with zero spacing', () => {
    const frame = createLayer('frame') as FrameLayer;
    expect(frame.layout.mode).toBe('none');
    expect(frame.layout.gap).toBe(0);
    expect(frame.layout.padding).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
    expect(frame.layout.justifyContent).toBe('start');
    expect(frame.layout.alignItems).toBe('start');
  });

  it('does not expose removed flex fields', () => {
    const frame = createLayer('frame') as FrameLayer;
    expect('enabled' in frame.layout).toBe(false);
    expect('wrap' in frame.layout).toBe(false);
    expect('alignContent' in frame.layout).toBe(false);
  });
});

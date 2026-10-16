import { describe, it, expect } from 'vitest';
import { normalizeFrameLayout } from '../utils/migrate';

describe('normalizeFrameLayout', () => {
  it('maps legacy disabled layout to mode none', () => {
    expect(normalizeFrameLayout({ enabled: false }).mode).toBe('none');
  });

  it('maps legacy row direction to horizontal', () => {
    const l = normalizeFrameLayout({ enabled: true, direction: 'row', gap: 8 });
    expect(l.mode).toBe('horizontal');
    expect(l.gap).toBe(8);
  });

  it('maps legacy column direction to vertical', () => {
    expect(
      normalizeFrameLayout({ enabled: true, direction: 'column' }).mode,
    ).toBe('vertical');
  });

  it('keeps a valid new layout as-is', () => {
    const next = normalizeFrameLayout({
      mode: 'vertical',
      gap: 4,
      padding: { top: 1, right: 2, bottom: 3, left: 4 },
      justifyContent: 'center',
      alignItems: 'end',
    });
    expect(next.mode).toBe('vertical');
    expect(next.padding).toEqual({ top: 1, right: 2, bottom: 3, left: 4 });
  });
});

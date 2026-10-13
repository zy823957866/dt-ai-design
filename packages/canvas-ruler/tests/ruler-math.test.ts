import { describe, expect, it } from 'vitest';

import { getRulerTicks } from '../src/math/getRulerTicks';
import { pickRulerStep } from '../src/math/pickRulerStep';
import { projectTickToViewport } from '../src/math/projectTickToViewport';

describe('pickRulerStep', () => {
  it('picks a nice major step for common zoom levels', () => {
    expect(pickRulerStep({ zoom: 1 })).toBe(100);
    expect(pickRulerStep({ zoom: 0.25 })).toBe(500);
    expect(pickRulerStep({ zoom: 4 })).toBe(20);
  });

  it('clamps degenerate zoom values', () => {
    expect(pickRulerStep({ zoom: 0 })).toBeGreaterThan(0);
  });
});

describe('projectTickToViewport', () => {
  it('projects a world coordinate to a viewport pixel offset', () => {
    expect(projectTickToViewport(100, 0, 1)).toBe(100);
    expect(projectTickToViewport(0, -100, 1)).toBe(100);
    expect(projectTickToViewport(50, 0, 2)).toBe(100);
  });
});

describe('getRulerTicks', () => {
  it('generates both major and minor ticks within the viewport', () => {
    const ticks = getRulerTicks({
      zoom: 1,
      viewportSize: 560,
      worldStart: 0,
      worldEnd: 560,
    });

    expect(ticks.length).toBeGreaterThan(0);

    const majors = ticks.filter((tick) => tick.level === 'major');
    const minors = ticks.filter((tick) => tick.level === 'minor');
    expect(majors.length).toBeGreaterThan(0);
    expect(minors.length).toBeGreaterThan(0);

    for (const major of majors) {
      expect(major.label).toBeDefined();
      expect(major.offset).toBeGreaterThanOrEqual(0);
      expect(major.offset).toBeLessThanOrEqual(560);
    }
  });

  it('aligns the first tick at or before worldStart when it is off-grid', () => {
    const ticks = getRulerTicks({
      zoom: 1,
      viewportSize: 100,
      worldStart: 7,
      worldEnd: 107,
    });

    expect(ticks[0].value).toBeLessThanOrEqual(7);
    const first = ticks[0].value;
    for (const tick of ticks) {
      expect((tick.value - first) % 20).toBe(0);
    }
  });

  it('returns monotonically increasing tick values', () => {
    const ticks = getRulerTicks({
      zoom: 2,
      viewportSize: 400,
      worldStart: -25,
      worldEnd: 175,
    });

    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i].value).toBeGreaterThan(ticks[i - 1].value);
    }
  });
});

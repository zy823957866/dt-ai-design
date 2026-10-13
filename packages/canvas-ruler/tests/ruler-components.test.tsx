import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CanvasRuler } from '../src/components/CanvasRuler';
import { CanvasRulerCorner } from '../src/components/CanvasRulerCorner';

describe('CanvasRuler', () => {
  it('renders a horizontal ruler with major labels', () => {
    const { container } = render(
      <CanvasRuler
        axis="horizontal"
        zoom={1}
        viewportSize={560}
        worldStart={0}
        worldEnd={560}
      />,
    );

    const root = container.querySelector(
      '[data-canvas-ruler-axis="horizontal"]',
    );
    expect(root).not.toBeNull();
    expect(root?.getAttribute('aria-label')).toBe('Horizontal ruler');

    const majors = container.querySelectorAll(
      '[data-ruler-tick-level="major"]',
    );
    expect(majors.length).toBeGreaterThan(0);
    expect(majors[0].textContent).toMatch(/^\d+$/);
  });

  it('renders a vertical ruler with rotated labels', () => {
    const { container } = render(
      <CanvasRuler
        axis="vertical"
        zoom={1}
        viewportSize={560}
        worldStart={0}
        worldEnd={560}
      />,
    );

    const root = container.querySelector('[data-canvas-ruler-axis="vertical"]');
    expect(root).not.toBeNull();
    expect(root?.getAttribute('aria-label')).toBe('Vertical ruler');

    const labels = container.querySelectorAll(
      '.dt-canvas-ruler-label-vertical',
    );
    expect(labels.length).toBeGreaterThan(0);
  });

  it('renders the mouse indicator when mousePos is provided', () => {
    const { container } = render(
      <CanvasRuler
        axis="horizontal"
        zoom={1}
        viewportSize={560}
        worldStart={0}
        worldEnd={560}
        mousePos={123}
      />,
    );

    const indicator = container.querySelector(
      '.dt-canvas-ruler-mouse-indicator',
    );
    expect(indicator).not.toBeNull();
    expect((indicator as HTMLElement).style.left).toBe('123px');
  });

  it('omits the mouse indicator when mousePos is null', () => {
    const { container } = render(
      <CanvasRuler
        axis="horizontal"
        zoom={1}
        viewportSize={560}
        worldStart={0}
        worldEnd={560}
        mousePos={null}
      />,
    );

    expect(
      container.querySelector('.dt-canvas-ruler-mouse-indicator'),
    ).toBeNull();
  });
});

describe('CanvasRulerCorner', () => {
  it('renders a square with the default thickness', () => {
    const { container } = render(<CanvasRulerCorner />);

    const corner = container.querySelector('[data-canvas-ruler-corner="true"]');
    expect(corner).not.toBeNull();
    expect((corner as HTMLElement).style.width).toBe('22px');
    expect((corner as HTMLElement).style.height).toBe('22px');
  });
});

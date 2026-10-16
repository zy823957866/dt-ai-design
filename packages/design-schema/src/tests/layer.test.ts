import { describe, it, expect } from 'vitest';
import { createLayer, cloneLayer, getLayerBounds } from '../index';
import type {
  RectangleLayer,
  EllipseLayer,
  TextLayer,
  FrameLayer,
  GroupLayer,
  StickyNoteLayer,
  PathLayer,
  LineLayer,
  ComponentInstanceLayer,
  Layer,
} from '../types';

describe('createLayer', () => {
  it('creates a rectangle with defaults', () => {
    const rect = createLayer('rectangle') as RectangleLayer;
    expect(rect.id).toBeTruthy();
    expect(rect.name).toMatch(/^Rectangle \d+$/);
    expect(rect.type).toBe('rectangle');
    expect(rect.x).toBe(100);
    expect(rect.y).toBe(100);
    expect(rect.width).toBe(100);
    expect(rect.height).toBe(100);
    expect(rect.rotation).toBe(0);
    expect(rect.opacity).toBe(1);
    expect(rect.visible).toBe(true);
    expect(rect.locked).toBe(false);
    expect(rect.fills).toHaveLength(1);
    expect(rect.strokes).toHaveLength(0);
    expect(rect.cornerRadius).toBe(0);
    expect(rect.effects).toHaveLength(0);
  });

  it('creates a rectangle with custom props', () => {
    const rect = createLayer('rectangle', {
      x: 10,
      y: 20,
      width: 200,
      height: 100,
    }) as RectangleLayer;
    expect(rect.x).toBe(10);
    expect(rect.y).toBe(20);
    expect(rect.width).toBe(200);
    expect(rect.height).toBe(100);
  });

  it('creates an ellipse', () => {
    const ellipse = createLayer('ellipse') as EllipseLayer;
    expect(ellipse.type).toBe('ellipse');
    expect(ellipse.fills).toHaveLength(1);
  });

  it('creates a text layer', () => {
    const text = createLayer('text') as TextLayer;
    expect(text.type).toBe('text');
    expect(text.content).toBe('Text');
    expect(text.fontFamily).toBe('Inter');
    expect(text.fontSize).toBe(16);
    expect(text.textAlign).toBe('left');
  });

  it('creates a frame', () => {
    const frame = createLayer('frame') as FrameLayer;
    expect(frame.type).toBe('frame');
    expect(frame.children).toEqual([]);
    expect(frame.layout.mode).toBe('none');
    expect(frame.overflow).toBe('visible');
  });

  it('creates a group', () => {
    const group = createLayer('group') as GroupLayer;
    expect(group.type).toBe('group');
    expect(group.children).toEqual([]);
  });

  it('creates a sticky note', () => {
    const note = createLayer('stickyNote') as StickyNoteLayer;
    expect(note.type).toBe('stickyNote');
    expect(note.color).toBe('#FBBF24');
    expect(note.content).toBe('');
  });

  it('creates a path', () => {
    const path = createLayer('path') as PathLayer;
    expect(path.type).toBe('path');
    expect(path.points).toEqual([]);
    expect(path.fillRule).toBe('nonzero');
  });

  it('creates a line', () => {
    const line = createLayer('line') as LineLayer;
    expect(line.type).toBe('line');
    expect(line.x1).toBe(0);
    expect(line.y1).toBe(0);
    expect(line.x2).toBe(100);
    expect(line.y2).toBe(100);
    expect(line.startCap).toBe('none');
    expect(line.endCap).toBe('none');
  });

  it('creates a component instance', () => {
    const inst = createLayer('componentInstance', {
      componentId: 'comp_123',
    }) as ComponentInstanceLayer;
    expect(inst.type).toBe('componentInstance');
    expect(inst.componentId).toBe('comp_123');
    expect(inst.overrides).toEqual({});
  });

  it('generates unique ids', () => {
    const a = createLayer('rectangle');
    const b = createLayer('rectangle');
    expect(a.id).not.toBe(b.id);
  });
});

describe('cloneLayer', () => {
  it('clones a layer with new id and name suffix', () => {
    const rect = createLayer('rectangle', { name: 'MyRect' }) as RectangleLayer;
    const cloned = cloneLayer(rect) as RectangleLayer;
    expect(cloned.id).not.toBe(rect.id);
    expect(cloned.name).toBe('MyRect copy');
    expect(cloned.x).toBe(rect.x);
    expect(cloned.width).toBe(rect.width);
  });

  it('deep clones properties', () => {
    const rect = createLayer('rectangle') as RectangleLayer;
    const cloned = cloneLayer(rect) as RectangleLayer;
    expect(cloned.fills).not.toBe(rect.fills);
    expect(cloned.fills[0].color).toBe(rect.fills[0].color);
  });
});

describe('getLayerBounds', () => {
  it('returns correct bounds', () => {
    const rect = createLayer('rectangle', {
      x: 10,
      y: 20,
      width: 100,
      height: 50,
    });
    const bounds = getLayerBounds(rect as Layer);
    expect(bounds).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });
});

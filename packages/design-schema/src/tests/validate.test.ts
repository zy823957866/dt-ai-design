import { describe, it, expect } from 'vitest';
import { createDocument, createLayer, validateDocument } from '../index';
import type { FrameLayer, RectangleLayer } from '../types';

describe('validateDocument', () => {
  it('validates a correct document', () => {
    const doc = createDocument('Test');
    const rect = createLayer('rectangle');
    doc.layers[rect.id] = rect;
    doc.rootLayerIds.push(rect.id);

    const result = validateDocument(doc);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validates empty document', () => {
    const doc = createDocument();
    const result = validateDocument(doc);
    expect(result.success).toBe(true);
  });

  it('fails when rootLayerIds references missing layer', () => {
    const doc = createDocument();
    doc.rootLayerIds.push('nonexistent');

    const result = validateDocument(doc);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('nonexistent');
  });

  it('fails when frame children references missing layer', () => {
    const doc = createDocument();
    const frame = createLayer('frame') as FrameLayer;
    frame.children.push('missing-child');
    doc.layers[frame.id] = frame;
    doc.rootLayerIds.push(frame.id);

    const result = validateDocument(doc);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('missing-child');
  });

  it('rejects invalid layer type', () => {
    const doc = createDocument();
    const badLayer = {
      id: 'bad',
      name: 'Bad',
      type: 'invalidType',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      blendMode: 'normal',
    };
    doc.layers['bad'] = badLayer as never;
    doc.rootLayerIds.push('bad');

    const result = validateDocument(doc);
    expect(result.success).toBe(false);
  });

  it('rejects layer with negative width', () => {
    const doc = createDocument();
    const rect = createLayer('rectangle', { width: -10 });
    doc.layers[rect.id] = rect;
    doc.rootLayerIds.push(rect.id);

    const result = validateDocument(doc);
    expect(result.success).toBe(false);
  });

  it('rejects layer with opacity out of range', () => {
    const doc = createDocument();
    const rect = createLayer('rectangle', { opacity: 2 });
    doc.layers[rect.id] = rect;
    doc.rootLayerIds.push(rect.id);

    const result = validateDocument(doc);
    expect(result.success).toBe(false);
  });

  it('validates nested frame hierarchy', () => {
    const doc = createDocument();
    const outer = createLayer('frame', { name: 'Outer' }) as FrameLayer;
    const inner = createLayer('frame', { name: 'Inner' }) as FrameLayer;
    const rect = createLayer('rectangle', {
      name: 'Inner Rect',
    }) as RectangleLayer;

    outer.children = [inner.id];
    inner.children = [rect.id];

    doc.layers[outer.id] = outer;
    doc.layers[inner.id] = inner;
    doc.layers[rect.id] = rect;
    doc.rootLayerIds = [outer.id];

    const result = validateDocument(doc);
    expect(result.success).toBe(true);
  });

  it('validates document with components and variables', () => {
    const doc = createDocument();
    const rect = createLayer('rectangle');
    doc.layers[rect.id] = rect;
    doc.rootLayerIds.push(rect.id);

    doc.components['comp1'] = {
      id: 'comp1',
      name: 'My Component',
      layerIds: [rect.id],
    };

    doc.variables['var1'] = {
      id: 'var1',
      name: 'Primary Color',
      type: 'color',
      value: '#7C3AED',
    };

    const result = validateDocument(doc);
    expect(result.success).toBe(true);
  });
});

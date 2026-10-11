import { describe, it, expect } from 'vitest';
import { createDocument, createLayer, findLayerById } from '../index';

describe('createDocument', () => {
  it('creates an empty document with default name', () => {
    const doc = createDocument();
    expect(doc.id).toBeTruthy();
    expect(doc.name).toBe('Untitled');
    expect(doc.version).toBe('1.0.0');
    expect(Object.keys(doc.layers)).toHaveLength(0);
    expect(doc.rootLayerIds).toHaveLength(0);
    expect(Object.keys(doc.components)).toHaveLength(0);
    expect(Object.keys(doc.variables)).toHaveLength(0);
    expect(doc.meta.createdAt).toBeGreaterThan(0);
    expect(doc.meta.updatedAt).toEqual(doc.meta.createdAt);
  });

  it('creates a document with custom name', () => {
    const doc = createDocument('My Design');
    expect(doc.name).toBe('My Design');
  });
});

describe('findLayerById', () => {
  it('finds a layer by id', () => {
    const doc = createDocument();
    const rect = createLayer('rectangle', { x: 50, y: 50 });
    doc.layers[rect.id] = rect;
    doc.rootLayerIds.push(rect.id);

    const found = findLayerById(doc, rect.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(rect.id);
    expect(found?.x).toBe(50);
  });

  it('returns undefined for missing id', () => {
    const doc = createDocument();
    expect(findLayerById(doc, 'nonexistent')).toBeUndefined();
  });
});

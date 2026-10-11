import { describe, it, expect } from 'vitest';
import {
  createDocument,
  createLayer,
  traverseLayers,
  mapLayers,
  filterLayers,
  findParentId,
} from '../index';
import type { DesignDocument, FrameLayer, GroupLayer } from '../types';

function buildDocWithHierarchy(): DesignDocument {
  const doc = createDocument();
  const frame = createLayer('frame', { name: 'Frame 1' }) as FrameLayer;
  const rect1 = createLayer('rectangle', { name: 'Rect 1' });
  const rect2 = createLayer('rectangle', { name: 'Rect 2' });
  const group = createLayer('group', { name: 'Group 1' }) as GroupLayer;
  const text = createLayer('text', { name: 'Text 1' });

  frame.children = [rect1.id, group.id];
  group.children = [rect2.id, text.id];

  doc.layers[frame.id] = frame;
  doc.layers[rect1.id] = rect1;
  doc.layers[rect2.id] = rect2;
  doc.layers[group.id] = group;
  doc.layers[text.id] = text;
  doc.rootLayerIds = [frame.id];

  return doc;
}

describe('traverseLayers', () => {
  it('traverses in depth-first order', () => {
    const doc = buildDocWithHierarchy();
    const names: string[] = [];

    traverseLayers(doc, (layer) => {
      names.push(layer.name);
    });

    expect(names).toEqual(['Frame 1', 'Rect 1', 'Group 1', 'Rect 2', 'Text 1']);
  });

  it('provides parentId for each layer', () => {
    const doc = buildDocWithHierarchy();
    const parentMap: Record<string, string | null> = {};

    traverseLayers(doc, (layer, parentId) => {
      parentMap[layer.name] = parentId;
    });

    const frameId = doc.rootLayerIds[0];
    const frame = doc.layers[frameId] as FrameLayer;
    const groupId = frame.children[1];

    expect(parentMap['Frame 1']).toBeNull();
    expect(parentMap['Rect 1']).toBe(frameId);
    expect(parentMap['Group 1']).toBe(frameId);
    expect(parentMap['Rect 2']).toBe(groupId);
    expect(parentMap['Text 1']).toBe(groupId);
  });

  it('handles empty document', () => {
    const doc = createDocument();
    const names: string[] = [];
    traverseLayers(doc, (l) => names.push(l.name));
    expect(names).toHaveLength(0);
  });
});

describe('mapLayers', () => {
  it('maps all layers', () => {
    const doc = buildDocWithHierarchy();
    const mapped = mapLayers(doc, (layer) => ({
      ...layer,
      name: layer.name.toUpperCase(),
    }));

    const names = Object.values(mapped)
      .map((l) => l.name)
      .sort();
    expect(names).toEqual(['FRAME 1', 'GROUP 1', 'RECT 1', 'RECT 2', 'TEXT 1']);
  });
});

describe('filterLayers', () => {
  it('filters by predicate', () => {
    const doc = buildDocWithHierarchy();
    const rectangles = filterLayers(doc, (layer) => layer.type === 'rectangle');

    expect(rectangles).toHaveLength(2);
    expect(rectangles.every((l) => l.type === 'rectangle')).toBe(true);
  });
});

describe('findParentId', () => {
  it('finds parent of nested layer', () => {
    const doc = buildDocWithHierarchy();
    const frameId = doc.rootLayerIds[0];
    const frame = doc.layers[frameId] as FrameLayer;
    const groupId = frame.children[1];
    const group = doc.layers[groupId] as GroupLayer;
    const rect1Id = frame.children[0];
    const textId = group.children[1];

    expect(findParentId(doc, rect1Id)).toBe(frameId);
    expect(findParentId(doc, textId)).toBe(groupId);
  });

  it('returns null for root layer', () => {
    const doc = buildDocWithHierarchy();
    expect(findParentId(doc, doc.rootLayerIds[0])).toBeNull();
  });

  it('returns null for missing layer', () => {
    const doc = createDocument();
    expect(findParentId(doc, 'missing')).toBeNull();
  });
});

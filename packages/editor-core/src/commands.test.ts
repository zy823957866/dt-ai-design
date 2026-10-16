import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDocument,
  type FrameLayer,
  type GroupLayer,
} from '@dt-ai-design/design-schema';
import { createEditorState } from './state';
import {
  addLayer,
  removeLayer,
  moveLayer,
  resizeLayer,
  setLayerProperty,
  setSelection,
  groupSelection,
  ungroupSelection,
  frameSelection,
  duplicateLayer,
  reorderLayer,
} from './commands';
import {
  getSelectedLayers,
  getSelectedBounds,
  selectAll,
  deselectAll,
} from './selection';
import { zoomIn, zoomOut, zoomTo, pan } from './viewport';
import { CommandStack } from './command';
import type { EditorState } from './types';

describe('editor-core', () => {
  let state: EditorState;

  beforeEach(() => {
    state = createEditorState(createDocument('Test'));
  });

  describe('addLayer', () => {
    it('adds a rectangle layer to root', () => {
      const result = addLayer(state, 'rectangle');
      const layerIds = Object.keys(result.document.layers);
      expect(layerIds).toHaveLength(1);
      expect(result.document.rootLayerIds).toHaveLength(1);
      expect(result.selection.layerIds).toHaveLength(1);
      expect(result.document.layers[layerIds[0]].type).toBe('rectangle');
    });

    it('adds layer inside a frame', () => {
      const frameResult = addLayer(state, 'frame');
      const frameId = frameResult.selection.layerIds[0];
      state.document = frameResult.document;

      const rectResult = addLayer(state, 'rectangle', undefined, frameId);
      const frame = rectResult.document.layers[frameId] as FrameLayer;
      expect(frame.children).toHaveLength(1);
      expect(rectResult.document.layers[frame.children[0]].parentId).toBe(
        frameId,
      );
    });
  });

  describe('removeLayer', () => {
    it('removes a layer', () => {
      const added = addLayer(state, 'rectangle');
      state.document = added.document;
      const layerId = added.selection.layerIds[0];

      const result = removeLayer(state, [layerId]);
      expect(Object.keys(result.document.layers)).toHaveLength(0);
      expect(result.document.rootLayerIds).toHaveLength(0);
    });

    it('removes frame and its children', () => {
      const frameResult = addLayer(state, 'frame');
      const frameId = frameResult.selection.layerIds[0];
      state.document = frameResult.document;

      const rectResult = addLayer(state, 'rectangle', undefined, frameId);
      state.document = rectResult.document;

      const result = removeLayer(state, [frameId]);
      expect(Object.keys(result.document.layers)).toHaveLength(0);
    });
  });

  describe('moveLayer', () => {
    it('moves a layer to new position', () => {
      const added = addLayer(state, 'rectangle');
      state.document = added.document;
      const id = added.selection.layerIds[0];

      const doc = moveLayer(state, id, 50, 60);
      expect(doc.layers[id].x).toBe(50);
      expect(doc.layers[id].y).toBe(60);
    });
  });

  describe('resizeLayer', () => {
    it('resizes a layer', () => {
      const added = addLayer(state, 'rectangle');
      state.document = added.document;
      const id = added.selection.layerIds[0];

      const doc = resizeLayer(state, id, 200, 150);
      expect(doc.layers[id].width).toBe(200);
      expect(doc.layers[id].height).toBe(150);
    });

    it('clamps negative size to 0', () => {
      const added = addLayer(state, 'rectangle');
      state.document = added.document;
      const id = added.selection.layerIds[0];

      const doc = resizeLayer(state, id, -10, -20);
      expect(doc.layers[id].width).toBe(0);
      expect(doc.layers[id].height).toBe(0);
    });
  });

  describe('setLayerProperty', () => {
    it('sets an arbitrary property', () => {
      const added = addLayer(state, 'rectangle');
      state.document = added.document;
      const id = added.selection.layerIds[0];

      const doc = setLayerProperty(state, id, 'name', 'My Rect');
      expect(doc.layers[id].name).toBe('My Rect');
    });
  });

  describe('selection', () => {
    it('setSelection updates selection', () => {
      const sel = setSelection(state, ['a', 'b']);
      expect(sel.layerIds).toEqual(['a', 'b']);
    });

    it('selectAll selects all layers', () => {
      const r1 = addLayer(state, 'rectangle');
      state.document = r1.document;
      const r2 = addLayer(state, 'ellipse');
      state.document = r2.document;

      const sel = selectAll(state);
      expect(sel.layerIds).toHaveLength(2);
    });

    it('deselectAll clears selection', () => {
      const sel = deselectAll(state);
      expect(sel.layerIds).toHaveLength(0);
    });

    it('getSelectedLayers returns selected layer objects', () => {
      const added = addLayer(state, 'rectangle');
      state.document = added.document;
      state.selection = added.selection;

      const layers = getSelectedLayers(state);
      expect(layers).toHaveLength(1);
      expect(layers[0].type).toBe('rectangle');
    });

    it('getSelectedBounds computes bounding box', () => {
      const r1 = addLayer(state, 'rectangle', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      state.document = r1.document;
      const id1 = r1.selection.layerIds[0];

      const r2 = addLayer(state, 'ellipse', {
        x: 50,
        y: 50,
        width: 100,
        height: 100,
      });
      state.document = r2.document;
      const id2 = r2.selection.layerIds[0];

      state.selection = { layerIds: [id1, id2] };

      const bounds = getSelectedBounds(state);
      expect(bounds).toEqual({ x: 0, y: 0, width: 150, height: 150 });
    });
  });

  describe('viewport', () => {
    it('zoomIn increases zoom by 1.25x', () => {
      const vp = zoomIn(state);
      expect(vp.zoom).toBeCloseTo(1.25);
    });

    it('zoomOut decreases zoom by 0.8x', () => {
      const vp = zoomOut(state);
      expect(vp.zoom).toBeCloseTo(0.8);
    });

    it('zoomTo clamps to valid range', () => {
      const vp = zoomTo(state, 100);
      expect(vp.zoom).toBeLessThanOrEqual(32);
    });

    it('pan adds delta to pan values', () => {
      const vp = pan(state, 10, 20);
      expect(vp.panX).toBe(10);
      expect(vp.panY).toBe(20);
    });
  });

  describe('group / ungroup', () => {
    it('groups two selected layers', () => {
      const r1 = addLayer(state, 'rectangle', {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
      });
      state.document = r1.document;
      const id1 = r1.selection.layerIds[0];

      const r2 = addLayer(state, 'ellipse', {
        x: 50,
        y: 50,
        width: 50,
        height: 50,
      });
      state.document = r2.document;
      const id2 = r2.selection.layerIds[0];

      state.selection = { layerIds: [id1, id2] };

      const result = groupSelection(state);
      const groupId = result.selection.layerIds[0];
      const group = result.document.layers[groupId];

      expect(group.type).toBe('group');
      expect(group.x).toBe(0);
      expect(group.y).toBe(0);
      expect(group.width).toBe(100);
      expect(group.height).toBe(100);
      expect((group as GroupLayer).children).toHaveLength(2);
      expect(result.document.rootLayerIds).toContain(groupId);
    });

    it('ungroup restores children to parent', () => {
      // First group
      const r1 = addLayer(state, 'rectangle', {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
      });
      state.document = r1.document;
      const id1 = r1.selection.layerIds[0];

      const r2 = addLayer(state, 'ellipse', {
        x: 50,
        y: 50,
        width: 50,
        height: 50,
      });
      state.document = r2.document;
      const id2 = r2.selection.layerIds[0];

      state.selection = { layerIds: [id1, id2] };
      const grouped = groupSelection(state);
      state.document = grouped.document;
      state.selection = grouped.selection;

      // Then ungroup
      const result = ungroupSelection(state);
      expect(result.selection.layerIds).toHaveLength(2);
      expect(result.document.rootLayerIds).toHaveLength(2);
      expect(Object.keys(result.document.layers)).toHaveLength(2);
    });
  });

  describe('frameSelection', () => {
    it('wraps selected layers in a frame', () => {
      const r1 = addLayer(state, 'rectangle', {
        x: 10,
        y: 20,
        width: 50,
        height: 50,
      });
      state.document = r1.document;
      const id1 = r1.selection.layerIds[0];

      state.selection = { layerIds: [id1] };
      const result = frameSelection(state);
      const frameId = result.selection.layerIds[0];
      const frame = result.document.layers[frameId] as FrameLayer;

      expect(frame.type).toBe('frame');
      expect(frame.x).toBe(10);
      expect(frame.y).toBe(20);
      expect(frame.width).toBe(50);
      expect(frame.height).toBe(50);
      expect(frame.children).toContain(id1);
    });
  });

  describe('duplicateLayer', () => {
    it('duplicates a layer with offset', () => {
      const added = addLayer(state, 'rectangle', { x: 10, y: 20 });
      state.document = added.document;
      const id = added.selection.layerIds[0];

      const result = duplicateLayer(state, [id]);
      expect(Object.keys(result.document.layers)).toHaveLength(2);

      const newId = result.selection.layerIds[0];
      const newLayer = result.document.layers[newId];
      expect(newLayer.x).toBe(30);
      expect(newLayer.y).toBe(40);
    });

    it('duplicates frame with children', () => {
      const frameResult = addLayer(state, 'frame');
      state.document = frameResult.document;
      const frameId = frameResult.selection.layerIds[0];

      const rectResult = addLayer(state, 'rectangle', undefined, frameId);
      state.document = rectResult.document;

      const result = duplicateLayer(state, [frameId]);
      const newFrameId = result.selection.layerIds[0];
      const newFrame = result.document.layers[newFrameId] as FrameLayer;

      expect(newFrame.children).toHaveLength(1);
      expect(Object.keys(result.document.layers)).toHaveLength(4); // 2 frames + 2 rects
    });
  });

  describe('reorderLayer', () => {
    it('reorders siblings within the same parent', () => {
      const a = addLayer(state, 'rectangle');
      state.document = a.document;
      const idA = a.selection.layerIds[0];

      const b = addLayer(state, 'rectangle');
      state.document = b.document;
      const idB = b.selection.layerIds[0];

      const c = addLayer(state, 'rectangle');
      state.document = c.document;
      const idC = c.selection.layerIds[0];

      // order: A, B, C -> move C to the front (index 0)
      const doc = reorderLayer(state, idC, null, 0);
      expect(doc.rootLayerIds).toEqual([idC, idA, idB]);
      expect(doc.layers[idC].index).toBe(0);
      expect(doc.layers[idA].index).toBe(1);
      expect(doc.layers[idB].index).toBe(2);
    });

    it('moves a layer after a sibling', () => {
      const a = addLayer(state, 'rectangle');
      state.document = a.document;
      const idA = a.selection.layerIds[0];

      const b = addLayer(state, 'rectangle');
      state.document = b.document;
      const idB = b.selection.layerIds[0];

      // order: A, B -> move A after B
      const doc = reorderLayer(state, idA, null, 2);
      expect(doc.rootLayerIds).toEqual([idB, idA]);
    });

    it('reparents a layer into a frame', () => {
      const frameResult = addLayer(state, 'frame');
      state.document = frameResult.document;
      const frameId = frameResult.selection.layerIds[0];

      const rectResult = addLayer(state, 'rectangle');
      state.document = rectResult.document;
      const rectId = rectResult.selection.layerIds[0];

      const doc = reorderLayer(state, rectId, frameId, 0);
      expect(doc.rootLayerIds).toEqual([frameId]);
      expect((doc.layers[frameId] as FrameLayer).children).toEqual([rectId]);
      expect(doc.layers[rectId].parentId).toBe(frameId);
    });

    it('refuses to move a layer into its own descendant', () => {
      const frameResult = addLayer(state, 'frame');
      state.document = frameResult.document;
      const frameId = frameResult.selection.layerIds[0];

      const groupResult = addLayer(state, 'group', undefined, frameId);
      state.document = groupResult.document;
      const groupId = groupResult.selection.layerIds[0];

      const doc = reorderLayer(state, frameId, groupId, 0);
      expect(doc.rootLayerIds).toEqual([frameId]);
      expect((doc.layers[frameId] as FrameLayer).children).toEqual([groupId]);
      expect(doc.layers[frameId].parentId).toBeNull();
    });
  });

  describe('CommandStack', () => {
    it('undo and redo work correctly', () => {
      const stack = new CommandStack(state);

      // Execute add layer command
      let addedId: string;
      const addCmd = {
        name: 'addLayer',
        execute: (s: EditorState) => {
          const result = addLayer(s, 'rectangle');
          addedId = result.selection.layerIds[0];
          return result.document;
        },
        undo: (s: EditorState) => {
          return removeLayer(s, [addedId]).document;
        },
      };

      stack.execute(addCmd);
      expect(Object.keys(state.document.layers)).toHaveLength(1);
      expect(stack.canUndo()).toBe(true);
      expect(stack.canRedo()).toBe(false);

      // Undo
      stack.undo();
      expect(Object.keys(state.document.layers)).toHaveLength(0);
      expect(stack.canUndo()).toBe(false);
      expect(stack.canRedo()).toBe(true);

      // Redo
      stack.redo();
      expect(Object.keys(state.document.layers)).toHaveLength(1);
      expect(stack.canUndo()).toBe(true);
      expect(stack.canRedo()).toBe(false);
    });
  });
});

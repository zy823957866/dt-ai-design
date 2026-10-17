// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createDocument,
  createLayer,
  type DesignDocument,
} from '@dt-ai-design/design-schema';

import { EditorContext, type EditorApi } from '@/lib/editor';

import { ImagesTab, topLevelImageLayers } from './LeftPanel';

afterEach(cleanup);

const buildDoc = (): DesignDocument => {
  const doc = createDocument('Images');
  const nestedImage = createLayer('image', {
    id: 'nested-image',
    name: 'Nested',
    imageSrc: 'data:image/png;base64,AAAA',
  });
  const frame = createLayer('frame', { id: 'frame', name: 'Frame' });
  frame.children = ['nested-image'];
  const group = createLayer('group', { id: 'group', name: 'Group' });
  const nestedInGroup = createLayer('image', {
    id: 'group-image',
    name: 'In Group',
    imageSrc: 'data:image/png;base64,BBBB',
  });
  group.children = ['group-image'];
  const image = createLayer('image', {
    id: 'image-1',
    name: 'Hero Shot',
    imageSrc: 'data:image/png;base64,CCCC',
    width: 320,
    height: 180,
  });
  const rect = createLayer('rectangle', { id: 'rect', name: 'Rect' });

  doc.layers = {
    [image.id]: image,
    [rect.id]: rect,
    [frame.id]: frame,
    [nestedImage.id]: nestedImage,
    [group.id]: group,
    [nestedInGroup.id]: nestedInGroup,
  };
  doc.rootLayerIds = [image.id, rect.id, frame.id, group.id];
  return doc;
};

const createFakeEditor = (initial: DesignDocument) => {
  let doc = initial;
  const listeners = new Set<() => void>();
  const setSelection = vi.fn();
  const editor = {
    getDocument: () => doc,
    getSelection: () => ({ layerIds: [] }),
    setSelection,
    subscribe: (_event: string, cb: () => void) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  } as unknown as EditorApi;
  return {
    editor,
    setSelection,
    setDoc: (next: DesignDocument) => {
      doc = next;
      listeners.forEach((cb) => cb());
    },
  };
};

const renderTab = (editor: EditorApi) =>
  render(
    <EditorContext.Provider value={editor}>
      <ImagesTab />
    </EditorContext.Provider>,
  );

describe('ImagesTab', () => {
  it('only lists top-level image layers', () => {
    const { editor } = createFakeEditor(buildDoc());
    renderTab(editor);

    expect(screen.getByText('Image Layers · 1')).toBeDefined();
    expect(screen.getByText('Hero Shot')).toBeDefined();
    expect(screen.queryByText('Nested')).toBeNull();
    expect(screen.queryByText('In Group')).toBeNull();
    expect(screen.queryByText('Rect')).toBeNull();

    const img = screen.getByAltText('Hero Shot') as HTMLImageElement;
    expect(img.src).toBe('data:image/png;base64,CCCC');
    expect(screen.getByText('320 × 180')).toBeDefined();
  });

  it('refreshes when the editor emits a change', () => {
    const state = createFakeEditor(buildDoc());
    renderTab(state.editor);

    expect(screen.getByText('Image Layers · 1')).toBeDefined();

    const next = buildDoc();
    const extra = createLayer('image', {
      id: 'image-2',
      name: 'Logo',
      imageSrc: 'data:image/png;base64,DDDD',
    });
    next.layers[extra.id] = extra;
    next.rootLayerIds = [extra.id, ...next.rootLayerIds];

    act(() => state.setDoc(next));

    expect(screen.getByText('Image Layers · 2')).toBeDefined();
    expect(screen.getByText('Logo')).toBeDefined();
  });

  it('shows an empty state when there are no image layers', () => {
    const empty = createDocument('Empty');
    const { editor } = createFakeEditor(empty);
    renderTab(editor);

    expect(screen.getByText('Image Layers · 0')).toBeDefined();
    expect(screen.getByText('画布中还没有图片图层')).toBeDefined();
  });
});

describe('topLevelImageLayers', () => {
  it('ignores nested image layers', () => {
    const ids = topLevelImageLayers(buildDoc()).map((layer) => layer.id);
    expect(ids).toEqual(['image-1']);
  });
});

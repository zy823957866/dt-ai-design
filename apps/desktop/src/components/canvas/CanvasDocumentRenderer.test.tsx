// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  createDocument,
  type DesignDocument,
} from '@dt-ai-design/design-schema';

import { CanvasDocumentRenderer } from './CanvasDocumentRenderer';

const base = (id: string, name: string, index: number) => ({
  id,
  name,
  parentId: null,
  index,
  x: index * 10,
  y: index * 10,
  width: 100,
  height: 40,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  blendMode: 'normal' as const,
  layerPosition: 'auto' as const,
});

const makeDoc = (): DesignDocument => {
  const doc = createDocument('T');
  doc.layers.f = {
    ...base('f', 'FrameName', 0),
    type: 'frame',
    children: ['fNested'],
    layout: {
      mode: 'none',
      gap: 0,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      justifyContent: 'start',
      alignItems: 'start',
    },
    sizingMode: { width: 'fixed', height: 'fixed' },
    fills: [],
    strokes: [],
    cornerRadius: 0,
    effects: [],
    overflow: 'visible',
    clipContent: false,
  };
  doc.layers.fNested = {
    ...base('fNested', 'NestedName', 4),
    parentId: 'f',
    type: 'frame',
    children: [],
    layout: {
      mode: 'none',
      gap: 0,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      justifyContent: 'start',
      alignItems: 'start',
    },
    sizingMode: { width: 'fixed', height: 'fixed' },
    fills: [],
    strokes: [],
    cornerRadius: 0,
    effects: [],
    overflow: 'visible',
    clipContent: false,
  };
  doc.layers.r = {
    ...base('r', 'RectName', 1),
    type: 'rectangle',
    fills: [],
    strokes: [],
    cornerRadius: 0,
    effects: [],
  };
  doc.layers.t = {
    ...base('t', 'TextName', 2),
    type: 'text',
    content: 'HelloContent',
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    textAlign: 'left',
    verticalAlign: 'top',
    textDecoration: 'none',
    textTransform: 'none',
    fills: [{ type: 'solid', color: '#000000', opacity: 1 }],
    strokes: [],
    sizing: 'autoHeight',
    overflow: 'visible',
  };
  doc.layers.g = {
    ...base('g', 'GroupName', 3),
    type: 'group',
    children: [],
    effects: [],
  };
  doc.rootLayerIds = ['f', 'r', 't', 'g'];
  return doc;
};

describe('CanvasDocumentRenderer layer names', () => {
  it('renders the name only for frame layers', () => {
    render(
      <svg>
        <CanvasDocumentRenderer
          doc={makeDoc()}
          selectedIds={[]}
          hoveredId={null}
          onLayerClick={() => {}}
          onLayerDoubleClick={() => {}}
          onLayerEnter={() => {}}
          onLayerLeave={() => {}}
        />
      </svg>,
    );

    // top-level frame shows its name
    expect(screen.getByText('FrameName')).toBeTruthy();
    // nested frame does NOT show its name
    expect(screen.queryByText('NestedName')).toBeNull();
    // non-frame layers do NOT show their names
    expect(screen.queryByText('RectName')).toBeNull();
    expect(screen.queryByText('TextName')).toBeNull();
    expect(screen.queryByText('GroupName')).toBeNull();
    // text content still renders
    expect(screen.getByText('HelloContent')).toBeTruthy();
  });
});

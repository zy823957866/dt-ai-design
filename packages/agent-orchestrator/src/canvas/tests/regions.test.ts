import { describe, expect, it } from 'vitest';

import { createCanvasSession } from '@dt-ai-design/design-canvas-tools';
import { createDocument, type FrameLayer } from '@dt-ai-design/design-schema';

import { buildHeuristicPlan } from '../multiAgent';
import { mergeRegionDocument, placeRegionScaffolds } from '../regions';

const plan = buildHeuristicPlan({ targetNodeId: 'root', width: 1440 });

describe('placeRegionScaffolds', () => {
  it('creates a page frame and one frame per region', () => {
    const result = placeRegionScaffolds({
      document: createDocument('T'),
      plan,
    });
    const page = result.document.layers[result.pageId] as FrameLayer;
    expect(page.children).toHaveLength(3);
    expect(result.regionIds).toEqual(['hero', 'content', 'footer']);
    const hero = result.document.layers.hero as FrameLayer;
    expect(hero.type).toBe('frame');
    expect(hero.width).toBe(1440);
    expect(hero.y).toBe(0);
  });

  it('is idempotent when applied twice', () => {
    const first = placeRegionScaffolds({ document: createDocument('T'), plan });
    const second = placeRegionScaffolds({ document: first.document, plan });
    const page = second.document.layers[second.pageId] as FrameLayer;
    expect(page.children).toHaveLength(3);
    expect(new Set(page.children).size).toBe(3);
  });
});

describe('mergeRegionDocument', () => {
  it('brings a worker region subtree into the main document', () => {
    const scaffold = placeRegionScaffolds({
      document: createDocument('T'),
      plan,
    });

    const worker = createCanvasSession(scaffold.document);
    worker.execute(
      `Insert("hero", {type:"text", name:"Title", content:"Welcome"})`,
    );
    const workerDoc = worker.document();

    const merged = mergeRegionDocument({
      document: scaffold.document,
      workerDocument: workerDoc,
      regionId: 'hero',
    });

    const hero = merged.layers.hero as FrameLayer;
    expect(hero.children).toHaveLength(1);
    expect(merged.layers[hero.children[0]].name).toBe('Title');
    // untouched regions stay empty
    expect((merged.layers.content as FrameLayer).children).toHaveLength(0);
    // original document is not mutated
    expect((scaffold.document.layers.hero as FrameLayer).children).toHaveLength(
      0,
    );
  });

  it('returns the main document unchanged when the region is missing', () => {
    const scaffold = placeRegionScaffolds({
      document: createDocument('T'),
      plan,
    });
    const merged = mergeRegionDocument({
      document: scaffold.document,
      workerDocument: createDocument('Empty'),
      regionId: 'hero',
    });
    expect((merged.layers.hero as FrameLayer).children).toHaveLength(0);
  });
});

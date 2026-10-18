import { describe, expect, it } from 'vitest';

import { createDocument } from '@dt-ai-design/design-schema';

import { createCanvasSession } from '../index';
import { pruneEmptyLayers } from '../prune';

describe('pruneEmptyLayers', () => {
  it('removes empty frames/groups bottom-up and keeps content', () => {
    const session = createCanvasSession(createDocument('T'));
    session.execute(`
      root = Insert(document, {type:"frame", name:"Page", width:400, height:300, fills:[{type:"solid",color:"#ffffff",opacity:1}]});
      Insert(root, {type:"frame", name:"Empty"});
      Insert(root, {type:"group", name:"EmptyGroup"});
      filled = Insert(root, {type:"frame", name:"Filled"});
      Insert(filled, {type:"text", name:"Label", content:"Hi", fills:[{type:"solid",color:"#000000",opacity:1}]});
      wrap = Insert(root, {type:"frame", name:"Wrap"});
      Insert(wrap, {type:"frame", name:"Inner"});
      Insert(document, {type:"frame", name:"Orphan"});
    `);

    const before = Object.keys(session.document().layers).length;
    const { document, removed } = pruneEmptyLayers(session.document());

    // Empty, EmptyGroup, Wrap, Inner, Orphan removed (Wrap becomes empty after Inner)
    expect(removed).toHaveLength(5);
    const names = Object.values(document.layers)
      .map((layer) => layer.name)
      .sort();
    expect(names).toEqual(['Filled', 'Label', 'Page']);
    expect(Object.keys(document.layers)).toHaveLength(before - 5);

    // page keeps only the filled container
    const page = Object.values(document.layers).find(
      (layer) => layer.name === 'Page',
    );
    expect((page as { children: string[] }).children).toHaveLength(1);
  });

  it('keeps a frame that has a non-default fill even without children', () => {
    const session = createCanvasSession(createDocument('T'));
    session.execute(
      `Insert(document, {type:"frame", name:"Swatch", width:40, height:40, fills:[{type:"solid",color:"#EF4444",opacity:1}]})`,
    );
    const { document, removed } = pruneEmptyLayers(session.document());
    expect(removed).toHaveLength(0);
    expect(Object.values(document.layers)).toHaveLength(1);
  });
});

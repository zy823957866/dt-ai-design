import { describe, expect, it } from 'vitest';

import { createDocument, type FrameLayer } from '@dt-ai-design/design-schema';

import { createCanvasSession, type CanvasSession } from '../index';

const newSession = (): CanvasSession =>
  createCanvasSession(createDocument('Test'));

describe('Insert', () => {
  it('inserts a frame at the document root with a generated id', () => {
    const session = newSession();
    const result = session.execute(
      `hero = Insert(document, {type:"frame", name:"Hero", width:400, height:200})`,
    );

    expect(result.ok).toBe(true);
    expect(result.refs.Hero).toBeDefined();
    expect(result.documentChanged).toBe(true);

    const doc = session.document();
    const id = result.refs.Hero;
    expect(doc.rootLayerIds).toEqual([id]);
    expect(doc.layers[id].type).toBe('frame');
    expect(doc.layers[id].name).toBe('Hero');
    expect(doc.layers[id].parentId).toBeNull();
  });

  it('ignores a model-provided id and generates a unique one', () => {
    const session = newSession();
    const result = session.execute(
      `Insert(document, {id:"provided-id", type:"frame", name:"A"})`,
    );
    expect(result.refs.A).not.toBe('provided-id');
    expect(session.document().layers['provided-id']).toBeUndefined();
  });

  it('creates nested children with parentId and index and returns their refs', () => {
    const session = newSession();
    session.execute(
      `card = Insert(document, {type:"frame", name:"Card", children:[
         {type:"text", name:"Title", content:"Hi"},
         {type:"rectangle", name:"Swatch"}
       ]})`,
    );

    const doc = session.document();
    const card = doc.layers[Object.keys(doc.layers)[0]] as FrameLayer;
    expect(card.children).toHaveLength(2);
    const [titleId, swatchId] = card.children;
    expect(doc.layers[titleId].name).toBe('Title');
    expect(doc.layers[titleId].parentId).toBe(card.id);
    expect(doc.layers[titleId].index).toBe(0);
    expect(doc.layers[swatchId].index).toBe(1);
  });

  it('rejects inserting into a non-container parent', () => {
    const session = newSession();
    session.execute(
      `leaf = Insert(document, {type:"text", name:"Leaf", content:"x"})`,
    );
    const leafId = session.document().rootLayerIds[0];
    const result = session.execute(
      `Insert("${leafId}", {type:"text", name:"Nope"})`,
    );
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('cannot have children');
  });
});

describe('Update', () => {
  it('merges properties and never changes id or type', () => {
    const session = newSession();
    const created = session.execute(
      `box = Insert(document, {type:"rectangle", name:"Box", width:100, height:100})`,
    );
    const id = created.refs.Box;

    session.execute(
      `Update("${id}", {name:"Box2", width:250, type:"ellipse", id:"hack"})`,
    );

    const box = session.document().layers[id];
    expect(box.name).toBe('Box2');
    expect(box.width).toBe(250);
    expect(box.type).toBe('rectangle');
    expect(box.id).toBe(id);
  });

  it('does not replace children via Update', () => {
    const session = newSession();
    const created = session.execute(
      `card = Insert(document, {type:"frame", name:"Card", children:[{type:"text", name:"T", content:"a"}]})`,
    );
    const id = created.refs.Card;
    session.execute(
      `Update("${id}", {children:[{type:"text", name:"Hack", content:"b"}]})`,
    );
    const card = session.document().layers[id] as FrameLayer;
    expect(card.children).toHaveLength(1);
    expect(session.document().layers[card.children[0]].name).toBe('T');
  });
});

describe('Delete', () => {
  it('removes the node and its descendants', () => {
    const session = newSession();
    const created = session.execute(
      `card = Insert(document, {type:"frame", name:"Card", children:[{type:"text", name:"T", content:"a"}]})`,
    );
    const id = created.refs.Card;
    const childId = (session.document().layers[id] as FrameLayer).children[0];

    session.execute(`Delete("${id}")`);

    const doc = session.document();
    expect(doc.rootLayerIds).toEqual([]);
    expect(doc.layers[id]).toBeUndefined();
    expect(doc.layers[childId]).toBeUndefined();
  });
});

describe('Move', () => {
  it('reparents and reorders within a container', () => {
    const session = newSession();
    const created = session.execute(
      `row = Insert(document, {type:"frame", name:"Row", children:[
         {type:"text", name:"A", content:"a"},
         {type:"text", name:"B", content:"b"}
       ]});
       other = Insert(document, {type:"frame", name:"Other"})`,
    );
    const rowId = created.refs.Row;
    const otherId = created.refs.Other;
    const row = session.document().layers[rowId] as FrameLayer;
    const bId = row.children[1];

    session.execute(`Move("${bId}", "${otherId}")`);

    const doc = session.document();
    expect((doc.layers[rowId] as FrameLayer).children).toHaveLength(1);
    expect((doc.layers[otherId] as FrameLayer).children).toEqual([bId]);
    expect(doc.layers[bId].parentId).toBe(otherId);
    expect(doc.layers[bId].index).toBe(0);
  });

  it('moves to the document root when parent omitted is not supported via string', () => {
    const session = newSession();
    const created = session.execute(
      `card = Insert(document, {type:"frame", name:"Card", children:[{type:"text", name:"T", content:"a"}]})`,
    );
    const cardId = created.refs.Card;
    const childId = (session.document().layers[cardId] as FrameLayer)
      .children[0];
    session.execute(`Move("${childId}", document)`);
    const doc = session.document();
    expect(doc.rootLayerIds).toContain(childId);
    expect((doc.layers[cardId] as FrameLayer).children).toEqual([]);
    expect(doc.layers[childId].parentId).toBeNull();
  });
});

describe('Get', () => {
  it('returns a nested subtree', () => {
    const session = newSession();
    const created = session.execute(
      `card = Insert(document, {type:"frame", name:"Card", children:[{type:"text", name:"Title", content:"Hi"}]})`,
    );
    session.execute(`Print(JSON.stringify(Get("${created.refs.Card}")))`);

    const got = JSON.parse(session.lastOutput[0]) as {
      name: string;
      children: { name: string }[];
    };
    expect(got.name).toBe('Card');
    expect(got.children[0].name).toBe('Title');
  });

  it('elides descendants beyond depth', () => {
    const session = newSession();
    const created = session.execute(
      `card = Insert(document, {type:"frame", name:"Card", children:[{type:"frame", name:"Inner", children:[{type:"text", name:"Deep", content:"x"}]}]})`,
    );
    session.execute(
      `Print(JSON.stringify(Get("${created.refs.Card}", {depth:1})))`,
    );
    const tree = JSON.parse(session.lastOutput[0]) as {
      children: { children?: unknown[] }[];
    };
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].children).toBeUndefined();
  });

  it('visits the whole document and collects returns', () => {
    const session = newSession();
    session.execute(
      `Insert(document, {type:"text", name:"A", content:"a"});
       Insert(document, {type:"text", name:"B", content:"b"})`,
    );
    session.execute(
      `Print(Get(n => n.type === "text" ? n.name : undefined).join(","))`,
    );
    expect(session.lastOutput[0]).toBe('A,B');
  });

  it('provides ctx.bounds accumulating parent offsets', () => {
    const session = newSession();
    session.execute(
      `card = Insert(document, {type:"frame", name:"Card", x:100, y:50, width:400, height:200, layout:"none"})`,
    );
    const cardId = session.document().rootLayerIds[0];
    session.execute(
      `Insert("${cardId}", {type:"text", name:"T", x:10, y:20, content:"x"})`,
    );
    session.execute(
      `Get((n, c) => n.name === "T" ? Print(JSON.stringify(c.bounds)) : undefined)`,
    );
    const bounds = JSON.parse(session.lastOutput[0]) as {
      x: number;
      y: number;
    };
    expect(bounds.x).toBe(110);
    expect(bounds.y).toBe(70);
  });
});

describe('Copy', () => {
  it('deep-clones a subtree with new ids and applies descendants overrides', () => {
    const session = newSession();
    const created = session.execute(
      `card = Insert(document, {type:"frame", name:"Card", children:[{type:"text", name:"Title", content:"Original"}]})`,
    );
    const srcId = created.refs.Card;
    const titleId = (session.document().layers[srcId] as FrameLayer)
      .children[0];

    const copied = session.execute(
      `Copy("${srcId}", document, {name:"Card Copy", descendants:{"${titleId}":{content:"Changed"}}})`,
    );
    const copyId = copied.refs['Card Copy'];
    expect(copyId).toBeDefined();
    expect(copyId).not.toBe(srcId);

    const doc = session.document();
    const copy = doc.layers[copyId] as FrameLayer;
    expect(copy.children).toHaveLength(1);
    expect(copy.children[0]).not.toBe(titleId);
    expect((doc.layers[copy.children[0]] as { content?: string }).content).toBe(
      'Changed',
    );
    expect((doc.layers[srcId] as FrameLayer).children[0]).toBe(titleId);
  });
});

describe('Replace', () => {
  it('replaces a node with a new node keeping its position', () => {
    const session = newSession();
    const created = session.execute(
      `row = Insert(document, {type:"frame", name:"Row", children:[{type:"text", name:"A", content:"a"}, {type:"text", name:"B", content:"b"}]})`,
    );
    const rowId = created.refs.Row;
    const aId = (session.document().layers[rowId] as FrameLayer).children[0];

    const replaced = session.execute(
      `Replace("${aId}", {type:"text", name:"A2", content:"A2"})`,
    );
    const newId = replaced.refs.A2;
    const doc = session.document();
    expect(doc.layers[aId]).toBeUndefined();
    const row = doc.layers[rowId] as FrameLayer;
    expect(row.children[0]).toBe(newId);
    expect(doc.layers[newId].parentId).toBe(rowId);
  });
});

describe('variables', () => {
  it('sets and reads variables keyed by name', () => {
    const session = newSession();
    session.execute(
      `SetVariables({accent:{type:"color", value:"#7C3AED"}, "space-md":{type:"number", value:16}})`,
    );
    session.execute(`Print(JSON.stringify(GetVariables()))`);
    const variables = JSON.parse(session.lastOutput[0]).variables;
    expect(variables.accent).toEqual({ type: 'color', value: '#7C3AED' });
    expect(variables['space-md']).toEqual({ type: 'number', value: 16 });
  });

  it('merges by default and replaces when replace=true', () => {
    const session = newSession();
    session.execute(`SetVariables({a:{type:"color", value:"#000000"}})`);
    session.execute(`SetVariables({b:{type:"color", value:"#111111"}})`);
    expect(Object.keys(session.document().variables)).toEqual(['a', 'b']);
    session.execute(`SetVariables({c:{type:"color", value:"#222222"}}, true)`);
    expect(Object.keys(session.document().variables)).toEqual(['c']);
  });
});

describe('FindEmptySpace', () => {
  it('places to the right of existing root frames with padding', () => {
    const session = newSession();
    session.execute(
      `Insert(document, {type:"frame", name:"Screen", x:0, y:0, width:400, height:300})`,
    );
    session.execute(
      `Print(JSON.stringify(FindEmptySpace({width:200, height:200, direction:"right", padding:40})))`,
    );
    const pos = JSON.parse(session.lastOutput[0]) as { x: number; y: number };
    expect(pos.x).toBe(440);
    expect(pos.y).toBe(0);
  });
});

describe('Print', () => {
  it('joins values and serializes objects as JSON', () => {
    const session = newSession();
    session.execute(`Print("hello", 42, {a:1})`);
    expect(session.lastOutput[0]).toBe('hello 42 {"a":1}');
  });
});

describe('TakeScreenshot', () => {
  it('collects the requested node ids for the renderer to capture', () => {
    const session = newSession();
    const created = session.execute(
      `hero = Insert(document, {type:"frame", name:"Hero", width:400, height:200})`,
    );
    const result = session.execute(`TakeScreenshot(["${created.refs.Hero}"])`);
    expect(result.screenshotNodeIds).toEqual([created.refs.Hero]);
  });
});

describe('replaceDocument', () => {
  it('replaces the working document and bumps the revision', () => {
    const session = newSession();
    session.execute(`Insert(document, {type:"frame", name:"A"})`);
    const before = session.revision();
    const next = createDocument('Merged');
    const revision = session.replaceDocument(next);

    expect(revision).toBe(before + 1);
    expect(session.document().name).toBe('Merged');
    expect(session.document().rootLayerIds).toEqual([]);
  });
});

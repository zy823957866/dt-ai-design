import { describe, expect, it } from 'vitest';

import { createDocument } from '@dt-ai-design/design-schema';

import { createCanvasSession } from '../index';

const newSession = () => createCanvasSession(createDocument('Test'));

describe('execute', () => {
  it('runs code and reports refs, output and revision', () => {
    const session = newSession();
    const result = session.execute(
      `a = Insert(document, {type:"frame", name:"A"}); Print("done")`,
    );
    expect(result.ok).toBe(true);
    expect(result.output).toEqual(['done']);
    expect(result.refs.A).toBeDefined();
    expect(result.documentChanged).toBe(true);
    expect(session.revision()).toBe(1);
  });

  it('does not change the revision when nothing mutates', () => {
    const session = newSession();
    const result = session.execute(`Print("read only")`);
    expect(result.documentChanged).toBe(false);
    expect(session.revision()).toBe(0);
  });

  it('persists implicit globals across execute calls', () => {
    const session = newSession();
    session.execute(`hero = Insert(document, {type:"frame", name:"Hero"})`);
    const result = session.execute(
      `Insert(hero, {type:"text", name:"Title", content:"hi"})`,
    );
    expect(result.ok).toBe(true);
    const doc = session.document();
    const heroId = doc.rootLayerIds[0];
    expect(
      (doc.layers[heroId] as { children?: string[] }).children ?? [],
    ).toHaveLength(1);
  });

  it('rolls back document changes and globals on error and returns an editId', () => {
    const session = newSession();
    session.execute(`keeper = Insert(document, {type:"frame", name:"Keeper"})`);
    const rootIdsBefore = [...session.document().rootLayerIds];
    const revisionBefore = session.revision();

    const result = session.execute(
      `boom = Insert(document, {type:"frame", name:"Boom"}); throw new Error("nope")`,
    );

    expect(result.ok).toBe(false);
    expect(result.error?.editId).toBeTruthy();
    expect(session.revision()).toBe(revisionBefore);
    expect(session.document().rootLayerIds).toEqual(rootIdsBefore);
    // the global created before the throw must be reverted
    const check = session.execute(`Print(typeof boom)`);
    expect(check.output[0]).toBe('undefined');
  });

  it('patches a failed snippet with edits and reruns under the same editId', () => {
    const session = newSession();
    const failed = session.execute(
      `hero = Insert(document, {type:"frame", name:"Hero", width:400, height:200});
       Print(helo)`,
    );
    expect(failed.ok).toBe(false);
    const editId = failed.error!.editId;

    const retried = session.execute('', {
      editId,
      edits: [{ find: 'helo', replace: 'hero' }],
    });

    expect(retried.ok).toBe(true);
    expect(session.document().rootLayerIds).toHaveLength(1);
  });

  it('collects screenshot node ids', () => {
    const session = newSession();
    const created = session.execute(
      `hero = Insert(document, {type:"frame", name:"Hero"})`,
    );
    const shot = session.execute(`TakeScreenshot([hero])`);
    expect(shot.screenshotNodeIds).toEqual([created.refs.Hero]);
  });

  it('reports unknown functions as an error', () => {
    const session = newSession();
    const result = session.execute(`TotallyUnknown()`);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('TotallyUnknown');
  });
});

describe('placeholders', () => {
  it('tracks placeholder frames and removes the flag when cleared', () => {
    const session = newSession();
    const created = session.execute(
      `hero = Insert(document, {type:"frame", name:"Hero", placeholder:true})`,
    );
    expect(session.placeholders()).toContain(created.refs.Hero);
    expect(session.document().layers[created.refs.Hero]).not.toHaveProperty(
      'placeholder',
    );
    session.execute(`Update(hero, {placeholder:false})`);
    expect(session.placeholders()).not.toContain(created.refs.Hero);
  });
});

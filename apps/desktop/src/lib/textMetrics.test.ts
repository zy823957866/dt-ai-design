// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { createCanvasSession } from '@dt-ai-design/design-canvas-tools';
import { createDocument, type TextLayer } from '@dt-ai-design/design-schema';

import {
  desiredTextSize,
  measureText,
  normalizeTextSizes,
} from './textMetrics';

const insertText = (props: string): TextLayer => {
  const session = createCanvasSession(createDocument('T'));
  session.execute(
    `t = Insert(document, {type:"text", name:"T", content:"Hello World", x:0, y:0, ${props}, fills:[{type:"solid", color:"#000000", opacity:1}]})`,
  );
  const id = session.document().rootLayerIds[0];
  return session.document().layers[id] as TextLayer;
};

describe('measureText', () => {
  it('estimates a positive width and line-based height', () => {
    const size = measureText({
      content: 'Hello World',
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 24,
      letterSpacing: 0,
      fontFamily: 'Inter',
    });
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBe(24);
  });

  it('counts multiple lines in the height', () => {
    const size = measureText({
      content: 'a\nb',
      fontSize: 16,
      lineHeight: 20,
    } as never);
    expect(size.height).toBe(40);
  });
});

describe('desiredTextSize', () => {
  it('hugs width and height for left-aligned auto text', () => {
    const layer = insertText(
      'width:400, height:100, fontSize:16, fontWeight:400, lineHeight:24, letterSpacing:0, textAlign:"left", sizing:"autoWidth"',
    );
    const size = desiredTextSize(layer);
    expect(size).not.toBeNull();
    expect(size!.width).toBeLessThan(400);
    expect(size!.height).toBe(24);
  });

  it('keeps width for centered text but hugs height', () => {
    const layer = insertText(
      'width:400, height:100, fontSize:16, fontWeight:400, lineHeight:24, letterSpacing:0, textAlign:"center", sizing:"autoHeight"',
    );
    const size = desiredTextSize(layer);
    expect(size!.width).toBe(400);
    expect(size!.height).toBe(24);
  });

  it('does nothing for fixed sizing', () => {
    const layer = insertText(
      'width:400, height:100, fontSize:16, lineHeight:24, textAlign:"left", sizing:"fixed"',
    );
    expect(desiredTextSize(layer)).toBeNull();
  });
});

describe('normalizeTextSizes', () => {
  it('shrinks left-aligned text boxes to match content', () => {
    const layer = insertText(
      'width:400, height:100, fontSize:16, fontWeight:400, lineHeight:24, letterSpacing:0, textAlign:"left", sizing:"autoWidth"',
    );
    const doc = createDocument('T');
    doc.layers.t = layer;
    doc.rootLayerIds = ['t'];

    const result = normalizeTextSizes(doc);
    expect(result.changed).toBe(true);
    expect((result.document.layers.t as TextLayer).width).toBeLessThan(400);
  });
});

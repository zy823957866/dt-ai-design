import { describe, expect, it } from 'vitest';

import { createCanvasSession } from '@dt-ai-design/design-canvas-tools';
import { createDocument } from '@dt-ai-design/design-schema';

import {
  documentThumbnailDataUrl,
  renderDocumentThumbnailSvg,
} from './thumbnail';

describe('document thumbnail', () => {
  it('renders an SVG preview of the document', () => {
    const session = createCanvasSession(createDocument('T'));
    session.execute(`
      btn = Insert(document, {type:"frame", name:"Button", x:0, y:0, width:120, height:40, cornerRadius:8, fills:[{type:"solid",color:"#EF4444",opacity:1}]});
      Insert(btn, {type:"text", name:"Label", x:0, y:12, width:120, height:16, content:"Click me", fontSize:14, fontWeight:600, textAlign:"center", fontFamily:"Inter", fills:[{type:"solid",color:"#FFFFFF",opacity:1}]});
    `);

    const svg = renderDocumentThumbnailSvg(session.document());
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox');
    expect(svg).toContain('#EF4444');
    expect(svg).toContain('Click me');
  });

  it('produces an svg data url usable as an image source', () => {
    const url = documentThumbnailDataUrl(createDocument('Empty'));
    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
  });
});

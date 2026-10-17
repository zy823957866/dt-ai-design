import { describe, expect, it, vi } from 'vitest';

import { createCanvasSession } from '@dt-ai-design/design-canvas-tools';
import { createDocument } from '@dt-ai-design/design-schema';

import { createCanvasAppService } from './canvasAppService';

const createService = () => {
  const session = createCanvasSession(createDocument('Test'));
  const onDocumentChanged = vi.fn();
  const onExecute = vi.fn();
  const service = createCanvasAppService({
    session,
    project: { id: 'p1', title: 'Demo' },
    documentVersion: '1.0.0',
    getSelection: () => session.document().rootLayerIds[0] ?? null,
    captureScreenshot: async () => ({
      dataUrl: 'data:image/png;base64,AAAA',
      width: 400,
      height: 200,
      mimeType: 'image/png',
    }),
    onDocumentChanged,
    onExecute,
  });
  return { session, service, onDocumentChanged, onExecute };
};

describe('canvasAppService', () => {
  it('reports app state with revision and placeholders', async () => {
    const { service } = createService();
    const state = await service({ method: 'get_app_state' });
    expect(state).toMatchObject({
      isRunning: true,
      revision: 0,
      activeProject: { id: 'p1', title: 'Demo' },
    });
  });

  it('runs execute, emits document change and returns refs', async () => {
    const { service, onDocumentChanged, onExecute } = createService();
    const result = (await service({
      method: 'execute',
      code: 'hero = Insert(document, {type:"frame", name:"Hero", width:400, height:200})',
    })) as { ok: boolean; refs: Record<string, string>; revision: number };

    expect(result.ok).toBe(true);
    expect(result.refs.Hero).toBeDefined();
    expect(result.revision).toBe(1);
    expect(onExecute).toHaveBeenCalledTimes(1);
    expect(onDocumentChanged).toHaveBeenCalledTimes(1);
  });

  it('returns requested nodes with descendants', async () => {
    const { service } = createService();
    const created = (await service({
      method: 'execute',
      code: 'card = Insert(document, {type:"frame", name:"Card", children:[{type:"text", name:"Title", content:"Hi"}]})',
    })) as { refs: Record<string, string> };

    const context = (await service({
      method: 'get_nodes',
      nodeIds: [created.refs.Card],
    })) as { layers: Record<string, { children?: unknown[] }> };

    expect(context.layers[created.refs.Card].children).toHaveLength(1);
  });

  it('throws NO_SELECTION when nothing is selected', async () => {
    const session = createCanvasSession(createDocument('Test'));
    const service = createCanvasAppService({
      session,
      project: { id: 'p1', title: 'Demo' },
      documentVersion: '1.0.0',
      getSelection: () => null,
    });
    await expect(
      service({ method: 'get_selected_node' }),
    ).rejects.toMatchObject({
      code: 'NO_SELECTION',
    });
  });

  it('returns a screenshot with the data url prefix stripped', async () => {
    const { service } = createService();
    const shot = (await service({
      method: 'get_screenshot',
      nodeId: 'n1',
    })) as {
      data: string;
      mimeType: string;
    };
    expect(shot.data).toBe('AAAA');
    expect(shot.mimeType).toBe('image/png');
  });
});

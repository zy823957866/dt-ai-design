import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, describe, expect, it } from 'vitest';

import { createDtMcpServer } from '../server';
import {
  DtMcpError,
  type DtMcpAppClient,
  type DtMcpAppState,
  type DtMcpExecuteResult,
  type DtMcpNodeContext,
} from '../types';

const appState: DtMcpAppState = {
  isRunning: true,
  activeProject: { id: 'p1', title: 'Demo' },
  selectedNodeId: 'layer_hero',
  documentVersion: '1.0.0',
  revision: 4,
};

const nodeContext: DtMcpNodeContext = {
  project: { id: 'p1', title: 'Demo' },
  revision: 4,
  selectedNodeId: 'layer_hero',
  layers: { layer_hero: { id: 'layer_hero', type: 'frame', name: 'Hero' } },
  rootLayerIds: ['layer_hero'],
  variables: { accent: { type: 'color', value: '#7C3AED' } },
};

const createMockClient = (
  overrides: Partial<DtMcpAppClient> = {},
): DtMcpAppClient => ({
  getAppState: async () => appState,
  getSelectedNode: async () => nodeContext,
  getNodes: async () => nodeContext,
  getVariables: async () => ({ revision: 4, variables: nodeContext.variables }),
  getScreenshot: async ({ nodeId }) => ({
    nodeId: nodeId ?? 'layer_hero',
    width: 400,
    height: 200,
    data: 'AAAA',
    mimeType: 'image/png',
  }),
  execute: async () =>
    ({
      ok: true,
      revision: 5,
      refs: { Hero: 'layer_new' },
      output: ['ok'],
      warnings: [],
      screenshotNodeIds: [],
      documentChanged: true,
    }) satisfies DtMcpExecuteResult,
  ...overrides,
});

const connect = async (appClient: DtMcpAppClient) => {
  const server = createDtMcpServer({ appClient });
  const client = new Client({ name: 'test', version: '1.0.0' });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return { server, client };
};

const clients: Client[] = [];
afterEach(async () => {
  await Promise.all(clients.splice(0).map((client) => client.close()));
});

const readJson = (result: unknown): unknown => {
  const content = (result as { content: { type: string; text?: string }[] })
    .content;
  const text = content.find((item) => item.type === 'text')?.text;
  return text ? JSON.parse(text) : undefined;
};

describe('dt-ai-design MCP server', () => {
  it('registers the expected tools', async () => {
    const { client } = await connect(createMockClient());
    clients.push(client);
    const tools = await client.listTools();
    const names = tools.tools.map((tool) => tool.name).sort();
    expect(names).toEqual([
      'execute',
      'get_app_state',
      'get_nodes',
      'get_screenshot',
      'get_selected_node',
      'get_variables',
    ]);
  });

  it('returns app state as JSON content', async () => {
    const { client } = await connect(createMockClient());
    clients.push(client);
    const result = await client.callTool({
      name: 'get_app_state',
      arguments: {},
    });
    expect(readJson(result)).toMatchObject({ isRunning: true, revision: 4 });
  });

  it('returns execute refs as JSON content', async () => {
    const { client } = await connect(createMockClient());
    clients.push(client);
    const result = await client.callTool({
      name: 'execute',
      arguments: { code: 'Insert(document, {})' },
    });
    expect(readJson(result)).toMatchObject({
      ok: true,
      refs: { Hero: 'layer_new' },
    });
  });

  it('surfaces tool errors with a structured code', async () => {
    const { client } = await connect(
      createMockClient({
        getNodes: async () => {
          throw new DtMcpError('NODE_NOT_FOUND', 'Node not found: x');
        },
      }),
    );
    clients.push(client);
    const result = await client.callTool({
      name: 'get_nodes',
      arguments: { nodeIds: ['x'] },
    });
    expect((result as { isError?: boolean }).isError).toBe(true);
    expect(readJson(result)).toMatchObject({
      error: { code: 'NODE_NOT_FOUND' },
    });
  });

  it('returns screenshots as image content', async () => {
    const { client } = await connect(createMockClient());
    clients.push(client);
    const result = await client.callTool({
      name: 'get_screenshot',
      arguments: {},
    });
    const content = (result as { content: { type: string }[] }).content;
    expect(content.some((item) => item.type === 'image')).toBe(true);
  });
});

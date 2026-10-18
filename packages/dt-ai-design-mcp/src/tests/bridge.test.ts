import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  createDtMcpBridgeClient,
  createDtMcpBridgeServer,
  type DtMcpBridgeServer,
} from '../bridge';
import {
  DtMcpError,
  type DtMcpAppRequest,
  type DtMcpAppResult,
  type DtMcpExecuteResult,
} from '../types';

const endpoint = () =>
  process.platform === 'win32'
    ? `\\\\.\\pipe\\dt-mcp-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
    : path.join(
        os.tmpdir(),
        `dt-mcp-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      );

const servers: DtMcpBridgeServer[] = [];

const startServer = async (
  handleRequest: (request: DtMcpAppRequest) => Promise<DtMcpAppResult>,
) => {
  const server = await createDtMcpBridgeServer({
    endpoint: endpoint(),
    handleRequest,
  });
  servers.push(server);
  return server;
};

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe('bridge', () => {
  it('round-trips requests over the socket', async () => {
    const server = await startServer(async (request) => {
      if (request.method === 'get_app_state') {
        return {
          isRunning: true,
          activeProject: { id: 'p1', title: 'Demo' },
          selectedNodeId: 'n1',
          documentVersion: '1.0.0',
          revision: 3,
        };
      }
      throw new DtMcpError('INTERNAL_ERROR', 'unexpected');
    });

    const client = createDtMcpBridgeClient({ endpoint: server.endpoint });
    const state = await client.getAppState();
    expect(state.isRunning).toBe(true);
    expect(state.activeProject?.title).toBe('Demo');
    expect(state.revision).toBe(3);
  });

  it('passes through structured errors with their code', async () => {
    const server = await startServer(async () => {
      throw new DtMcpError('NODE_NOT_FOUND', 'Node not found: x');
    });
    const client = createDtMcpBridgeClient({ endpoint: server.endpoint });
    await expect(client.getNodes({ nodeIds: ['x'] })).rejects.toMatchObject({
      code: 'NODE_NOT_FOUND',
    });
  });

  it('sends execute input and returns the execute result', async () => {
    let seen: unknown;
    const server = await startServer(async (request) => {
      seen = request;
      return {
        ok: true,
        revision: 1,
        refs: { Hero: 'layer_1' },
        output: ['ok'],
        warnings: [],
        screenshotNodeIds: [],
        documentChanged: true,
      } satisfies DtMcpExecuteResult;
    });
    const client = createDtMcpBridgeClient({ endpoint: server.endpoint });
    const result = await client.execute({ code: 'Insert(document,{})' });
    expect(result.refs.Hero).toBe('layer_1');
    expect(seen).toMatchObject({
      method: 'execute',
      code: 'Insert(document,{})',
    });
  });

  it('falls back to a not-running state when the app is unavailable', async () => {
    const client = createDtMcpBridgeClient({
      endpoint:
        process.platform === 'win32'
          ? '\\\\.\\pipe\\dt-mcp-missing-xyz'
          : path.join(os.tmpdir(), 'dt-mcp-missing-xyz.sock'),
      timeoutMs: 300,
    });
    const state = await client.getAppState();
    expect(state.isRunning).toBe(false);
    expect(state.activeProject).toBeNull();
  });
});

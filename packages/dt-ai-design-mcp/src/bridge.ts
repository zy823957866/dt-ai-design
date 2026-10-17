import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import net from 'node:net';

import {
  DtMcpError,
  type DtMcpAppClient,
  type DtMcpAppRequest,
  type DtMcpAppResult,
  type DtMcpAppState,
  type DtMcpBridgeRequest,
  type DtMcpBridgeResponse,
  type DtMcpErrorCode,
  type DtMcpExecuteResult,
  type DtMcpNodeContext,
  type DtMcpScreenshot,
  type DtMcpVariables,
} from './types';

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_MESSAGE_LENGTH = 64 * 1024 * 1024;

const toDtMcpError = (error: unknown): DtMcpError =>
  error instanceof DtMcpError
    ? error
    : new DtMcpError(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Unknown MCP error.',
      );

const parseBridgeResponse = (
  value: string,
  expectedId: string,
): DtMcpBridgeResponse => {
  const response = JSON.parse(value) as DtMcpBridgeResponse;
  if (response.id !== expectedId) {
    throw new DtMcpError(
      'INTERNAL_ERROR',
      'MCP bridge returned an unexpected response identifier.',
    );
  }
  return response;
};

const requestBridge = ({
  endpoint,
  request,
  timeoutMs,
}: {
  endpoint: string;
  request: DtMcpBridgeRequest;
  timeoutMs: number;
}) =>
  new Promise<DtMcpAppResult>((resolve, reject) => {
    const socket = net.createConnection(endpoint);
    let settled = false;
    let responseBuffer = '';

    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.destroy();
      callback();
    };
    const timeout = setTimeout(() => {
      settle(() =>
        reject(
          new DtMcpError(
            'RENDERER_UNAVAILABLE',
            'Timed out waiting for the dt-ai-design desktop app.',
          ),
        ),
      );
    }, timeoutMs);

    socket.setEncoding('utf8');
    socket.once('connect', () => {
      socket.write(`${JSON.stringify(request)}\n`);
    });
    socket.on('data', (chunk: string) => {
      responseBuffer += chunk;
      if (responseBuffer.length > MAX_MESSAGE_LENGTH) {
        settle(() =>
          reject(
            new DtMcpError(
              'INTERNAL_ERROR',
              'MCP bridge response exceeded the size limit.',
            ),
          ),
        );
        return;
      }
      const lineEnd = responseBuffer.indexOf('\n');
      if (lineEnd < 0) return;

      try {
        const response = parseBridgeResponse(
          responseBuffer.slice(0, lineEnd),
          request.id,
        );
        if (response.success === true) {
          settle(() => resolve(response.result));
          return;
        }
        settle(() =>
          reject(new DtMcpError(response.error.code, response.error.message)),
        );
      } catch (error) {
        settle(() => reject(toDtMcpError(error)));
      }
    });
    socket.once('error', (error) => {
      settle(() =>
        reject(
          new DtMcpError(
            'APP_NOT_RUNNING',
            `dt-ai-design desktop app is not available: ${error.message}`,
          ),
        ),
      );
    });
    socket.once('end', () => {
      settle(() =>
        reject(
          new DtMcpError(
            'RENDERER_UNAVAILABLE',
            'dt-ai-design desktop app closed the bridge connection.',
          ),
        ),
      );
    });
  });

export const createDtMcpBridgeClient = ({
  endpoint,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: {
  endpoint: string;
  timeoutMs?: number;
}): DtMcpAppClient => {
  const call = async (request: DtMcpAppRequest) => {
    try {
      return await requestBridge({
        endpoint,
        request: { id: randomUUID(), request },
        timeoutMs,
      });
    } catch (error) {
      if (
        request.method === 'get_app_state' &&
        error instanceof DtMcpError &&
        error.code === 'APP_NOT_RUNNING'
      ) {
        return {
          isRunning: false,
          activeProject: null,
          selectedNodeId: null,
          documentVersion: null,
          revision: null,
        } satisfies DtMcpAppState;
      }
      throw error;
    }
  };

  return {
    getAppState: () =>
      call({ method: 'get_app_state' }) as Promise<DtMcpAppState>,
    getSelectedNode: () =>
      call({ method: 'get_selected_node' }) as Promise<DtMcpNodeContext>,
    getNodes: ({ nodeIds }) =>
      call({ method: 'get_nodes', nodeIds }) as Promise<DtMcpNodeContext>,
    getVariables: () =>
      call({ method: 'get_variables' }) as Promise<DtMcpVariables>,
    getScreenshot: ({ nodeId }) =>
      call({ method: 'get_screenshot', nodeId }) as Promise<DtMcpScreenshot>,
    execute: ({ code, edits, editId }) =>
      call({
        method: 'execute',
        code,
        edits,
        editId,
      }) as Promise<DtMcpExecuteResult>,
  };
};

const serializeBridgeError = (
  id: string,
  error: unknown,
): DtMcpBridgeResponse => {
  const normalized = toDtMcpError(error);
  return {
    id,
    success: false,
    error: { code: normalized.code, message: normalized.message },
  };
};

export interface DtMcpBridgeServer {
  close(): Promise<void>;
  endpoint: string;
}

export const createDtMcpBridgeServer = async ({
  endpoint,
  handleRequest,
  removeStaleEndpoint,
}: {
  endpoint: string;
  handleRequest: (request: DtMcpAppRequest) => Promise<DtMcpAppResult>;
  removeStaleEndpoint?: boolean;
}): Promise<DtMcpBridgeServer> => {
  const shouldRemoveStaleEndpoint =
    removeStaleEndpoint ?? !endpoint.startsWith('\\\\.\\pipe\\');

  if (shouldRemoveStaleEndpoint) {
    await rm(endpoint, { force: true });
  }

  const server = net.createServer((socket) => {
    socket.setEncoding('utf8');
    let requestBuffer = '';
    let handled = false;

    socket.on('data', (chunk: string) => {
      if (handled) return;
      requestBuffer += chunk;
      if (requestBuffer.length > MAX_MESSAGE_LENGTH) {
        handled = true;
        socket.destroy(
          new Error('MCP bridge request exceeded the size limit.'),
        );
        return;
      }
      const lineEnd = requestBuffer.indexOf('\n');
      if (lineEnd < 0) return;
      handled = true;

      let request: DtMcpBridgeRequest;
      try {
        request = JSON.parse(
          requestBuffer.slice(0, lineEnd),
        ) as DtMcpBridgeRequest;
      } catch (error) {
        socket.end(
          `${JSON.stringify(
            serializeBridgeError(
              'invalid-request',
              new DtMcpError(
                'INTERNAL_ERROR',
                error instanceof Error
                  ? error.message
                  : 'Invalid MCP bridge request.',
              ),
            ),
          )}\n`,
        );
        return;
      }

      void handleRequest(request.request)
        .then(
          (result): DtMcpBridgeResponse => ({
            id: request.id,
            success: true,
            result,
          }),
          (error): DtMcpBridgeResponse =>
            serializeBridgeError(request.id, error),
        )
        .then((response) => {
          socket.end(`${JSON.stringify(response)}\n`);
        });
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(endpoint, () => {
      server.off('error', reject);
      resolve();
    });
  });

  return {
    endpoint,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          void (
            shouldRemoveStaleEndpoint
              ? rm(endpoint, { force: true })
              : Promise.resolve()
          ).then(() => resolve(), reject);
        });
      }),
  };
};

export type { DtMcpErrorCode };

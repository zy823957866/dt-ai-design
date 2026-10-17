import * as z from 'zod/v4';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type {
  CallToolResult,
  ToolAnnotations,
} from '@modelcontextprotocol/sdk/types.js';

import {
  DT_MCP_CONFIG_NAME,
  DT_MCP_SERVER_VERSION,
  DtMcpError,
  type DtMcpAppClient,
} from './types';

const READ_ONLY: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const MUTATING: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: false,
};

const SERVER_INSTRUCTIONS =
  'You edit the dt-ai-design canvas through the execute tool. Read app state and nodes before editing. Prefer many small, verifiable execute calls over one large one. On failure, patch the snippet with edits + the returned editId instead of resending it. Use get_screenshot / TakeScreenshot to verify visuals.';

const jsonContent = (value: unknown): CallToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
});

const errorContent = (error: unknown): CallToolResult => {
  const normalized =
    error instanceof DtMcpError
      ? error
      : new DtMcpError(
          'INTERNAL_ERROR',
          error instanceof Error
            ? error.message
            : 'Unknown dt-ai-design MCP error.',
        );
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          error: { code: normalized.code, message: normalized.message },
        }),
      },
    ],
  };
};

const withToolErrors =
  <TInput>(handler: (input: TInput) => Promise<CallToolResult>) =>
  async (input: TInput): Promise<CallToolResult> => {
    try {
      return await handler(input);
    } catch (error) {
      return errorContent(error);
    }
  };

export const createDtMcpServer = ({
  appClient,
}: {
  appClient: DtMcpAppClient;
}): McpServer => {
  const server = new McpServer(
    { name: DT_MCP_CONFIG_NAME, version: DT_MCP_SERVER_VERSION },
    { instructions: SERVER_INSTRUCTIONS },
  );

  server.registerTool(
    'get_app_state',
    {
      title: 'Get dt-ai-design app state',
      description:
        'Get whether the app is running, the active project, selection context and current revision.',
      annotations: READ_ONLY,
    },
    withToolErrors(async () => jsonContent(await appClient.getAppState())),
  );

  server.registerTool(
    'get_selected_node',
    {
      title: 'Get selected layer',
      description:
        'Get the selected layer and its descendant tree from the active project.',
      annotations: READ_ONLY,
    },
    withToolErrors(async () => jsonContent(await appClient.getSelectedNode())),
  );

  server.registerTool(
    'get_nodes',
    {
      title: 'Get layers',
      description:
        'Get one or more layers (with descendants) from the active project by id.',
      inputSchema: {
        nodeIds: z
          .array(z.string().min(1))
          .min(1)
          .max(100)
          .describe('Layer identifiers from the active project.'),
      },
      annotations: READ_ONLY,
    },
    withToolErrors(async ({ nodeIds }) =>
      jsonContent(await appClient.getNodes({ nodeIds: [...new Set(nodeIds)] })),
    ),
  );

  server.registerTool(
    'get_variables',
    {
      title: 'Get design variables',
      description:
        'Get the design variables ("tokens") defined in the document.',
      annotations: READ_ONLY,
    },
    withToolErrors(async () => jsonContent(await appClient.getVariables())),
  );

  server.registerTool(
    'get_screenshot',
    {
      title: 'Get layer screenshot',
      description:
        'Render a frame without editor chrome. Defaults to the current selection. Use it as the visual reference for verification.',
      inputSchema: {
        nodeId: z
          .string()
          .min(1)
          .optional()
          .describe('Optional frame id. Defaults to the current selection.'),
      },
      annotations: READ_ONLY,
    },
    withToolErrors(async ({ nodeId }) => {
      const screenshot = await appClient.getScreenshot({ nodeId });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              nodeId: screenshot.nodeId,
              width: screenshot.width,
              height: screenshot.height,
            }),
          },
          {
            type: 'image',
            data: screenshot.data,
            mimeType: screenshot.mimeType,
          },
        ],
      };
    }),
  );

  server.registerTool(
    'execute',
    {
      title: 'Execute canvas snippet',
      description:
        'Run a small JavaScript snippet against the live canvas document. Mutations are transactional: on error everything is reverted and an editId is returned so you can patch the snippet with edits. Avoid comments; keep snippets small.',
      inputSchema: {
        code: z
          .string()
          .min(1)
          .describe('JavaScript snippet using the canvas API.'),
        edits: z
          .array(
            z.object({
              find: z.string().min(1),
              replace: z.string(),
              all: z.boolean().optional(),
            }),
          )
          .optional()
          .describe('Patch edits applied to a previously failed snippet.'),
        editId: z
          .string()
          .optional()
          .describe('The editId returned by a previous failed execute call.'),
      },
      annotations: MUTATING,
    },
    withToolErrors(async ({ code, edits, editId }) =>
      jsonContent(await appClient.execute({ code, edits, editId })),
    ),
  );

  return server;
};

export const startDtMcpStdioServer = async ({
  appClient,
}: {
  appClient: DtMcpAppClient;
}): Promise<McpServer> => {
  const server = createDtMcpServer({ appClient });
  await server.connect(new StdioServerTransport());
  return server;
};

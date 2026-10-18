import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type {
  AgentExecRequest,
  AgentExecResult,
  AgentProvider,
} from '@dt-ai-design/agent-provider-core';

import {
  buildAgentsMd,
  buildDesignRequest,
  buildSchemaMd,
  buildToolsMd,
} from '../prompts';
import { buildCodexMcpArgs, buildOpencodeMcpConfig } from '../mcpConfig';
import { buildCanvasWorkspace } from '../workspace';
import { runCanvasAgentSession } from '../session';

describe('prompts', () => {
  it('AGENTS.md teaches the execute workflow and placeholder rule', () => {
    const md = buildAgentsMd();
    expect(md).toContain('execute');
    expect(md).toContain('placeholder');
    expect(md).toContain('editId');
  });

  it('schema.md and tools.md describe the document model and API', () => {
    expect(buildSchemaMd()).toContain('DesignDocument');
    const tools = buildToolsMd();
    for (const fn of ['Insert', 'Get', 'TakeScreenshot', 'SetVariables']) {
      expect(tools).toContain(fn);
    }
  });

  it('wraps the user request', () => {
    expect(buildDesignRequest('做一个落地页')).toContain('做一个落地页');
  });
});

describe('mcpConfig', () => {
  const spec = {
    name: 'dt-ai-design',
    command: 'node',
    args: ['/tmp/sidecar.mjs', '--bridge-endpoint', '/tmp/pipe'],
  };

  it('builds codex -c overrides', () => {
    const args = buildCodexMcpArgs(spec);
    expect(args).toEqual([
      '-c',
      'mcp_servers.dt-ai-design.command="node"',
      '-c',
      'mcp_servers.dt-ai-design.args=["/tmp/sidecar.mjs","--bridge-endpoint","/tmp/pipe"]',
    ]);
  });

  it('builds the opencode local mcp config', () => {
    const config = buildOpencodeMcpConfig(spec);
    expect(config.mcp).toHaveProperty('dt-ai-design');
  });
});

describe('workspace', () => {
  it('writes AGENTS.md / schema.md / tools.md', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'dt-canvas-ws-'));
    const workspace = await buildCanvasWorkspace({ dir });
    expect(workspace.files).toHaveLength(3);
    const agents = await readFile(path.join(dir, 'AGENTS.md'), 'utf8');
    expect(agents).toContain('画布设计智能体');
  });

  it('writes opencode.json with the canvas MCP server when provided', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'dt-canvas-ws-'));
    await buildCanvasWorkspace({
      dir,
      opencodeMcp: {
        name: 'dt-ai-design',
        command: 'node',
        args: ['sidecar.mjs', '--bridge-endpoint', 'pipe'],
      },
    });
    const config = JSON.parse(
      await readFile(path.join(dir, 'opencode.json'), 'utf8'),
    ) as { mcp: Record<string, { type: string; command: string[] }> };
    expect(config.mcp['dt-ai-design'].type).toBe('local');
    expect(config.mcp['dt-ai-design'].command).toEqual([
      'node',
      'sidecar.mjs',
      '--bridge-endpoint',
      'pipe',
    ]);
  });
});

describe('runCanvasAgentSession', () => {
  it('injects codex mcp args and forwards the wrapped prompt', async () => {
    let captured: AgentExecRequest | undefined;
    const provider: AgentProvider = {
      async execute(request: AgentExecRequest): Promise<AgentExecResult> {
        captured = request;
        return { conversationId: 'thread_1', text: 'ok' };
      },
    };

    const result = await runCanvasAgentSession('画一个登录页', {
      provider,
      tool: 'codex',
      cwd: '/tmp/ws',
      model: 'gpt-5',
      mcpServer: { name: 'dt-ai-design', command: 'node', args: ['x'] },
    });

    expect(result.conversationId).toBe('thread_1');
    expect(captured?.cwd).toBe('/tmp/ws');
    expect(captured?.access).toBe('workspace-write');
    expect(captured?.prompt).toContain('画一个登录页');
    expect(captured?.extraArgs?.[1]).toContain(
      'mcp_servers.dt-ai-design.command',
    );
  });

  it('resumes an existing conversation when an id is provided', async () => {
    let captured: AgentExecRequest | undefined;
    const provider: AgentProvider = {
      async execute(request: AgentExecRequest): Promise<AgentExecResult> {
        captured = request;
        return {
          conversationId:
            request.conversation?.type === 'resume'
              ? request.conversation.id
              : 'new',
          text: '',
        };
      },
    };

    await runCanvasAgentSession('继续', {
      provider,
      tool: 'opencode',
      cwd: '/tmp/ws',
      conversationId: 'ses_42',
      mcpServer: { name: 'dt-ai-design', command: 'opencode', args: [] },
    });

    expect(captured?.conversation).toEqual({ type: 'resume', id: 'ses_42' });
  });
});

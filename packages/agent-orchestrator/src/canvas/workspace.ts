import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { buildOpencodeMcpConfig, type McpServerSpec } from './mcpConfig';
import { buildAgentsMd, buildSchemaMd, buildToolsMd } from './prompts';

export interface CanvasWorkspace {
  dir: string;
  files: string[];
}

const WORKSPACE_FILES = {
  'AGENTS.md': buildAgentsMd,
  'schema.md': buildSchemaMd,
  'tools.md': buildToolsMd,
} as const;

/**
 * 在指定目录生成运行工作区。
 *
 * 除 AGENTS.md / schema.md / tools.md 外，当传入 `opencodeMcp` 时额外写入
 * `opencode.json`（OpenCode 会读取运行目录里的项目配置），把画布 MCP 服务
 * 注册给本次运行。
 */
export const buildCanvasWorkspace = async ({
  dir,
  opencodeMcp,
}: {
  dir: string;
  opencodeMcp?: McpServerSpec;
}): Promise<CanvasWorkspace> => {
  await mkdir(dir, { recursive: true });
  const files: Record<string, string> = {
    'AGENTS.md': WORKSPACE_FILES['AGENTS.md'](),
    'schema.md': WORKSPACE_FILES['schema.md'](),
    'tools.md': WORKSPACE_FILES['tools.md'](),
  };
  if (opencodeMcp) {
    files['opencode.json'] = `${JSON.stringify(
      buildOpencodeMcpConfig(opencodeMcp),
      null,
      2,
    )}\n`;
  }
  const entries = Object.entries(files);
  await Promise.all(
    entries.map(([name, content]) =>
      writeFile(path.join(dir, name), content, 'utf8'),
    ),
  );
  return { dir, files: entries.map(([name]) => path.join(dir, name)) };
};

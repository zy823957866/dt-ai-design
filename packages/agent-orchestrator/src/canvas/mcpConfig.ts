/** 把 dt-ai-design MCP 服务注入到各 CLI 的配置。 */

export const DT_MCP_SERVER_NAME = 'dt-ai-design';

export interface McpServerSpec {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

/** codex：通过 -c mcp_servers.<name>.* 覆盖注入（不改全局配置）。 */
export const buildCodexMcpArgs = (spec: McpServerSpec): string[] => {
  const prefix = `mcp_servers.${spec.name}`;
  const args = [
    '-c',
    `${prefix}.command=${JSON.stringify(spec.command)}`,
    '-c',
    `${prefix}.args=${JSON.stringify(spec.args)}`,
  ];
  if (spec.env && Object.keys(spec.env).length > 0) {
    args.push('-c', `${prefix}.env=${JSON.stringify(spec.env)}`);
  }
  return args;
};

export interface OpencodeMcpConfig {
  $schema: string;
  mcp: Record<string, unknown>;
}

/** opencode：生成其 config.json 的 mcp 片段（写入项目级 opencode.json）。 */
export const buildOpencodeMcpConfig = (
  spec: McpServerSpec,
): OpencodeMcpConfig => ({
  $schema: 'https://opencode.ai/config.json',
  mcp: {
    [spec.name]: {
      type: 'local',
      command: [spec.command, ...spec.args],
      enabled: true,
      ...(spec.env ? { environment: spec.env } : {}),
    },
  },
});

/** opencode：附加 CLI 参数（local MCP 从项目配置读取，无需额外参数）。 */
export const buildOpencodeMcpArgs = (): string[] => [];

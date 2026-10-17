import { createDtMcpBridgeClient } from './bridge';
import { startDtMcpStdioServer } from './server';

const argValue = (flag: string): string | undefined => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const endpoint =
  argValue('--bridge-endpoint') ?? process.env.DT_MCP_BRIDGE_ENDPOINT;

if (!endpoint) {
  process.stderr.write('dt-ai-design-mcp: missing --bridge-endpoint\n');
  process.exit(1);
}

void startDtMcpStdioServer({
  appClient: createDtMcpBridgeClient({ endpoint }),
}).catch((error: unknown) => {
  process.stderr.write(
    `dt-ai-design-mcp: ${
      error instanceof Error ? error.message : String(error)
    }\n`,
  );
  process.exit(1);
});

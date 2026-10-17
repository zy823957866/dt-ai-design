import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const resolveSrc = (relative: string) =>
  fileURLToPath(new URL(relative, import.meta.url));

const srcDir = resolveSrc('./src');

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${srcDir}/` },
      {
        find: '@dt-ai-design/design-schema',
        replacement: resolveSrc('../../packages/design-schema/src/index.ts'),
      },
      {
        find: '@dt-ai-design/design-canvas-tools',
        replacement: resolveSrc(
          '../../packages/design-canvas-tools/src/index.ts',
        ),
      },
      {
        find: '@dt-ai-design/dt-ai-design-mcp',
        replacement: resolveSrc('../../packages/dt-ai-design-mcp/src/index.ts'),
      },
      {
        find: '@dt-ai-design/agent-orchestrator',
        replacement: resolveSrc(
          '../../packages/agent-orchestrator/src/index.ts',
        ),
      },
      {
        find: '@dt-ai-design/agent-protocol',
        replacement: resolveSrc('../../packages/agent-protocol/src/index.ts'),
      },
      {
        find: '@dt-ai-design/agent-runtime',
        replacement: resolveSrc('../../packages/agent-runtime/src/index.ts'),
      },
      {
        find: '@dt-ai-design/agent-provider-core',
        replacement: resolveSrc(
          '../../packages/agent-provider-core/src/index.ts',
        ),
      },
      {
        find: '@dt-ai-design/editor-core',
        replacement: resolveSrc('../../packages/editor-core/src/index.ts'),
      },
      {
        find: '@dt-ai-design/editor-interaction',
        replacement: resolveSrc(
          '../../packages/editor-interaction/src/index.ts',
        ),
      },
    ],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});

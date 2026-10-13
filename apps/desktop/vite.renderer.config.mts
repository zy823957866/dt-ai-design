import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// https://vitejs.dev/config
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // 注意：更具体的 style.css 必须排在包名别名之前，否则会被前缀匹配劫持
      '@dt-ai-design/canvas-ruler/style.css': path.resolve(
        __dirname,
        '../../packages/canvas-ruler/src/styles/ruler.css',
      ),
      '@dt-ai-design/canvas-ruler': path.resolve(
        __dirname,
        '../../packages/canvas-ruler/src/index.ts',
      ),
    },
  },
  server: {
    port: 4700,
    strictPort: true,
  },
});

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
      '@dt-ai-design/canvas-ruler/style.css': path.resolve(
        __dirname,
        '../../packages/canvas-ruler/src/styles/ruler.css',
      ),
    },
  },
  server: {
    port: 4700,
    strictPort: true,
  },
});

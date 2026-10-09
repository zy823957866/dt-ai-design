import { defineConfig } from 'vite';
import UnoCSS from 'unocss/vite';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [UnoCSS()],
  server: {
    port: 4700,
    strictPort: true,
  },
});

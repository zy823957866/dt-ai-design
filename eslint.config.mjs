import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/out/**',
      '**/.vite/**',
      '**/coverage/**',
      '**/*.tsbuildinfo',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...js.configs.recommended,
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['**/*.{ts,mts,cts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: [
      'apps/desktop/src/main.ts',
      'apps/desktop/src/preload.ts',
      'apps/desktop/*.mts',
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['apps/desktop/src/renderer.ts'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  eslintConfigPrettier,
);

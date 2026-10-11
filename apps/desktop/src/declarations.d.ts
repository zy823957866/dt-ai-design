/// <reference types="vite/client" />
/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />

import type { DesktopAPI } from './shared/ipc-types';

declare global {
  interface Window {
    desktopAPI: DesktopAPI;
  }
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

export {};

import { contextBridge, ipcRenderer } from 'electron';
import {
  IpcProjectChannel,
  IpcSettingsChannel,
  IpcAppChannel,
  IpcGenerationChannel,
  type DesktopAPI,
  type OpenDialogOptions,
  type SaveDialogOptions,
  type GenerationProgress,
} from './shared/ipc-types';
import type { DesignDocument } from '@dt-ai-design/design-schema';

const api: DesktopAPI = {
  // ─── 项目 ──────────────────────────────────────────────

  listProjects: () => ipcRenderer.invoke(IpcProjectChannel.LIST),

  createProject: (name: string) =>
    ipcRenderer.invoke(IpcProjectChannel.CREATE, name),

  openProject: (id: string) => ipcRenderer.invoke(IpcProjectChannel.OPEN, id),

  deleteProject: (id: string) =>
    ipcRenderer.invoke(IpcProjectChannel.DELETE, id),

  renameProject: (id: string, name: string) =>
    ipcRenderer.invoke(IpcProjectChannel.RENAME, id, name),

  saveProject: (id: string, doc: DesignDocument) =>
    ipcRenderer.invoke(IpcProjectChannel.SAVE, id, doc),

  importProject: (filePath: string) =>
    ipcRenderer.invoke(IpcProjectChannel.IMPORT, filePath),

  // ─── 设置 ──────────────────────────────────────────────

  getSettings: () => ipcRenderer.invoke(IpcSettingsChannel.GET),

  setSettings: (settings) =>
    ipcRenderer.invoke(IpcSettingsChannel.SET, settings),

  // ─── 应用 ──────────────────────────────────────────────

  getVersion: () => ipcRenderer.invoke(IpcAppChannel.GET_VERSION),

  showOpenDialog: (options: OpenDialogOptions) =>
    ipcRenderer.invoke(IpcAppChannel.SHOW_OPEN_DIALOG, options),

  showSaveDialog: (options: SaveDialogOptions) =>
    ipcRenderer.invoke(IpcAppChannel.SHOW_SAVE_DIALOG, options),

  // ─── AI 生成 ───────────────────────────────────────────

  startGeneration: (prompt: string, document: DesignDocument) =>
    ipcRenderer.invoke(IpcGenerationChannel.START, prompt, document),

  cancelGeneration: (runId: string) =>
    ipcRenderer.invoke(IpcGenerationChannel.CANCEL, runId),

  onGenerationProgress: (callback) => {
    const handler = (_event: unknown, progress: GenerationProgress) => {
      callback(progress);
    };
    ipcRenderer.on(IpcGenerationChannel.PROGRESS, handler);
    return () => {
      ipcRenderer.removeListener(IpcGenerationChannel.PROGRESS, handler);
    };
  },
};

contextBridge.exposeInMainWorld('desktopAPI', api);

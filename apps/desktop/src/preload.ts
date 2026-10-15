import { contextBridge, ipcRenderer } from 'electron';
import {
  IpcProjectChannel,
  IpcSettingsChannel,
  IpcAppChannel,
  IpcGenerationChannel,
  IpcAgentChannel,
  type DesktopAPI,
  type OpenDialogOptions,
  type SaveDialogOptions,
  type GenerationEvent,
  type GenerationStartInput,
  type AgentTool,
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

  // ─── Agent ─────────────────────────────────────────────

  listModels: (tool: AgentTool) =>
    ipcRenderer.invoke(IpcAgentChannel.LIST_MODELS, tool),

  // ─── AI 生成 ───────────────────────────────────────────

  startGeneration: (input: GenerationStartInput) =>
    ipcRenderer.invoke(IpcGenerationChannel.START, input),

  cancelGeneration: (runId: string) =>
    ipcRenderer.invoke(IpcGenerationChannel.CANCEL, runId),

  resetGenerationThread: (projectId: string) =>
    ipcRenderer.invoke(IpcGenerationChannel.RESET, projectId),

  onGenerationEvent: (callback) => {
    const handler = (_event: unknown, generationEvent: GenerationEvent) => {
      callback(generationEvent);
    };
    ipcRenderer.on(IpcGenerationChannel.EVENT, handler);
    return () => {
      ipcRenderer.removeListener(IpcGenerationChannel.EVENT, handler);
    };
  },
};

contextBridge.exposeInMainWorld('desktopAPI', api);

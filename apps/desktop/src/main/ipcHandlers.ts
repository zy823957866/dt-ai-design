import { ipcMain, dialog, app } from 'electron';
import {
  IpcProjectChannel,
  IpcSettingsChannel,
  IpcAppChannel,
  IpcGenerationChannel,
  type OpenDialogOptions,
  type SaveDialogOptions,
} from '../shared/ipc-types';
import * as projectStore from './projectStore';
import * as settingsStore from './settings';
import type { DesignDocument } from '@dt-ai-design/design-schema';

/**
 * 注册所有 IPC 处理器
 */
export function registerIpcHandlers(): void {
  // ─── 项目 ──────────────────────────────────────────────

  ipcMain.handle(IpcProjectChannel.LIST, async () => {
    return projectStore.listProjects();
  });

  ipcMain.handle(IpcProjectChannel.CREATE, async (_event, name: string) => {
    return projectStore.createProject(name);
  });

  ipcMain.handle(IpcProjectChannel.OPEN, async (_event, id: string) => {
    return projectStore.openProject(id);
  });

  ipcMain.handle(IpcProjectChannel.DELETE, async (_event, id: string) => {
    await projectStore.deleteProject(id);
  });

  ipcMain.handle(
    IpcProjectChannel.RENAME,
    async (_event, id: string, name: string) => {
      await projectStore.renameProject(id, name);
    },
  );

  ipcMain.handle(
    IpcProjectChannel.SAVE,
    async (_event, id: string, doc: DesignDocument) => {
      await projectStore.saveProject(id, doc);
    },
  );

  ipcMain.handle(IpcProjectChannel.IMPORT, async (_event, filePath: string) => {
    return projectStore.importProject(filePath);
  });

  // ─── 设置 ──────────────────────────────────────────────

  ipcMain.handle(IpcSettingsChannel.GET, async () => {
    return settingsStore.getSettings();
  });

  ipcMain.handle(
    IpcSettingsChannel.SET,
    async (_event, patch: Record<string, unknown>) => {
      return settingsStore.setSettings(patch);
    },
  );

  // ─── 应用 ──────────────────────────────────────────────

  ipcMain.handle(IpcAppChannel.GET_VERSION, () => {
    return app.getVersion();
  });

  ipcMain.handle(
    IpcAppChannel.SHOW_OPEN_DIALOG,
    async (_event, options: OpenDialogOptions) => {
      const result = await dialog.showOpenDialog({
        title: options.title,
        filters: options.filters,
        properties: options.properties,
      });
      return result.canceled ? null : result.filePaths;
    },
  );

  ipcMain.handle(
    IpcAppChannel.SHOW_SAVE_DIALOG,
    async (_event, options: SaveDialogOptions) => {
      const result = await dialog.showSaveDialog({
        title: options.title,
        defaultPath: options.defaultPath,
        filters: options.filters,
      });
      return result.canceled ? null : result.filePath;
    },
  );

  // ─── AI 生成（占位） ───────────────────────────────────

  ipcMain.handle(
    IpcGenerationChannel.START,
    async (_event, _prompt: string, _document: DesignDocument) => {
      void _event;
      void _prompt;
      void _document;
      // TODO: Phase 8 实现
      return `run_${Date.now()}`;
    },
  );

  ipcMain.handle(
    IpcGenerationChannel.CANCEL,
    async (_event, _runId: string) => {
      void _event;
      void _runId;
      // TODO: Phase 8 实现
    },
  );
}

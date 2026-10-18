import { ipcMain, dialog, app } from 'electron';
import {
  IpcProjectChannel,
  IpcSettingsChannel,
  IpcAppChannel,
  IpcGenerationChannel,
  IpcAgentChannel,
  type OpenDialogOptions,
  type SaveDialogOptions,
  type GenerationStartInput,
} from '../shared/ipc-types';
import type { AgentTool } from '@dt-ai-design/agent-provider-core';
import * as projectStore from './projectStore';
import * as settingsStore from './settings';
import { CanvasAgentRuntime } from './canvasAgentRuntime';
import { toolRegistry, resolveToolCommand } from './toolRegistry';
import type { DesignDocument } from '@dt-ai-design/design-schema';

let canvasAgentRuntime: CanvasAgentRuntime | null = null;

/** 懒创建画布智能体运行时（首次调用时 app 已 ready）。 */
function getCanvasAgentRuntime(): CanvasAgentRuntime {
  if (!canvasAgentRuntime) {
    canvasAgentRuntime = new CanvasAgentRuntime({ app });
  }
  return canvasAgentRuntime;
}

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
    async (_event, id: string, doc: DesignDocument, thumbnail?: string) => {
      await projectStore.saveProject(id, doc, thumbnail);
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

  // ─── Agent ─────────────────────────────────────────────

  ipcMain.handle(
    IpcAgentChannel.LIST_MODELS,
    async (_event, tool: AgentTool) => {
      const definition = toolRegistry[tool];
      if (!definition) return [];
      const command = resolveToolCommand(tool);
      try {
        return await definition.listModels({ command });
      } catch (error) {
        console.error(
          `[listModels] tool=${tool} command=${command} error=`,
          error,
        );
        return [];
      }
    },
  );

  // ─── AI 生成 ───────────────────────────────────────────

  ipcMain.handle(
    IpcGenerationChannel.START,
    async (event, input: GenerationStartInput) => {
      return getCanvasAgentRuntime().start(event.sender, input);
    },
  );

  ipcMain.handle(IpcGenerationChannel.CANCEL, async (_event, runId: string) => {
    getCanvasAgentRuntime().cancel(runId);
  });

  ipcMain.handle(
    IpcGenerationChannel.RESET,
    async (_event, projectId: string) => {
      getCanvasAgentRuntime().resetThread(projectId);
    },
  );
}

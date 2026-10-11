/**
 * IPC 通道类型定义 —— main 进程与 renderer 进程共用
 *
 * 所有 IPC 通道必须在此处声明类型，确保两侧类型一致。
 */

import type { DesignDocument } from '@dt-ai-design/design-schema';

// ─── 项目 ────────────────────────────────────────────────

export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

export interface ProjectWithDocument extends ProjectMeta {
  document: DesignDocument;
}

export const IpcProjectChannel = {
  LIST: 'project:list',
  CREATE: 'project:create',
  OPEN: 'project:open',
  DELETE: 'project:delete',
  RENAME: 'project:rename',
  SAVE: 'project:save',
  IMPORT: 'project:import',
} as const;

// ─── 应用设置 ────────────────────────────────────────────

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  recentProjects: string[];
  autoSave: boolean;
  autoSaveInterval: number;
}

export const IpcSettingsChannel = {
  GET: 'settings:get',
  SET: 'settings:set',
} as const;

// ─── 应用通用 ────────────────────────────────────────────

export const IpcAppChannel = {
  GET_VERSION: 'app:getVersion',
  GET_PATH: 'app:getPath',
  SHOW_OPEN_DIALOG: 'app:showOpenDialog',
  SHOW_SAVE_DIALOG: 'app:showSaveDialog',
} as const;

// ─── AI 生成 ─────────────────────────────────────────────

export interface GenerationProgress {
  runId: string;
  status: 'idle' | 'planning' | 'generating' | 'verifying' | 'done' | 'error';
  message?: string;
  progress: number;
}

export const IpcGenerationChannel = {
  START: 'generation:start',
  CANCEL: 'generation:cancel',
  PROGRESS: 'generation:progress',
} as const;

// ─── Preload API 类型 ────────────────────────────────────

export interface DesktopAPI {
  // Project
  listProjects: () => Promise<ProjectMeta[]>;
  createProject: (name: string) => Promise<ProjectWithDocument>;
  openProject: (id: string) => Promise<ProjectWithDocument>;
  deleteProject: (id: string) => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;
  saveProject: (id: string, doc: DesignDocument) => Promise<void>;
  importProject: (filePath: string) => Promise<ProjectWithDocument>;

  // Settings
  getSettings: () => Promise<AppSettings>;
  setSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;

  // App
  getVersion: () => Promise<string>;
  showOpenDialog: (options: OpenDialogOptions) => Promise<string[] | null>;
  showSaveDialog: (options: SaveDialogOptions) => Promise<string | null>;

  // Generation
  startGeneration: (
    prompt: string,
    document: DesignDocument,
  ) => Promise<string>;
  cancelGeneration: (runId: string) => Promise<void>;
  onGenerationProgress: (
    callback: (progress: GenerationProgress) => void,
  ) => () => void;
}

export interface OpenDialogOptions {
  title?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
}

export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

/**
 * IPC 通道类型定义 —— main 进程与 renderer 进程共用
 *
 * 所有 IPC 通道必须在此处声明类型，确保两侧类型一致。
 */

import type { DesignDocument } from '@dt-ai-design/design-schema';
import type {
  AgentTool,
  AgentModelInfo,
} from '@dt-ai-design/agent-provider-core';
export type { AgentTool, AgentModelInfo };

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
  tool: AgentTool;
  model: string;
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

/** codex bash 命令执行活动（时间线展示用）。 */
export interface GenerationActivity {
  id: string;
  kind: 'bash';
  status: 'running' | 'completed' | 'failed';
  input: { command: string };
  output?: { summary: string };
  error?: { code: string; message: string };
}

export type GenerationStage =
  | 'planning'
  | 'executing'
  | 'validating'
  | 'repairing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/** main → renderer 的生成事件流。 */
export type GenerationEvent =
  | { type: 'stage'; runId: string; stage: GenerationStage; message?: string }
  | { type: 'activity'; runId: string; activity: GenerationActivity }
  | { type: 'message'; runId: string; text: string }
  | {
      type: 'document';
      runId: string;
      revision: number;
      document: DesignDocument;
    }
  | {
      type: 'done';
      runId: string;
      status: 'completed' | 'failed' | 'cancelled';
      error?: string;
    };

export interface GenerationStartInput {
  projectId: string;
  prompt: string;
  document: DesignDocument;
  tool: AgentTool;
  model?: string;
}

export type GenerationStartResult =
  { success: true; runId: string } | { success: false; error: string };

export const IpcGenerationChannel = {
  START: 'generation:start',
  CANCEL: 'generation:cancel',
  RESET: 'generation:reset',
  EVENT: 'generation:event',
} as const;

export const IpcAgentChannel = {
  LIST_MODELS: 'agent:listModels',
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
    input: GenerationStartInput,
  ) => Promise<GenerationStartResult>;
  cancelGeneration: (runId: string) => Promise<void>;
  /** 丢弃项目的 AI 会话上下文，下次生成开新会话。 */
  resetGenerationThread: (projectId: string) => Promise<void>;
  onGenerationEvent: (callback: (event: GenerationEvent) => void) => () => void;

  // Agent
  listModels: (tool: AgentTool) => Promise<AgentModelInfo[]>;
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

export const DT_MCP_CONFIG_NAME = 'dt-ai-design';
export const DT_MCP_SERVER_VERSION = '1.0.0';

export type DtMcpErrorCode =
  | 'APP_NOT_RUNNING'
  | 'EXECUTE_FAILED'
  | 'INTERNAL_ERROR'
  | 'INVALID_NODE_TYPE'
  | 'NO_ACTIVE_EDITOR'
  | 'NO_SELECTION'
  | 'NODE_NOT_FOUND'
  | 'RENDERER_UNAVAILABLE'
  | 'SCREENSHOT_FAILED'
  | 'STALE_REVISION';

export class DtMcpError extends Error {
  readonly code: DtMcpErrorCode;

  constructor(code: DtMcpErrorCode, message: string) {
    super(message);
    this.name = 'DtMcpError';
    this.code = code;
  }
}

export interface DtMcpActiveProject {
  id: string | null;
  title: string;
}

export interface DtMcpAppState {
  isRunning: boolean;
  activeProject: DtMcpActiveProject | null;
  selectedNodeId: string | null;
  documentVersion: string | null;
  revision: number | null;
  placeholders?: string[];
}

export interface DtMcpNodeContext {
  project: DtMcpActiveProject;
  revision: number;
  selectedNodeId: string | null;
  layers: Record<string, unknown>;
  rootLayerIds: string[];
  variables: Record<string, { type: string; value: unknown }>;
}

export interface DtMcpVariables {
  revision: number;
  variables: Record<string, { type: string; value: unknown }>;
}

export interface DtMcpScreenshot {
  nodeId: string;
  width: number;
  height: number;
  data: string;
  mimeType: string;
}

export interface DtMcpEdit {
  find: string;
  replace: string;
  all?: boolean;
}

export interface DtMcpExecuteInput {
  code: string;
  edits?: DtMcpEdit[];
  editId?: string;
}

export interface DtMcpExecuteResult {
  ok: boolean;
  revision: number;
  refs: Record<string, string>;
  output: string[];
  warnings: { code: string; message: string; nodeId?: string }[];
  screenshotNodeIds: string[];
  documentChanged: boolean;
  error?: { message: string; editId: string };
}

export type DtMcpAppRequest =
  | { method: 'get_app_state' }
  | { method: 'get_selected_node' }
  | { method: 'get_nodes'; nodeIds: string[] }
  | { method: 'get_variables' }
  | { method: 'get_screenshot'; nodeId?: string }
  | { method: 'execute'; code: string; edits?: DtMcpEdit[]; editId?: string };

export type DtMcpAppResult =
  | DtMcpAppState
  | DtMcpNodeContext
  | DtMcpVariables
  | DtMcpScreenshot
  | DtMcpExecuteResult;

export interface DtMcpAppClient {
  getAppState(): Promise<DtMcpAppState>;
  getSelectedNode(): Promise<DtMcpNodeContext>;
  getNodes(input: { nodeIds: string[] }): Promise<DtMcpNodeContext>;
  getVariables(): Promise<DtMcpVariables>;
  getScreenshot(input: { nodeId?: string }): Promise<DtMcpScreenshot>;
  execute(input: DtMcpExecuteInput): Promise<DtMcpExecuteResult>;
}

export interface DtMcpBridgeRequest {
  id: string;
  request: DtMcpAppRequest;
}

export type DtMcpBridgeResponse =
  | { id: string; success: true; result: DtMcpAppResult }
  | {
      id: string;
      success: false;
      error: { code: DtMcpErrorCode; message: string };
    };

export const isDtMcpErrorCode = (value: string): value is DtMcpErrorCode =>
  [
    'APP_NOT_RUNNING',
    'EXECUTE_FAILED',
    'INTERNAL_ERROR',
    'INVALID_NODE_TYPE',
    'NO_ACTIVE_EDITOR',
    'NO_SELECTION',
    'NODE_NOT_FOUND',
    'RENDERER_UNAVAILABLE',
    'SCREENSHOT_FAILED',
    'STALE_REVISION',
  ].includes(value);

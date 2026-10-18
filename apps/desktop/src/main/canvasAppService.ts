import {
  serializeNode,
  type CanvasSession,
} from '@dt-ai-design/design-canvas-tools';
import {
  DtMcpError,
  type DtMcpAppRequest,
  type DtMcpAppResult,
  type DtMcpNodeContext,
  type DtMcpScreenshot,
} from '@dt-ai-design/dt-ai-design-mcp';
import type { DesignDocument } from '@dt-ai-design/design-schema';

export interface CanvasScreenshot {
  dataUrl: string;
  width: number;
  height: number;
  mimeType: string;
}

export interface CanvasAppServiceDeps {
  session: CanvasSession;
  project: { id: string | null; title: string };
  documentVersion: string;
  getSelection(): string | null;
  captureScreenshot?(nodeId?: string): Promise<CanvasScreenshot>;
  onExecute?(
    request: { code: string; editId?: string },
    result: ReturnType<CanvasSession['execute']>,
  ): void;
  onDocumentChanged?(document: DesignDocument, revision: number): void;
}

const stripDataUrl = (dataUrl: string): string => {
  const comma = dataUrl.indexOf(',');
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
};

/** 把 MCP 请求路由到画布会话（纯逻辑，便于单测）。 */
export const createCanvasAppService = (deps: CanvasAppServiceDeps) => {
  const { session } = deps;

  const nodeContext = (ids: string[]): DtMcpNodeContext => {
    const document = session.document();
    const layers: Record<string, unknown> = {};
    for (const id of ids) {
      if (!document.layers[id]) {
        throw new DtMcpError('NODE_NOT_FOUND', `Node not found: ${id}`);
      }
      layers[id] = serializeNode(document, id, Number.POSITIVE_INFINITY);
    }
    return {
      project: deps.project,
      revision: session.revision(),
      selectedNodeId: deps.getSelection(),
      layers,
      rootLayerIds: document.rootLayerIds,
      variables: Object.fromEntries(
        Object.entries(document.variables).map(([name, variable]) => [
          name,
          { type: variable.type, value: variable.value },
        ]),
      ),
    };
  };

  return async (request: DtMcpAppRequest): Promise<DtMcpAppResult> => {
    switch (request.method) {
      case 'get_app_state':
        return {
          isRunning: true,
          activeProject: deps.project,
          selectedNodeId: deps.getSelection(),
          documentVersion: deps.documentVersion,
          revision: session.revision(),
          placeholders: session.placeholders(),
        };

      case 'get_selected_node': {
        const selected = deps.getSelection();
        if (!selected) {
          throw new DtMcpError('NO_SELECTION', 'No layer is selected.');
        }
        return nodeContext([selected]);
      }

      case 'get_nodes':
        return nodeContext(request.nodeIds);

      case 'get_variables': {
        const document = session.document();
        return {
          revision: session.revision(),
          variables: Object.fromEntries(
            Object.entries(document.variables).map(([name, variable]) => [
              name,
              { type: variable.type, value: variable.value },
            ]),
          ),
        };
      }

      case 'get_screenshot': {
        if (!deps.captureScreenshot) {
          throw new DtMcpError(
            'SCREENSHOT_FAILED',
            'Screenshot is unavailable.',
          );
        }
        const nodeId = request.nodeId ?? deps.getSelection() ?? undefined;
        const shot = await deps.captureScreenshot(nodeId);
        return {
          nodeId: nodeId ?? 'document',
          width: shot.width,
          height: shot.height,
          data: stripDataUrl(shot.dataUrl),
          mimeType: shot.mimeType,
        } satisfies DtMcpScreenshot;
      }

      case 'execute': {
        const result = session.execute(request.code, {
          edits: request.edits,
          editId: request.editId,
        });
        deps.onExecute?.(
          { code: request.code, editId: request.editId },
          result,
        );
        if (result.documentChanged) {
          deps.onDocumentChanged?.(session.document(), result.revision);
        }
        return result;
      }

      default:
        throw new DtMcpError('INTERNAL_ERROR', 'Unsupported MCP request.');
    }
  };
};

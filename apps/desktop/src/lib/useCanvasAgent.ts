import { useCallback, useEffect, useRef, useState } from 'react';

import type { AgentTool } from '@dt-ai-design/agent-provider-core';
import type { DesignDocument } from '@dt-ai-design/design-schema';

import type {
  GenerationAgent,
  GenerationEvent,
  GenerationWarning,
} from '@/shared/ipc-types';
import { useEditor } from '@/lib/editor';
import { normalizeTextSizes } from '@/lib/textMetrics';

/** Pencil 式时间线条目：用户 / 助手 / 阶段 / 工具调用块。 */
export type CanvasAgentItem =
  | { id: string; kind: 'user'; text: string }
  | { id: string; kind: 'assistant'; text: string }
  | { id: string; kind: 'stage'; message: string; spin: boolean }
  | {
      id: string;
      kind: 'tool';
      callId: string;
      tool: string;
      status: 'running' | 'ok' | 'error';
      code: string;
      editId?: string;
      agentId?: string;
      regionId?: string;
      output?: string[];
      refs?: Record<string, string>;
      warnings?: GenerationWarning[];
      error?: { message: string; editId?: string };
      screenshots?: string[];
    };

export interface CanvasAgentStartOptions {
  tool: AgentTool;
  model?: string;
  multiAgent?: boolean;
}

export interface CanvasAgentController {
  items: CanvasAgentItem[];
  agents: GenerationAgent[];
  isRunning: boolean;
  error: string | null;
  start: (prompt: string, options?: CanvasAgentStartOptions) => Promise<void>;
  cancel: () => Promise<void>;
  reset: () => Promise<void>;
}

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${seq++}`;

/**
 * 画布智能体控制器（Pencil 式）。
 *
 * 每次 execute 显示为一个「工具调用」块：状态、源码、refs、Print 输出、
 * warnings、错误（含 editId）与截图；document 事件落到编辑器（可撤销）。
 */
export function useCanvasAgent({
  projectId,
}: {
  projectId?: string;
}): CanvasAgentController {
  const editor = useEditor();
  const [items, setItems] = useState<CanvasAgentItem[]>([]);
  const [agents, setAgents] = useState<GenerationAgent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef(editor);
  editorRef.current = editor;
  const runIdRef = useRef<string | null>(null);

  useEffect(() => {
    const api = window.desktopAPI;
    if (!api?.onGenerationEvent) return;

    return api.onGenerationEvent((event: GenerationEvent) => {
      switch (event.type) {
        case 'stage': {
          const spin =
            event.stage === 'planning' ||
            event.stage === 'editing' ||
            event.stage === 'executing' ||
            event.stage === 'verifying' ||
            event.stage === 'validating' ||
            event.stage === 'repairing';
          setItems((prev) => [
            ...prev.filter((item) => item.kind !== 'stage'),
            {
              id: nextId('stage'),
              kind: 'stage',
              message: event.message ?? event.stage,
              spin,
            },
          ]);
          break;
        }
        case 'agents':
          setAgents(event.agents);
          break;
        case 'tool-call': {
          const input = event.input as
            { code?: string; editId?: string } | undefined;
          setItems((prev) => [
            ...prev,
            {
              id: nextId('tool'),
              kind: 'tool',
              callId: event.callId,
              tool: event.tool,
              status: 'running',
              code: input?.code ?? '',
              editId: input?.editId,
              agentId: event.agentId,
              regionId: event.regionId,
            },
          ]);
          break;
        }
        case 'tool-result': {
          setItems((prev) =>
            prev.map((item) =>
              item.kind === 'tool' && item.callId === event.callId
                ? {
                    ...item,
                    status: event.ok ? 'ok' : 'error',
                    output: event.output,
                    refs: event.refs,
                    warnings: event.warnings,
                    error: event.error,
                  }
                : item,
            ),
          );
          break;
        }
        case 'screenshot': {
          const images = event.images ?? [];
          if (images.length === 0) break;
          setItems((prev) => {
            const index = prev.map((item) => item.kind).lastIndexOf('tool');
            if (index < 0) return prev;
            const next = [...prev];
            const item = next[index];
            if (item.kind === 'tool') {
              next[index] = { ...item, screenshots: images };
            }
            return next;
          });
          break;
        }
        case 'message':
          setItems((prev) => [
            ...prev,
            { id: nextId('msg'), kind: 'assistant', text: event.text },
          ]);
          break;
        case 'document':
          editorRef.current.replaceDocument(
            normalizeTextSizes(event.document as DesignDocument).document,
          );
          break;
        case 'done':
          setIsRunning(false);
          runIdRef.current = null;
          if (event.status === 'failed') {
            setError(event.error ?? '生成失败。');
          } else if (event.status === 'cancelled') {
            setItems((prev) => [
              ...prev.filter((item) => item.kind !== 'stage'),
              {
                id: nextId('stage'),
                kind: 'stage',
                message: '已停止',
                spin: false,
              },
            ]);
          }
          break;
        default:
          break;
      }
    });
  }, []);

  const start = useCallback(
    async (
      prompt: string,
      options: CanvasAgentStartOptions = { tool: 'codex' },
    ) => {
      const text = prompt.trim();
      if (!text || isRunning) return;
      if (!projectId) {
        setError('当前文档不在项目内，无法调用 AI 生成。');
        return;
      }

      setError(null);
      setIsRunning(true);
      setItems((prev) => [...prev, { id: nextId('user'), kind: 'user', text }]);

      try {
        const result = await window.desktopAPI.startGeneration({
          projectId,
          prompt: text,
          document: editorRef.current.getDocument(),
          tool: options.tool,
          model: options.model,
          multiAgent: options.multiAgent,
        });
        if (!result.success) {
          setIsRunning(false);
          setError(result.error);
        } else {
          runIdRef.current = result.runId;
        }
      } catch (startError) {
        setIsRunning(false);
        setError(
          startError instanceof Error ? startError.message : '启动生成失败。',
        );
      }
    },
    [projectId, isRunning],
  );

  const cancel = useCallback(async () => {
    const runId = runIdRef.current;
    if (!runId) return;
    try {
      await window.desktopAPI.cancelGeneration(runId);
    } catch {
      // 取消失败忽略
    }
  }, []);

  const reset = useCallback(async () => {
    if (isRunning) return;
    setItems([]);
    setAgents([]);
    setError(null);
    if (!projectId) return;
    try {
      await window.desktopAPI.resetGenerationThread(projectId);
    } catch {
      // 重置失败忽略
    }
  }, [projectId, isRunning]);

  return { items, agents, isRunning, error, start, cancel, reset };
}

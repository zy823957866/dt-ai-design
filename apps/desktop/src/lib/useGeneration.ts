import { useCallback, useEffect, useRef, useState } from 'react';

import type { AgentTool } from '@dt-ai-design/agent-provider-core';
import type { DesignDocument } from '@dt-ai-design/design-schema';

import type { GenerationActivity, GenerationEvent } from '@/shared/ipc-types';
import { useEditor } from '@/lib/editor';

/** Chat 时间线条目。 */
export type ChatTimelineItem =
  | { id: string; kind: 'user'; text: string }
  | { id: string; kind: 'assistant'; text: string }
  | { id: string; kind: 'activity'; activity: GenerationActivity }
  | { id: string; kind: 'stage'; message: string; spin: boolean };

export interface GenerationStartOptions {
  /** 生成使用的工具。 */
  tool: AgentTool;
  /** 传给工具的模型 id；省略时使用默认模型。 */
  model?: string;
}

export interface GenerationController {
  items: ChatTimelineItem[];
  isRunning: boolean;
  error: string | null;
  start: (prompt: string, options?: GenerationStartOptions) => Promise<void>;
  cancel: () => Promise<void>;
  /** 清空时间线并丢弃 main 侧会话上下文（下次生成开新会话）。 */
  reset: () => Promise<void>;
}

let itemSeq = 0;
const nextItemId = (prefix: string) => `${prefix}-${Date.now()}-${itemSeq++}`;

/**
 * AI 生成控制器。
 *
 * 发送需求 → main 进程 codex 生成 → 事件流驱动时间线 →
 * document 事件经 editor.replaceDocument 落到画布（可撤销）。
 */
export function useGeneration({
  projectId,
}: {
  projectId?: string;
}): GenerationController {
  const editor = useEditor();
  const [items, setItems] = useState<ChatTimelineItem[]>([]);
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
          const stageItem: ChatTimelineItem = {
            id: nextItemId('stage'),
            kind: 'stage',
            message: event.message ?? event.stage,
            spin:
              event.stage === 'planning' ||
              event.stage === 'executing' ||
              event.stage === 'validating' ||
              event.stage === 'repairing',
          };
          // 时间线内只保留最新一条 stage 行（瞬时状态）
          setItems((prev) => [
            ...prev.filter((item) => item.kind !== 'stage'),
            stageItem,
          ]);
          break;
        }
        case 'activity': {
          const { activity } = event;
          setItems((prev) => {
            const index = prev.findIndex(
              (item) =>
                item.kind === 'activity' && item.activity.id === activity.id,
            );
            const entry: ChatTimelineItem = {
              id: nextItemId(`act-${activity.id}`),
              kind: 'activity',
              activity,
            };
            if (index >= 0) {
              const next = [...prev];
              next[index] = entry;
              return next;
            }
            return [...prev, entry];
          });
          break;
        }
        case 'message':
          setItems((prev) => [
            ...prev,
            { id: nextItemId('msg'), kind: 'assistant', text: event.text },
          ]);
          break;
        case 'document':
          editorRef.current.replaceDocument(event.document as DesignDocument);
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
                id: nextItemId('stage'),
                kind: 'stage',
                message: '已停止',
                spin: false,
              },
            ]);
          }
          break;
      }
    });
  }, []);

  const start = useCallback(
    async (
      prompt: string,
      options: GenerationStartOptions = { tool: 'codex' },
    ) => {
      const text = prompt.trim();
      if (!text || isRunning) return;
      if (!projectId) {
        setError('当前文档不在项目内，无法调用 AI 生成。');
        return;
      }

      setError(null);
      setIsRunning(true);
      setItems((prev) => [
        ...prev,
        { id: nextItemId('user'), kind: 'user', text },
      ]);

      try {
        const result = await window.desktopAPI.startGeneration({
          projectId,
          prompt: text,
          document: editorRef.current.getDocument(),
          tool: options.tool,
          model: options.model,
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
      // 取消失败忽略，用户可关闭窗口终止
    }
  }, []);

  const reset = useCallback(async () => {
    if (isRunning) return;
    setItems([]);
    setError(null);
    if (!projectId) return;
    try {
      await window.desktopAPI.resetGenerationThread(projectId);
    } catch {
      // 重置失败忽略，下次生成仍可用
    }
  }, [projectId, isRunning]);

  return { items, isRunning, error, start, cancel, reset };
}

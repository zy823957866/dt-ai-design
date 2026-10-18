import { useCallback, useEffect, useState } from 'react';
import type {
  AgentModelInfo,
  AgentTool,
} from '@dt-ai-design/agent-provider-core';

export interface AgentModelController {
  tool: AgentTool;
  model: string;
  models: AgentModelInfo[];
  loading: boolean;
  error: string | null;
  setTool: (tool: AgentTool) => void;
  setModel: (model: string) => void;
}

const TOOLS: AgentTool[] = ['codex', 'opencode'];

export function useAgentModel(): AgentModelController {
  const [tool, setToolState] = useState<AgentTool>('codex');
  const [model, setModelState] = useState('');
  const [models, setModels] = useState<AgentModelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async (nextTool: AgentTool) => {
    setLoading(true);
    setError(null);
    try {
      const list = await window.desktopAPI.listModels(nextTool);
      setModels(list);
      return list;
    } catch (e) {
      setModels([]);
      setError(e instanceof Error ? e.message : '读取模型列表失败。');
      return [] as AgentModelInfo[];
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化：读取持久化选择
  useEffect(() => {
    void (async () => {
      try {
        const settings = await window.desktopAPI.getSettings();
        const initialTool: AgentTool = TOOLS.includes(settings.tool)
          ? settings.tool
          : 'codex';
        setToolState(initialTool);
        const list = await loadModels(initialTool);
        const initialModel = list.some((m) => m.id === settings.model)
          ? settings.model
          : (list[0]?.id ?? '');
        setModelState(initialModel);
      } catch {
        void loadModels('codex');
        setError('设置读取失败');
      }
    })();
  }, [loadModels]);

  const setTool = useCallback(
    (nextTool: AgentTool) => {
      setToolState(nextTool);
      void (async () => {
        const list = await loadModels(nextTool);
        const nextModel = list[0]?.id ?? '';
        setModelState(nextModel);
        await window.desktopAPI.setSettings({
          tool: nextTool,
          model: nextModel,
        });
      })();
    },
    [loadModels],
  );

  const setModel = useCallback((nextModel: string) => {
    setModelState(nextModel);
    void window.desktopAPI.setSettings({ model: nextModel });
  }, []);

  return { tool, model, models, loading, error, setTool, setModel };
}

export const AGENT_TOOLS: Array<{ id: AgentTool; label: string }> = [
  { id: 'codex', label: 'Codex' },
  { id: 'opencode', label: 'OpenCode' },
];

import { createContext, useContext, type ReactNode } from 'react';

import {
  useCanvasAgent,
  type CanvasAgentController,
} from '@/lib/useCanvasAgent';

export const GenerationContext = createContext<CanvasAgentController | null>(
  null,
);

/**
 * 生成状态 Provider。
 *
 * 把 `useCanvasAgent` 提升到编辑器层级，使 LeftPanel（Chat）与 Canvas（光标/扫描）
 * 共享同一份生成状态。必须位于 EditorProvider 之内（useCanvasAgent 依赖 useEditor）。
 */
export function GenerationProvider({
  projectId,
  children,
}: {
  projectId?: string;
  children: ReactNode;
}) {
  const controller = useCanvasAgent({ projectId });
  return (
    <GenerationContext.Provider value={controller}>
      {children}
    </GenerationContext.Provider>
  );
}

export function useGenerationController(): CanvasAgentController {
  const controller = useContext(GenerationContext);
  if (!controller) {
    throw new Error(
      'useGenerationController must be used within GenerationProvider',
    );
  }
  return controller;
}

import { useEffect } from 'react';
import { useEditorInteraction } from '../EditorInteractionProvider';
import { TOOL_GROUPS } from './toolConfig';
import type { CanvasToolId } from '@dt-ai-design/editor-interaction';

export function useToolShortcuts() {
  const { dispatch } = useEditorInteraction();

  useEffect(() => {
    const map = new Map<string, CanvasToolId>();
    for (const g of TOOL_GROUPS) {
      for (const t of g.tools) {
        if (t.enabled && t.shortcut) map.set(t.shortcut.toUpperCase(), t.id);
      }
    }
    map.set('Z', 'zoom');

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') {
        dispatch({ type: 'escape' });
        return;
      }
      const tool = map.get(e.key.toUpperCase());
      if (tool) {
        e.preventDefault();
        dispatch({ type: 'selectTool', tool });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);
}

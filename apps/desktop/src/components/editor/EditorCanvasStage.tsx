import { useEditorState } from '@/lib/editor';

import { Canvas } from '../canvas/Canvas';
import { Toolbar } from './Toolbar';
import { PenSubToolbar } from './toolbar/PenSubToolbar';
import { useToolShortcuts } from './toolbar/useToolShortcuts';

/**
 * Canvas stage orchestrator.
 *
 * Responsibilities:
 * - Composes Canvas (drawing area + rulers + layer rendering + interaction) and Toolbar
 * - Subscribes to editor state; future interaction/overlay/selection layers go here
 * - Provides data-region markers for test and debug targeting
 *
 * Why a separate component:
 *   Canvas.tsx is currently a monolith. Future splits (DocumentRenderer / Viewport /
 *   SelectionOverlay) all need a stable outer orchestrator. EditorCanvasStage is it.
 */
export function EditorCanvasStage() {
  // Subscribe to editor state so this component re-renders on any change.
  // State is intentionally not directly used here yet; future layers
  // (interaction overlay, selection handles, creation preview) will read from it.
  const _state = useEditorState();
  void _state;
  useToolShortcuts();

  return (
    <div className="relative h-full w-full" data-region="editor-canvas-stage">
      <Canvas />
      <Toolbar />
      <PenSubToolbar />
    </div>
  );
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { createEditorInteraction } from '@dt-ai-design/editor-interaction';
import type {
  EditorInteraction,
  InteractionState,
  InteractionEvent,
  InteractionCommand,
} from '@dt-ai-design/editor-interaction';

import { useEditor } from '@/lib/editor';

interface EditorInteractionContextValue {
  interaction: EditorInteraction;
  state: InteractionState;
  dispatch: (event: InteractionEvent) => InteractionCommand[];
}

const EditorInteractionContext =
  createContext<EditorInteractionContextValue | null>(null);

export function EditorInteractionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const editor = useEditor();
  const interactionRef = useRef<EditorInteraction | null>(null);
  const [state, setState] = useState<InteractionState>(() => {
    if (!interactionRef.current) {
      interactionRef.current = createEditorInteraction({
        selectedLayerIds: editor.getSelection().layerIds,
        activeTool: editor.getActiveTool() as InteractionState['activeTool'],
      });
    }
    return interactionRef.current.getState();
  });

  const interaction = interactionRef.current!;

  // Subscribe to interaction state changes
  useEffect(() => {
    return interaction.subscribe(() => {
      setState(interaction.getState());
    });
  }, [interaction]);

  // Sync selectedLayerIds from editor to interaction
  useEffect(() => {
    return editor.subscribe('selectionChange', () => {
      const sel = editor.getSelection().layerIds;
      const current = interaction.getState().selectedLayerIds;
      if (
        sel.length !== current.length ||
        sel.some((id, i) => id !== current[i])
      ) {
        interaction.dispatch({ type: 'setSelection', layerIds: sel });
      }
    });
  }, [editor, interaction]);

  // Bridge: translate interaction commands to editor calls
  const executeCommand = useCallback(
    (cmd: InteractionCommand) => {
      switch (cmd.type) {
        case 'setActiveTool':
          editor.setActiveTool(cmd.tool);
          break;
        case 'selectLayer':
          editor.setSelection(cmd.layerIds);
          break;
        case 'deselectAll':
          editor.deselectAll();
          break;
        case 'createLayer':
          editor.addLayer(cmd.layerType, {
            x: cmd.bounds.x,
            y: cmd.bounds.y,
            width: Math.max(cmd.bounds.width, 1),
            height: Math.max(cmd.bounds.height, 1),
          });
          break;
        case 'moveLayer':
          cmd.layerIds.forEach((id: string) => {
            const layer = editor.getDocument().layers[id];
            if (layer) {
              editor.moveLayer(id, layer.x + cmd.dx, layer.y + cmd.dy);
            }
          });
          break;
        case 'pan':
          editor.pan(cmd.dx, cmd.dy);
          break;
        default:
          break;
      }
    },
    [editor],
  );

  const dispatch = useCallback(
    (event: InteractionEvent): InteractionCommand[] => {
      const commands = interaction.dispatch(event);
      for (const cmd of commands) {
        executeCommand(cmd);
      }
      return commands;
    },
    [interaction, executeCommand],
  );

  return (
    <EditorInteractionContext.Provider value={{ interaction, state, dispatch }}>
      {children}
    </EditorInteractionContext.Provider>
  );
}

export function useEditorInteraction(): EditorInteractionContextValue {
  const ctx = useContext(EditorInteractionContext);
  if (!ctx) {
    throw new Error(
      'useEditorInteraction must be used within EditorInteractionProvider',
    );
  }
  return ctx;
}

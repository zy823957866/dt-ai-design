import { useState, useEffect } from 'react';
import { Minus, ChevronDown } from 'lucide-react';
import { useEditor } from '@/lib/editor';
import type { Layer } from '@dt-ai-design/design-schema';
import { PROPERTY_SECTIONS } from './properties/registry';
import type { PropertyContextValue } from './properties/PropertySection';

interface PropertiesPanelProps {
  collapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  onOpenColor?: () => void;
  onExport?: () => void;
}

export function PropertiesPanel({
  collapsed,
  onCollapse,
  onExpand,
  onExport,
}: PropertiesPanelProps) {
  const editor = useEditor();
  const [, forceUpdate] = useState(0);
  const [tab, setTab] = useState<'design' | 'dev'>('design');

  useEffect(() => {
    const off1 = editor.subscribe('change', () => forceUpdate((t) => t + 1));
    const off2 = editor.subscribe('selectionChange', () =>
      forceUpdate((t) => t + 1),
    );
    return () => {
      off1();
      off2();
    };
  }, [editor]);

  if (collapsed) {
    return (
      <div className="flex w-10 shrink-0 flex-col items-center border-l border-border bg-bg-panel py-2">
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-bg-hover"
          onClick={onExpand}
        >
          <ChevronDown className="h-4 w-4 -rotate-90" />
        </button>
      </div>
    );
  }

  const doc = editor.getDocument();
  const selection = editor.getSelection();
  const layers = selection.layerIds
    .map((id) => doc.layers[id])
    .filter(Boolean) as Layer[];
  const ctx: PropertyContextValue = {
    editor,
    layers,
    layer: layers.length === 1 ? layers[0] : null,
    isMulti: layers.length > 1,
    onExport,
  };

  return (
    <div className="flex w-[300px] shrink-0 flex-col border-l border-border bg-bg-panel">
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="text-[12.5px] font-semibold text-text-primary">
          Properties
        </span>
        <button
          className="text-text-tertiary hover:text-text-secondary"
          onClick={onCollapse}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-4 pt-3">
        <div className="flex h-[30px] rounded-lg bg-bg-input p-[3px]">
          {(['design', 'dev'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex h-[22px] flex-1 items-center justify-center rounded-md text-xs capitalize transition-colors ${
                tab === t
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'dev' ? (
        <div className="flex-1 overflow-y-auto p-4">
          <pre className="rounded-lg border border-border bg-bg-panel-deep p-3 font-mono text-[11px] leading-relaxed text-text-secondary">
            {`/* ${layers[0]?.name ?? 'canvas'} */\n/* Live CSS / Tailwind output */`}
          </pre>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
          {layers.length === 0 ? (
            <div className="pt-10 text-center text-xs text-text-tertiary">
              Nothing selected
            </div>
          ) : (
            PROPERTY_SECTIONS.filter((s) => s.isAvailable(ctx)).map((s) => (
              <s.Component key={s.id} ctx={ctx} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Grid3x3, Ruler, Layers } from 'lucide-react';
import { useEditor } from '@/lib/editor';

export function StatusBar() {
  const editor = useEditor();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const off1 = editor.subscribe('viewportChange', () =>
      forceUpdate((t) => t + 1),
    );
    const off2 = editor.subscribe('change', () => forceUpdate((t) => t + 1));
    const off3 = editor.subscribe('selectionChange', () =>
      forceUpdate((t) => t + 1),
    );
    return () => {
      off1();
      off2();
      off3();
    };
  }, [editor]);

  const viewport = editor.getViewport();
  const selection = editor.getSelection();

  const x = Math.round(-viewport.panX / viewport.zoom);
  const y = Math.round(-viewport.panY / viewport.zoom);

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t border-border bg-bg-panel px-4 text-[11px]">
      <div className="flex items-center gap-4 text-text-tertiary">
        <span>
          X {x}&nbsp;&nbsp;·&nbsp;&nbsp;Y {y}
        </span>
        <span>{Math.round(viewport.zoom * 100)}%</span>
      </div>

      <div className="flex items-center gap-3 text-text-tertiary">
        <Grid3x3 className="h-[13px] w-[13px]" />
        <Ruler className="h-[13px] w-[13px]" />
        <Layers className="h-[13px] w-[13px]" />
        <span className="text-text-secondary">
          {selection.layerIds.length} selected
        </span>
        <span className="h-[7px] w-[7px] rounded-full bg-success" />
        <span>Saved</span>
      </div>
    </footer>
  );
}

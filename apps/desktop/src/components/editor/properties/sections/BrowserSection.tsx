import { NumberField } from '../controls/NumberField';
import { SectionHeader } from '../controls/SectionHeader';
import type { PropertySection, PropertyContextValue } from '../PropertySection';
import type { BrowserLayer } from '@dt-ai-design/design-schema';

function BrowserPanel({ ctx }: { ctx: PropertyContextValue }) {
  const { layer, editor } = ctx;
  if (!layer || layer.type !== 'browser') return null;
  const browser = layer as BrowserLayer;

  return (
    <>
      <SectionHeader label="Browser" />
      <div className="mb-1.5 flex h-7 items-center gap-1 rounded-md bg-bg-input px-2">
        <span className="text-[10.5px] text-text-tertiary">URL</span>
        <input
          key={`${browser.id}-url`}
          defaultValue={browser.url}
          placeholder="https://example.com"
          onBlur={(e) =>
            editor.setLayerProperty(browser.id, 'url', e.target.value)
          }
          className="h-6 w-full min-w-0 border-0 bg-transparent p-0 text-[11.5px] text-text-primary outline-none"
        />
      </div>
      <NumberField
        label="Zoom"
        min={0.1}
        max={4}
        step={0.1}
        value={browser.zoom}
        onCommit={(v) => editor.setLayerProperty(browser.id, 'zoom', v)}
      />
    </>
  );
}

export const BrowserSection: PropertySection = {
  id: 'browser',
  title: 'Browser',
  isAvailable: (ctx) => ctx.layer?.type === 'browser',
  Component: BrowserPanel,
};

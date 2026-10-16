import { NumberField } from '../controls/NumberField';
import { SectionHeader } from '../controls/SectionHeader';
import { SegmentedControl } from '../controls/SegmentedControl';
import { CheckboxField } from '../controls/CheckboxField';
import type { PropertySection, PropertyContextValue } from '../PropertySection';
import type { FrameLayer, FrameLayout } from '@dt-ai-design/design-schema';

const MODES = [
  { value: 'none' as const, label: 'Freeform' },
  { value: 'vertical' as const, label: 'Vertical' },
  { value: 'horizontal' as const, label: 'Horizontal' },
];

function LayoutPanel({ ctx }: { ctx: PropertyContextValue }) {
  const { layer, editor } = ctx;
  if (!layer || layer.type !== 'frame') return null;
  const frame = layer as FrameLayer;
  const layout = frame.layout;
  const padding = layout.padding ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const sizing = frame.sizingMode ?? { width: 'fixed', height: 'fixed' };
  const set = (patch: Partial<FrameLayout>) =>
    editor.setLayerProperty(frame.id, 'layout', { ...layout, ...patch });
  const setPadding = (key: keyof FrameLayout['padding'], v: number) =>
    set({ padding: { ...padding, [key]: v } });

  return (
    <>
      <SectionHeader
        label={layout.mode === 'none' ? 'Layout' : 'Flex Layout'}
      />
      <SegmentedControl
        value={layout.mode}
        options={MODES}
        onChange={(mode) => set({ mode })}
      />
      {layout.mode !== 'none' && (
        <>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <NumberField
              label="Gap"
              min={0}
              value={layout.gap}
              onCommit={(v) => set({ gap: v })}
            />
            <NumberField
              label="Pad"
              min={0}
              value={padding.top}
              onCommit={(v) =>
                set({ padding: { top: v, right: v, bottom: v, left: v } })
              }
            />
            <NumberField
              label="T"
              min={0}
              value={padding.top}
              onCommit={(v) => setPadding('top', v)}
            />
            <NumberField
              label="R"
              min={0}
              value={padding.right}
              onCommit={(v) => setPadding('right', v)}
            />
            <NumberField
              label="B"
              min={0}
              value={padding.bottom}
              onCommit={(v) => setPadding('bottom', v)}
            />
            <NumberField
              label="L"
              min={0}
              value={padding.left}
              onCommit={(v) => setPadding('left', v)}
            />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <CheckboxField
              id="fill-width"
              label="Fill Width"
              checked={sizing.width === 'fillContainer'}
              onChange={(v) =>
                editor.setLayerProperty(frame.id, 'sizingMode', {
                  ...sizing,
                  width: v ? 'fillContainer' : 'fixed',
                })
              }
            />
            <CheckboxField
              id="hug-width"
              label="Hug Width"
              checked={sizing.width === 'hugContents'}
              onChange={(v) =>
                editor.setLayerProperty(frame.id, 'sizingMode', {
                  ...sizing,
                  width: v ? 'hugContents' : 'fixed',
                })
              }
            />
          </div>
        </>
      )}
    </>
  );
}

export const LayoutSection: PropertySection = {
  id: 'layout',
  title: 'Layout',
  isAvailable: (ctx) => ctx.layers.length > 0,
  Component: LayoutPanel,
};

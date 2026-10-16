import { NumberField } from '../controls/NumberField';
import { SectionHeader } from '../controls/SectionHeader';
import { SegmentedControl } from '../controls/SegmentedControl';
import type { PropertySection, PropertyContextValue } from '../PropertySection';
import type { TextLayer } from '@dt-ai-design/design-schema';

const H_ALIGN = [
  { value: 'left' as const, label: 'Left' },
  { value: 'center' as const, label: 'Center' },
  { value: 'right' as const, label: 'Right' },
  { value: 'justify' as const, label: 'Justify' },
];
const V_ALIGN = [
  { value: 'top' as const, label: 'Top' },
  { value: 'middle' as const, label: 'Middle' },
  { value: 'bottom' as const, label: 'Bottom' },
];
const SIZING = [
  { value: 'autoWidth' as const, label: 'Auto width' },
  { value: 'autoHeight' as const, label: 'Auto height' },
  { value: 'fixed' as const, label: 'Fixed size' },
];

function TypographyPanel({ ctx }: { ctx: PropertyContextValue }) {
  const { layer, editor } = ctx;
  if (!layer || layer.type !== 'text') return null;
  const t = layer as TextLayer;
  const set = (key: string, value: unknown) =>
    editor.setLayerProperty(t.id, key, value);

  return (
    <>
      <SectionHeader label="Typography" />
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Size"
          min={0}
          value={t.fontSize}
          onCommit={(v) => set('fontSize', v)}
        />
        <NumberField
          label="Weight"
          min={100}
          max={900}
          value={t.fontWeight}
          onCommit={(v) => set('fontWeight', v)}
        />
        <NumberField
          label="Line"
          suffix="%"
          min={0}
          value={Math.round((t.lineHeight / t.fontSize) * 100)}
          onCommit={(v) => set('lineHeight', (v / 100) * t.fontSize)}
        />
        <NumberField
          label="LS"
          suffix="px"
          value={t.letterSpacing}
          onCommit={(v) => set('letterSpacing', v)}
        />
      </div>
      <div className="mt-2">
        <SegmentedControl
          value={t.textAlign}
          options={H_ALIGN}
          onChange={(v) => set('textAlign', v)}
        />
      </div>
      <div className="mt-2">
        <SegmentedControl
          value={t.verticalAlign}
          options={V_ALIGN}
          onChange={(v) => set('verticalAlign', v)}
        />
      </div>
      <div className="mt-3 text-[11px] text-text-tertiary">Resizing</div>
      <div className="mt-1.5">
        <SegmentedControl
          value={t.sizing}
          options={SIZING}
          onChange={(v) => set('sizing', v)}
        />
      </div>
    </>
  );
}

export const TypographySection: PropertySection = {
  id: 'typography',
  title: 'Typography',
  isAvailable: (ctx) => ctx.layer?.type === 'text',
  Component: TypographyPanel,
};

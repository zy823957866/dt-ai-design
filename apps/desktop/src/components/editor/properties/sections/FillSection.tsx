import { Plus, Minus } from 'lucide-react';
import { SectionHeader } from '../controls/SectionHeader';
import { ColorField } from '../controls/ColorField';
import { SelectField } from '../controls/SelectField';
import { NumberField } from '../controls/NumberField';
import type { PropertySection, PropertyContextValue } from '../PropertySection';
import type { FillStyle, RectangleLayer } from '@dt-ai-design/design-schema';

const TYPES = [
  { value: 'solid', label: 'Color' },
  { value: 'linearGradient', label: 'Linear' },
  { value: 'radialGradient', label: 'Radial' },
  { value: 'angularGradient', label: 'Angular' },
  { value: 'image', label: 'Image' },
];

function FillPanel({ ctx }: { ctx: PropertyContextValue }) {
  const { layer, editor } = ctx;
  if (!layer) return null;
  const fills = ((layer as RectangleLayer).fills ?? []) as FillStyle[];
  const add = () =>
    editor.appendStyleItem(layer.id, 'fills', {
      type: 'solid',
      color: '#CCCCCC',
      opacity: 1,
    });
  const update = (i: number, patch: Partial<FillStyle>) =>
    editor.updateStyleItem(layer.id, 'fills', i, patch);
  const remove = (i: number) => editor.removeStyleItem(layer.id, 'fills', i);

  return (
    <>
      <SectionHeader
        label="Fill"
        action={
          <button
            type="button"
            onClick={add}
            className="text-text-tertiary hover:text-text-secondary"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        }
      />
      {fills.map((fill, i) => (
        <div key={i} className="mb-2 flex items-center gap-2">
          <SelectField
            value={fill.type}
            options={TYPES}
            onChange={(v) => update(i, { type: v as FillStyle['type'] })}
          />
          <ColorField
            color={fill.color ?? '#000000'}
            onCommit={(c) => update(i, { color: c })}
          />
          <NumberField
            label="O"
            suffix="%"
            min={0}
            max={100}
            value={Math.round((fill.opacity ?? 1) * 100)}
            onCommit={(v) => update(i, { opacity: v / 100 })}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-text-tertiary hover:text-text-secondary"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </>
  );
}

export const FillSection: PropertySection = {
  id: 'fill',
  title: 'Fill',
  isAvailable: (ctx) => ctx.layer != null && 'fills' in ctx.layer,
  Component: FillPanel,
};

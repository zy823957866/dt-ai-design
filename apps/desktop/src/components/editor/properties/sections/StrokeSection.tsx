import { Plus, Minus } from 'lucide-react';
import { SectionHeader } from '../controls/SectionHeader';
import { ColorField } from '../controls/ColorField';
import { SelectField } from '../controls/SelectField';
import { NumberField } from '../controls/NumberField';
import type { PropertySection, PropertyContextValue } from '../PropertySection';
import type { StrokeStyle, RectangleLayer } from '@dt-ai-design/design-schema';

const POSITIONS = [
  { value: 'center', label: 'Center' },
  { value: 'inside', label: 'Inside' },
  { value: 'outside', label: 'Outside' },
];
const JOINS = [
  { value: 'miter', label: 'Miter' },
  { value: 'round', label: 'Round' },
  { value: 'bevel', label: 'Bevel' },
];
const CAPS = [
  { value: 'flat', label: 'Butt' },
  { value: 'square', label: 'Square' },
  { value: 'round', label: 'Round' },
];

function StrokePanel({ ctx }: { ctx: PropertyContextValue }) {
  const { layer, editor } = ctx;
  if (!layer) return null;
  const strokes = ((layer as RectangleLayer).strokes ?? []) as StrokeStyle[];
  const add = () =>
    editor.appendStyleItem(layer.id, 'strokes', {
      color: '#000000',
      width: 1,
      style: 'solid',
      position: 'center',
      opacity: 1,
    });
  const update = (i: number, patch: Partial<StrokeStyle>) =>
    editor.updateStyleItem(layer.id, 'strokes', i, patch);
  const remove = (i: number) => editor.removeStyleItem(layer.id, 'strokes', i);
  const first = strokes[0];

  return (
    <>
      <SectionHeader
        label="Stroke"
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
      {strokes.map((stroke, i) => (
        <div key={i} className="mb-2 flex items-center gap-2">
          <ColorField
            color={stroke.color}
            onCommit={(c) => update(i, { color: c })}
          />
          <NumberField
            label="W"
            min={0}
            value={stroke.width}
            onCommit={(v) => update(i, { width: v })}
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
      {first && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          <SelectField
            value={first.position}
            options={POSITIONS}
            onChange={(v) =>
              update(0, { position: v as StrokeStyle['position'] })
            }
          />
          <SelectField
            value={first.join ?? 'miter'}
            options={JOINS}
            onChange={(v) => update(0, { join: v as StrokeStyle['join'] })}
          />
          <SelectField
            value={first.cap ?? 'flat'}
            options={CAPS}
            onChange={(v) => update(0, { cap: v as StrokeStyle['cap'] })}
          />
        </div>
      )}
    </>
  );
}

export const StrokeSection: PropertySection = {
  id: 'stroke',
  title: 'Stroke',
  isAvailable: (ctx) => ctx.layer != null && 'strokes' in ctx.layer,
  Component: StrokePanel,
};

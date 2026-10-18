import { Plus, Minus } from 'lucide-react';
import { SectionHeader } from '../controls/SectionHeader';
import { NumberField } from '../controls/NumberField';
import { ColorField } from '../controls/ColorField';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { PropertySection, PropertyContextValue } from '../PropertySection';
import type {
  EffectStyle,
  EffectType,
  RectangleLayer,
} from '@dt-ai-design/design-schema';

const EFFECT_OPTIONS: { type: EffectType; label: string }[] = [
  { type: 'dropShadow', label: 'Drop Shadow' },
  { type: 'innerShadow', label: 'Inner Shadow' },
  { type: 'layerBlur', label: 'Layer Blur' },
  { type: 'backgroundBlur', label: 'Background Blur' },
];

function EffectsPanel({ ctx }: { ctx: PropertyContextValue }) {
  const { layer, editor } = ctx;
  if (!layer) return null;
  const effects = ((layer as RectangleLayer).effects ?? []) as EffectStyle[];
  const add = (type: EffectType) =>
    editor.appendStyleItem(layer.id, 'effects', {
      type,
      x: 0,
      y: 0,
      blur: 12,
      spread: 0,
      color: '#000000',
      opacity: 0.25,
    });
  const update = (i: number, patch: Partial<EffectStyle>) =>
    editor.updateStyleItem(layer.id, 'effects', i, patch);
  const remove = (i: number) => editor.removeStyleItem(layer.id, 'effects', i);

  return (
    <>
      <SectionHeader
        label="Effects"
        action={
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="text-text-tertiary hover:text-text-secondary"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="left" sideOffset={8} className="w-40 p-1">
              {EFFECT_OPTIONS.map((o) => (
                <button
                  key={o.type}
                  type="button"
                  onClick={() => add(o.type)}
                  className="flex w-full rounded-sm px-2 py-1.5 text-left text-xs text-text-secondary hover:bg-bg-hover"
                >
                  {o.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        }
      />
      {effects.map((effect, i) => (
        <div key={i} className="mb-2 rounded-md bg-bg-input p-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-secondary">
              {effect.type}
            </span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-text-tertiary hover:text-text-secondary"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
          </div>
          {(effect.type === 'dropShadow' || effect.type === 'innerShadow') && (
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              <NumberField
                label="X"
                value={effect.x ?? 0}
                onCommit={(v) => update(i, { x: v })}
              />
              <NumberField
                label="Y"
                value={effect.y ?? 0}
                onCommit={(v) => update(i, { y: v })}
              />
              <NumberField
                label="B"
                min={0}
                value={effect.blur ?? 0}
                onCommit={(v) => update(i, { blur: v })}
              />
            </div>
          )}
          {(effect.type === 'layerBlur' ||
            effect.type === 'backgroundBlur') && (
            <div className="mt-1.5">
              <NumberField
                label="Blur"
                min={0}
                value={effect.blur ?? 0}
                onCommit={(v) => update(i, { blur: v })}
              />
            </div>
          )}
          {(effect.type === 'dropShadow' || effect.type === 'innerShadow') && (
            <div className="mt-1.5">
              <ColorField
                color={effect.color ?? '#000000'}
                onCommit={(c) => update(i, { color: c })}
              />
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export const EffectsSection: PropertySection = {
  id: 'effects',
  title: 'Effects',
  isAvailable: (ctx) => ctx.layer != null && 'effects' in ctx.layer,
  Component: EffectsPanel,
};

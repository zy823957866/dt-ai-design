import { NumberField } from '../controls/NumberField';
import { SectionHeader } from '../controls/SectionHeader';
import { CheckboxField } from '../controls/CheckboxField';
import type { PropertySection, PropertyContextValue } from '../PropertySection';
import type { Layer } from '@dt-ai-design/design-schema';

function read(layers: Layer[], get: (l: Layer) => number | undefined) {
  if (layers.length === 0) return undefined;
  const first = get(layers[0]);
  return layers.every((l) => get(l) === first) ? first : undefined;
}

function write(ctx: PropertyContextValue, key: string, value: unknown) {
  ctx.layers.forEach((l) => ctx.editor.setLayerProperty(l.id, key, value));
}

function PositionPanel({ ctx }: { ctx: PropertyContextValue }) {
  const { layers } = ctx;
  return (
    <>
      <SectionHeader label="Position" />
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="X"
          value={read(layers, (l) => l.x)}
          onCommit={(v) => write(ctx, 'x', v)}
        />
        <NumberField
          label="Y"
          value={read(layers, (l) => l.y)}
          onCommit={(v) => write(ctx, 'y', v)}
        />
        <NumberField
          label="W"
          min={0}
          value={read(layers, (l) => l.width)}
          onCommit={(v) =>
            layers.forEach((l) => ctx.editor.resizeLayer(l.id, v, l.height))
          }
        />
        <NumberField
          label="H"
          min={0}
          value={read(layers, (l) => l.height)}
          onCommit={(v) =>
            layers.forEach((l) => ctx.editor.resizeLayer(l.id, l.width, v))
          }
        />
        <NumberField
          label="∠"
          suffix="°"
          value={read(layers, (l) => l.rotation)}
          onCommit={(v) => write(ctx, 'rotation', v)}
        />
      </div>
      <div className="mt-2">
        <CheckboxField
          id="absolute-position"
          label="Absolute Position"
          checked={layers.every((l) => l.layerPosition === 'absolute')}
          onChange={(v) => write(ctx, 'layerPosition', v ? 'absolute' : 'auto')}
        />
      </div>
    </>
  );
}

export const PositionSection: PropertySection = {
  id: 'position',
  title: 'Position',
  isAvailable: (ctx) => ctx.layers.length > 0,
  Component: PositionPanel,
};

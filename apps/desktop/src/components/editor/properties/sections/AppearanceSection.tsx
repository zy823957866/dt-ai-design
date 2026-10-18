import { NumberField } from '../controls/NumberField';
import { SectionHeader } from '../controls/SectionHeader';
import { SelectField } from '../controls/SelectField';
import { CheckboxField } from '../controls/CheckboxField';
import type { PropertySection, PropertyContextValue } from '../PropertySection';
import type {
  EllipseLayer,
  FrameLayer,
  ImageLayer,
  PolygonLayer,
  RectangleLayer,
} from '@dt-ai-design/design-schema';

const BLEND_MODES = [
  'normal',
  'darken',
  'multiply',
  'linearBurn',
  'colorBurn',
  'lighten',
  'screen',
  'linearDodge',
  'colorDodge',
  'overlay',
  'softLight',
  'hardLight',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));

function cornerValue(cr: number | { topLeft: number }): number {
  return typeof cr === 'number' ? cr : cr.topLeft;
}

function AppearancePanel({ ctx }: { ctx: PropertyContextValue }) {
  const { layer, layers, editor } = ctx;
  if (!layer) return null;
  const set = (key: string, value: unknown) =>
    layers.forEach((l) => editor.setLayerProperty(l.id, key, value));
  const hasCorner =
    layer.type === 'rectangle' ||
    layer.type === 'frame' ||
    layer.type === 'image' ||
    layer.type === 'polygon';

  return (
    <>
      <SectionHeader label="Appearance" />
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Opacity"
          min={0}
          max={100}
          suffix="%"
          value={Math.round(layer.opacity * 100)}
          onCommit={(v) => set('opacity', v / 100)}
        />
        {hasCorner && (
          <NumberField
            label="Radius"
            min={0}
            value={cornerValue(
              (layer as RectangleLayer | FrameLayer | ImageLayer).cornerRadius,
            )}
            onCommit={(v) => set('cornerRadius', v)}
          />
        )}
      </div>
      <div className="mt-2">
        <SelectField
          value={layer.blendMode}
          options={BLEND_MODES}
          onChange={(v) => set('blendMode', v)}
        />
      </div>
      {layer.type === 'ellipse' && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          <NumberField
            label="Start"
            suffix="°"
            min={0}
            value={(layer as EllipseLayer).arcStartAngle}
            onCommit={(v) => set('arcStartAngle', v)}
          />
          <NumberField
            label="Sweep"
            suffix="°"
            min={0}
            value={(layer as EllipseLayer).arcEndAngle}
            onCommit={(v) => set('arcEndAngle', v)}
          />
          <NumberField
            label="Inner"
            suffix="%"
            min={0}
            max={100}
            value={(layer as EllipseLayer).innerRadius}
            onCommit={(v) => set('innerRadius', v)}
          />
        </div>
      )}
      {layer.type === 'polygon' && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <NumberField
            label="Sides"
            min={3}
            max={60}
            value={(layer as PolygonLayer).polygonCount}
            onCommit={(v) =>
              editor.setLayerProperty(layer.id, 'polygonCount', Math.round(v))
            }
          />
          <NumberField
            label="Radius"
            min={0}
            value={cornerValue((layer as PolygonLayer).cornerRadius)}
            onCommit={(v) => set('cornerRadius', v)}
          />
        </div>
      )}
      {layer.type === 'frame' && (
        <div className="mt-2">
          <CheckboxField
            id="clip-content"
            label="Clip Content"
            checked={(layer as FrameLayer).clipContent}
            onChange={(v) =>
              editor.setLayerProperty(layer.id, 'clipContent', v)
            }
          />
        </div>
      )}
    </>
  );
}

export const AppearanceSection: PropertySection = {
  id: 'appearance',
  title: 'Appearance',
  isAvailable: (ctx) => ctx.layers.length > 0,
  Component: AppearancePanel,
};

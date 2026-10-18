import type { PropertySection, PropertyContextValue } from '../PropertySection';

function HeaderPanel({ ctx }: { ctx: PropertyContextValue }) {
  const { layer, layers, isMulti, editor } = ctx;
  if (isMulti) {
    return (
      <div className="rounded-lg bg-bg-input px-2.5 py-2 text-[11.5px] text-text-secondary">
        已选中 {layers.length} 个图层
      </div>
    );
  }
  if (!layer) return null;
  return (
    <div className="flex h-[34px] items-center gap-2 rounded-lg bg-bg-input px-2.5">
      <input
        defaultValue={layer.name}
        key={layer.id}
        onBlur={(e) =>
          editor.setLayerProperty(layer.id, 'name', e.target.value)
        }
        className="h-6 flex-1 border-0 bg-transparent p-0 text-xs text-text-primary outline-none"
      />
    </div>
  );
}

export const HeaderSection: PropertySection = {
  id: 'header',
  title: 'Header',
  isAvailable: (ctx) => ctx.layers.length > 0,
  Component: HeaderPanel,
};

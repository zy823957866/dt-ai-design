import { SectionHeader } from '../controls/SectionHeader';
import type { PropertySection, PropertyContextValue } from '../PropertySection';

function TextRow({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
}) {
  return (
    <div className="mb-1.5 flex h-7 items-center gap-1 rounded-md bg-bg-input px-2">
      <span className="text-[10.5px] text-text-tertiary">{label}</span>
      <input
        defaultValue={value}
        onBlur={(e) => onCommit(e.target.value)}
        className="h-6 w-full min-w-0 border-0 bg-transparent p-0 text-[11.5px] text-text-primary outline-none"
      />
    </div>
  );
}

function MetadataPanel({ ctx }: { ctx: PropertyContextValue }) {
  const { layer, editor } = ctx;
  if (!layer) return null;
  const metadata = layer.metadata ?? {};
  const set = (key: string, value: string) =>
    editor.setLayerProperty(layer.id, 'metadata', {
      ...metadata,
      [key]: value,
    });
  return (
    <>
      <SectionHeader label="Metadata" />
      <TextRow
        key={`${layer.id}-source`}
        label="Source"
        value={metadata.sourceUrl ?? ''}
        onCommit={(v) => set('sourceUrl', v)}
      />
      <TextRow
        key={`${layer.id}-tag`}
        label="Tag"
        value={metadata.htmlId ?? ''}
        onCommit={(v) => set('htmlId', v)}
      />
      <TextRow
        key={`${layer.id}-link`}
        label="Link"
        value={metadata.link ?? ''}
        onCommit={(v) => set('link', v)}
      />
    </>
  );
}

export const MetadataSection: PropertySection = {
  id: 'metadata',
  title: 'Metadata',
  isAvailable: (ctx) => ctx.layer != null,
  Component: MetadataPanel,
};

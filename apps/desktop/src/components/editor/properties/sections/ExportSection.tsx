import { SectionHeader } from '../controls/SectionHeader';
import { SelectField } from '../controls/SelectField';
import type { PropertySection, PropertyContextValue } from '../PropertySection';

const FORMATS = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WEBP' },
  { value: 'pdf', label: 'PDF' },
];
const SCALES = [
  { value: '1', label: '1x' },
  { value: '2', label: '2x' },
  { value: '3', label: '3x' },
];

function ExportPanel({ ctx }: { ctx: PropertyContextValue }) {
  const { onExport } = ctx;
  return (
    <>
      <SectionHeader label="Export" />
      <div className="grid grid-cols-2 gap-2">
        <SelectField value="png" options={FORMATS} onChange={() => {}} />
        <SelectField value="2" options={SCALES} onChange={() => {}} />
      </div>
      <button
        type="button"
        onClick={onExport}
        className="mt-2 h-7 w-full rounded-md bg-accent-soft text-[11.5px] text-accent-text hover:bg-bg-hover"
      >
        Export layer
      </button>
    </>
  );
}

export const ExportSection: PropertySection = {
  id: 'export',
  title: 'Export',
  isAvailable: (ctx) => ctx.layers.length > 0,
  Component: ExportPanel,
};

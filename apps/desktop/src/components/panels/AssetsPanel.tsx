import { Search, Plus, Layers } from 'lucide-react';
import { Overlay, Segmented } from '@/components/overlays/Overlay';

interface AssetsPanelProps {
  onClose?: () => void;
  onOpenIcons?: () => void;
  onOpenVariables?: () => void;
}

const COMPONENTS: Array<[string, string]> = [
  ['Button / Primary', '3 variants'],
  ['Navbar', '2 variants'],
  ['Profile Card', '4 variants'],
  ['Input Field', '2 variants'],
  ['Avatar', '5 variants'],
  ['Badge', '3 variants'],
];

export function AssetsPanel({
  onClose,
  onOpenIcons,
  onOpenVariables,
}: AssetsPanelProps) {
  return (
    <Overlay onClose={onClose} className="h-[860px] w-[720px]">
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="text-[14px] font-semibold text-text-primary">
          Assets
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-text-tertiary hover:text-text-secondary"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-5 pt-4">
        <Segmented
          className="h-[30px] w-[200px]"
          options={[
            { id: 'layers', label: 'Layers' },
            { id: 'assets', label: 'Assets' },
          ]}
          value="assets"
          onChange={() => {}}
        />
      </div>

      <div className="flex items-center gap-1 px-5 pt-3">
        <span className="flex h-[30px] items-center rounded-lg bg-accent px-3.5 text-xs font-semibold text-white">
          Components
        </span>
        <button
          type="button"
          onClick={onOpenIcons}
          className="flex h-[30px] items-center rounded-lg px-3 text-xs font-semibold text-text-secondary hover:bg-bg-hover"
        >
          Icons
        </button>
        <button
          type="button"
          onClick={onOpenVariables}
          className="flex h-[30px] items-center rounded-lg px-3 text-xs font-semibold text-text-secondary hover:bg-bg-hover"
        >
          Variables
        </button>
      </div>

      <div className="px-5 pt-4">
        <div className="flex h-9 items-center gap-2.5 rounded-lg bg-bg-input px-3">
          <Search className="h-[13px] w-[13px] text-text-tertiary" />
          <input
            placeholder="Search components…"
            className="h-6 flex-1 border-0 bg-transparent p-0 text-xs text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </div>
      </div>

      <div className="px-5 pt-4">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Local Components · 6
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3">
        <div className="grid grid-cols-3 gap-3.5">
          {COMPONENTS.map(([name, variants]) => (
            <div
              key={name}
              className="flex h-[151px] flex-col overflow-hidden rounded-[10px] border border-border bg-bg-elevated"
            >
              <div className="flex h-[104px] items-center justify-center gap-1.5 rounded-lg bg-[#1B1B23]">
                <span className="h-4 w-14 rounded bg-accent/70" />
                <span className="h-4 w-8 rounded border border-border-strong" />
              </div>
              <div className="flex h-[47px] flex-col justify-center px-3">
                <span className="text-xs font-semibold text-text-primary">
                  {name}
                </span>
                <span className="text-[10.5px] text-text-tertiary">
                  {variants}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 px-5 pb-5 pt-2">
        <button
          type="button"
          className="flex h-[34px] items-center gap-1.5 rounded-full bg-accent px-3.5 text-xs font-semibold text-white hover:bg-brand-500"
        >
          <Plus className="h-3 w-3" />
          Create Component
        </button>
        <span className="text-[11px] text-text-tertiary">
          Drag components onto the canvas, or click to instance
        </span>
        <Layers className="ml-auto h-3.5 w-3.5 text-text-tertiary" />
      </div>
    </Overlay>
  );
}

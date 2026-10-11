import { Plus, Upload, ChevronDown, Check } from 'lucide-react';
import { Overlay, ModalHeader } from '@/components/overlays/Overlay';

const GROUPS = ['Basic', 'UI', 'Social', 'Arrows', 'Brands'];

export function AddIconDialog({ onClose }: { onClose?: () => void }) {
  return (
    <Overlay onClose={onClose} className="w-[440px]">
      <ModalHeader title="Add icon" onClose={onClose} />
      <div className="px-5 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Icon SVG
        </div>
        <div className="mt-2 flex h-24 flex-col items-center justify-center gap-1.5 rounded-[10px] border border-border bg-bg-input">
          <Upload className="h-[18px] w-[18px] text-text-secondary" />
          <span className="text-[12.5px] text-text-primary">
            Choose SVG file
          </span>
          <span className="text-[10.5px] text-text-tertiary">
            SVG · max 64 KB
          </span>
        </div>

        <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Icon name
        </div>
        <input
          placeholder="e.g. rocket"
          className="mt-2 h-[34px] w-full rounded-lg bg-bg-input px-3 text-xs text-text-primary outline-none placeholder:text-text-tertiary"
        />

        <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Group
        </div>
        <div className="mt-2 flex h-[34px] items-center rounded-lg bg-bg-input px-3">
          <span className="flex-1 text-xs text-text-primary">Basic</span>
          <ChevronDown className="h-3 w-3 text-text-tertiary" />
        </div>
        <div className="mt-2 rounded-lg border border-border bg-bg-elevated p-1.5">
          {GROUPS.map((g, i) => (
            <div
              key={g}
              className={`flex h-7 items-center gap-2 rounded-md px-2.5 ${i === 0 ? 'bg-accent-soft' : ''}`}
            >
              {i === 0 && <Check className="h-3 w-3 text-white" />}
              <span
                className="text-xs"
                style={{ color: i === 0 ? '#FFFFFF' : '#E4E4E7' }}
              >
                {g}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex h-14 items-center justify-end gap-3 border-t border-border px-5">
        <button
          onClick={onClose}
          className="text-xs text-text-secondary hover:text-text-primary"
        >
          Cancel
        </button>
        <button className="flex h-7 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-white hover:bg-brand-500">
          <Plus className="h-3 w-3" />
          Add icon
        </button>
      </div>
    </Overlay>
  );
}

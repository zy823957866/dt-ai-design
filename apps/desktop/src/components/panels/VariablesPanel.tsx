import { Search, X, Plus, RefreshCw } from 'lucide-react';
import { Overlay } from '@/components/overlays/Overlay';

const ROWS: Array<{
  name: string;
  value: string;
  uses: string;
  swatch: string;
}> = [
  { name: '--accent', value: '#7C3AED', uses: '42×', swatch: '#7C3AED' },
  { name: '--primary-500', value: '#6D28D9', uses: '17×', swatch: '#6D28D9' },
  { name: '--surface', value: '#1E1E24', uses: '31×', swatch: '#1E1E24' },
  {
    name: '--text-secondary',
    value: '#9CA3AF',
    uses: '128×',
    swatch: '#9CA3AF',
  },
  { name: '--radius-lg', value: '12px', uses: '12×', swatch: '#2A2A33' },
  {
    name: '--font-display',
    value: 'Inter Display',
    uses: '9×',
    swatch: '#E4E4E7',
  },
];

export function VariablesPanel({ onClose }: { onClose?: () => void }) {
  return (
    <Overlay onClose={onClose} className="h-[640px] w-[560px]">
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="text-[14px] font-semibold text-text-primary">
          Variables
        </span>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-[11.5px] text-text-secondary hover:text-text-primary">
            <RefreshCw className="h-3 w-3" />
            Sync with code
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-text-tertiary hover:text-text-secondary"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="flex h-[34px] items-center gap-2.5 rounded-lg bg-bg-input px-3">
          <Search className="h-[13px] w-[13px] text-text-tertiary" />
          <input
            placeholder="Search variables…"
            className="h-6 flex-1 border-0 bg-transparent p-0 text-xs text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </div>
      </div>

      <div className="px-5 pt-3">
        <div className="flex h-[34px] items-center rounded-lg bg-bg-input p-[3px]">
          <span className="flex h-[26px] flex-1 items-center justify-center rounded-md text-[11.5px] text-text-tertiary">
            All
          </span>
          <span className="flex h-[26px] flex-1 items-center justify-center rounded-md bg-bg-elevated text-[11.5px] text-text-primary">
            Color
          </span>
          {['Size', 'Font', 'Shadow', 'Radius'].map((c) => (
            <span
              key={c}
              className="flex h-[26px] flex-1 items-center justify-center rounded-md text-[11.5px] text-text-tertiary"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 px-6 pt-4 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
        <span className="flex-1">Name</span>
        <span className="w-[60px]">Value</span>
        <span className="w-[40px] text-right">Uses</span>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-5 py-2">
        {ROWS.map((r, i) => (
          <div
            key={r.name}
            className={`flex h-10 items-center gap-2 rounded-lg px-3 ${i === 0 ? 'bg-accent-soft' : ''}`}
          >
            <span
              className="h-[18px] w-[18px] shrink-0 rounded-[5px] border border-border"
              style={{ backgroundColor: r.swatch }}
            />
            <span
              className="flex-1 text-[11.5px]"
              style={{ color: i === 0 ? '#E9D5FF' : '#E4E4E7' }}
            >
              {r.name}
            </span>
            <span className="w-[60px] text-[11px] text-text-secondary">
              {r.value}
            </span>
            <span className="w-[40px] text-right text-[10.5px] text-text-tertiary">
              {r.uses}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 px-5 pb-5 pt-2">
        <button className="flex h-7 items-center gap-1.5 rounded-full bg-accent px-3.5 text-xs font-semibold text-white hover:bg-brand-500">
          <Plus className="h-3 w-3" />
          New variable
        </button>
        <span className="text-[11px] text-text-tertiary">
          24 variables · 2 themes
        </span>
      </div>
    </Overlay>
  );
}

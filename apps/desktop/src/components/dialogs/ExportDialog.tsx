import { useState } from 'react';
import { Folder, Download } from 'lucide-react';
import { Overlay, ModalHeader } from '@/components/overlays/Overlay';

const FORMATS: Array<[string, string]> = [
  ['PNG', '· lossless · transparent'],
  ['JPEG', '· small · no transparency'],
  ['WEBP', '· modern · good for web'],
  ['PDF', '· vector · multi-page'],
  ['SVG', '· vector · scalable'],
  ['HTML', '· code · re-usable'],
];

function Chips({
  options,
  active,
  onSelect,
}: {
  options: string[];
  active: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex h-8 items-center rounded-lg bg-bg-input p-[3px]">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onSelect(o)}
          className={`flex h-[26px] flex-1 items-center justify-center rounded-md text-[11.5px] transition-colors ${
            active === o
              ? 'bg-bg-elevated text-text-primary'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function ExportDialog({ onClose }: { onClose?: () => void }) {
  const [format, setFormat] = useState('PNG');
  const [scale, setScale] = useState('2');
  const [bg, setBg] = useState('Transparent');
  const [range, setRange] = useState('All frames');

  return (
    <Overlay onClose={onClose} className="h-[640px] w-[560px]">
      <ModalHeader title="Export" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Format
        </div>
        <div className="mt-2 space-y-1">
          {FORMATS.map(([name, desc]) => {
            const active = format === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setFormat(name)}
                className={`flex h-[30px] w-full items-center gap-2 rounded-lg px-3 text-left ${active ? 'bg-accent-soft' : 'hover:bg-bg-hover'}`}
              >
                <span
                  className={`h-4 w-4 rounded-full border ${active ? 'border-accent bg-accent' : 'border-border'}`}
                />
                <span
                  className="text-[12.5px]"
                  style={{ color: active ? '#E9D5FF' : '#E4E4E7' }}
                >
                  {name}
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: active ? '#C4B5FD' : '#9CA3AF' }}
                >
                  {desc}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Scale
        </div>
        <div className="mt-2">
          <Chips
            options={['1', '2', '3', 'Custom']}
            active={scale}
            onSelect={setScale}
          />
        </div>

        <div className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Background
        </div>
        <div className="mt-2">
          <Chips
            options={['Transparent', 'White', 'Canvas bg']}
            active={bg}
            onSelect={setBg}
          />
        </div>

        <div className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Range
        </div>
        <div className="mt-2">
          <Chips
            options={['Current frame', 'All frames', 'Selection']}
            active={range}
            onSelect={setRange}
          />
        </div>

        <div className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Output
        </div>
        <div className="mt-2 flex h-9 items-center gap-2 rounded-lg bg-bg-input px-3">
          <Folder className="h-[13px] w-[13px] text-text-tertiary" />
          <span className="flex-1 text-xs text-text-secondary">
            ~/Downloads/mobile-app
          </span>
          <span className="text-[11.5px] text-accent-strong">Browse</span>
        </div>
      </div>

      <div className="flex h-14 shrink-0 items-center justify-end gap-3 border-t border-border px-5">
        <button
          onClick={onClose}
          className="text-xs text-text-secondary hover:text-text-primary"
        >
          Cancel
        </button>
        <button className="flex h-7 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-white hover:bg-brand-500">
          <Download className="h-3 w-3" />
          Export
        </button>
      </div>
    </Overlay>
  );
}

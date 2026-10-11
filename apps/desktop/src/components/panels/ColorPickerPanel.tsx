import { Overlay } from '@/components/overlays/Overlay';

const HUE =
  'linear-gradient(to right,#FF0000,#FFFF00,#00FF00,#00FFFF,#0000FF,#FF00FF,#FF0000)';

const DOC_COLORS = [
  '#7C3AED',
  '#C084FC',
  '#34D399',
  '#38BDF8',
  '#F87171',
  '#FBBF24',
  '#6D28D9',
  '#E4E4E7',
];

const VARS: Array<{
  name: string;
  value: string;
  swatch: string;
  active?: boolean;
}> = [
  { name: '--accent', value: '#7C3AED', swatch: '#7C3AED', active: true },
  { name: '--primary-500', value: '#6D28D9', swatch: '#6D28D9' },
  { name: '--bg-panel', value: '#1E1E24', swatch: '#1E1E24' },
];

export function ColorPickerPanel({ onClose }: { onClose?: () => void }) {
  return (
    <Overlay onClose={onClose} className="w-[420px]">
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="text-[14px] font-semibold text-text-primary">
          Fill
        </span>
        <div className="flex h-7 items-center rounded-lg bg-bg-input p-[3px]">
          <span className="flex h-[22px] items-center rounded-md bg-bg-elevated px-2.5 text-[11px] text-text-primary">
            HEX
          </span>
          <span className="flex h-[22px] items-center rounded-md px-2.5 text-[11px] text-text-tertiary">
            RGB
          </span>
          <span className="flex h-[22px] items-center rounded-md px-2.5 text-[11px] text-text-tertiary">
            HSL
          </span>
        </div>
      </div>

      <div className="px-5 pt-4">
        <div
          className="relative h-[150px] w-full overflow-hidden rounded-[10px]"
          style={{ background: HUE }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to left,#FFFFFF,rgba(255,255,255,0))',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top,rgba(0,0,0,0),#000000)',
            }}
          />
          <span
            className="absolute left-[82%] top-[30%] h-3 w-3 rounded-full border-2 border-white shadow"
            style={{ backgroundColor: '#7C3AED' }}
          />
        </div>
      </div>

      <div className="px-5 pt-4">
        <div
          className="h-3.5 w-full rounded-full"
          style={{ background: HUE }}
        />
        <div className="mt-3 h-3.5 w-full overflow-hidden rounded-full bg-bg-input">
          <div className="h-full w-[75%] bg-accent" />
        </div>
        <div className="mt-1.5 text-right text-[10.5px] text-text-tertiary">
          100%
        </div>
      </div>

      <div className="flex items-center gap-2 px-5 pt-3">
        <div className="flex h-8 flex-1 items-center gap-2 rounded-lg bg-bg-input px-2.5">
          <span
            className="h-[18px] w-[18px] rounded border border-border"
            style={{ backgroundColor: '#7C3AED' }}
          />
          <span className="text-xs text-text-primary">#7C3AED</span>
        </div>
        {(
          [
            ['R', '124'],
            ['G', '58'],
            ['B', '237'],
          ] as const
        ).map(([l, v]) => (
          <div
            key={l}
            className="flex h-8 w-[60px] items-center gap-2 rounded-lg bg-bg-input px-2.5"
          >
            <span className="text-[11px] text-text-tertiary">{l}</span>
            <span className="text-[11.5px] text-text-primary">{v}</span>
          </div>
        ))}
      </div>

      <div className="px-5 pt-5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Document Colors
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {DOC_COLORS.map((c, i) => (
            <span
              key={c}
              className={`h-9 w-9 rounded-lg ${i === 0 ? 'border-2 border-white' : 'border border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="px-5 pt-5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Variables
        </div>
        <div className="mt-2 space-y-1">
          {VARS.map((v) => (
            <div
              key={v.name}
              className={`flex h-[34px] items-center gap-2 rounded-lg px-3 ${v.active ? 'border border-accent bg-accent-soft' : ''}`}
            >
              <span
                className="h-4 w-4 rounded border border-border"
                style={{ backgroundColor: v.swatch }}
              />
              <span
                className="flex-1 text-[11.5px]"
                style={{ color: v.active ? '#E9D5FF' : '#E4E4E7' }}
              >
                {v.name}
              </span>
              <span className="text-[11px] text-text-tertiary">{v.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-5 py-4">
        <button className="text-xs text-accent-strong">+ Add</button>
        <button
          onClick={onClose}
          className="flex h-7 items-center rounded-full bg-accent px-4 text-xs font-semibold text-white hover:bg-brand-500"
        >
          Done
        </button>
      </div>
    </Overlay>
  );
}

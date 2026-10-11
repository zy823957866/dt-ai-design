import { useState } from 'react';
import {
  Search,
  X,
  Wand2,
  Palette,
  ClipboardCheck,
  GitBranch,
  Grid3x3,
  Code2,
  Accessibility,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';
import { Overlay, Toggle } from '@/components/overlays/Overlay';

const SKILLS: Array<{
  name: string;
  desc: string;
  icon: LucideIcon;
  on: boolean;
}> = [
  {
    name: 'Generate mockup',
    desc: 'AI product mockups',
    icon: Wand2,
    on: true,
  },
  {
    name: 'Color palette',
    desc: 'Harmonious schemes',
    icon: Palette,
    on: true,
  },
  {
    name: 'Design audit',
    desc: 'Consistency checks',
    icon: ClipboardCheck,
    on: false,
  },
  { name: 'Flow diagram', desc: 'User flows', icon: GitBranch, on: false },
  {
    name: 'Icon set creator',
    desc: 'Batch icon designs',
    icon: Grid3x3,
    on: false,
  },
  { name: 'Copy to code', desc: 'Pixel-perfect code', icon: Code2, on: true },
  {
    name: 'Accessibility check',
    desc: 'WCAG compliance',
    icon: Accessibility,
    on: false,
  },
  {
    name: 'User stories',
    desc: 'Product narratives',
    icon: BookOpen,
    on: false,
  },
];

export function AISkillsPanel({ onClose }: { onClose?: () => void }) {
  const [enabled, setEnabled] = useState(SKILLS.map((s) => s.on));

  return (
    <Overlay onClose={onClose} className="h-[640px] w-[520px]">
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="text-[14px] font-semibold text-text-primary">
          Skills
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-text-tertiary hover:text-text-secondary"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-5 pt-4">
        <div className="flex h-[34px] items-center gap-2.5 rounded-lg bg-bg-input px-3">
          <Search className="h-[13px] w-[13px] text-text-tertiary" />
          <input
            placeholder="Search skills…"
            className="h-6 flex-1 border-0 bg-transparent p-0 text-xs text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-5 pt-3">
        <span className="flex h-7 items-center rounded-full bg-accent px-3.5 text-[11.5px] text-white">
          All
        </span>
        {['Design', 'Code', 'Research', 'Productivity'].map((c) => (
          <span
            key={c}
            className="flex h-7 items-center rounded-full px-3 text-[11.5px] text-text-secondary"
          >
            {c}
          </span>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3">
        <div className="grid grid-cols-2 gap-2.5">
          {SKILLS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.name}
                className="flex h-16 items-center gap-2.5 rounded-[10px] border border-border bg-bg-elevated px-3"
              >
                <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-accent-soft">
                  <Icon className="h-4 w-4 text-accent-strong" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-text-primary">
                    {s.name}
                  </div>
                  <div className="truncate text-[10px] text-text-tertiary">
                    {s.desc}
                  </div>
                </div>
                <Toggle
                  on={enabled[i]}
                  onChange={(v) =>
                    setEnabled((prev) =>
                      prev.map((p, idx) => (idx === i ? v : p)),
                    )
                  }
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 pb-5 pt-2">
        <button className="flex h-7 w-full items-center justify-center rounded-full bg-accent text-xs font-semibold text-white hover:bg-brand-500">
          Open Marketplace
        </button>
      </div>
    </Overlay>
  );
}

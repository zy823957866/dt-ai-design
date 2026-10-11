import { useState, type ReactNode } from 'react';
import {
  SlidersHorizontal,
  Bot,
  Users,
  Palette,
  Keyboard,
  Plug,
  Wrench,
  Search,
  Plus,
  Copy,
  ChevronDown,
  Wand2,
  ClipboardCheck,
  GitBranch,
  Grid3x3,
  Code2,
  Accessibility,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';
import { Overlay, ModalHeader, Toggle } from '@/components/overlays/Overlay';
import { useTheme, type ThemePref } from '@/lib/theme';
import { AddProviderDialog } from '@/components/dialogs/AddProviderDialog';

type TabId =
  | 'general'
  | 'agent'
  | 'subagents'
  | 'appearance'
  | 'shortcuts'
  | 'mcp'
  | 'skills';

const TABS: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
  { id: 'general', label: 'General', icon: SlidersHorizontal },
  { id: 'agent', label: 'Agent', icon: Bot },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'subagents', label: 'SubAgents', icon: Users },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { id: 'mcp', label: 'MCP', icon: Plug },
];

const SKILLS: Array<{ name: string; desc: string; icon: LucideIcon }> = [
  { name: 'Generate mockup', desc: 'AI product mockups', icon: Wand2 },
  { name: 'Color palette', desc: 'Harmonious schemes', icon: Palette },
  { name: 'Design audit', desc: 'Consistency checks', icon: ClipboardCheck },
  { name: 'Flow diagram', desc: 'User flows', icon: GitBranch },
  { name: 'Icon set creator', desc: 'Batch icon designs', icon: Grid3x3 },
  { name: 'Copy to code', desc: 'Pixel-perfect code', icon: Code2 },
  { name: 'Accessibility check', desc: 'WCAG compliance', icon: Accessibility },
  { name: 'User stories', desc: 'Product narratives', icon: BookOpen },
];

function Row({
  label,
  desc,
  children,
}: {
  label: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div>
        <div className="text-[13px] text-text-primary">{label}</div>
        <div className="text-[11px] text-text-tertiary">{desc}</div>
      </div>
      {children}
    </div>
  );
}

function Chips({ options, active }: { options: string[]; active: string }) {
  return (
    <div className="flex h-8 items-center rounded-lg bg-bg-input p-[3px]">
      {options.map((o) => (
        <span
          key={o}
          className={`flex h-[26px] items-center justify-center rounded-md px-3.5 text-[11.5px] ${
            active === o
              ? 'bg-bg-elevated text-text-primary'
              : 'text-text-tertiary'
          }`}
        >
          {o}
        </span>
      ))}
    </div>
  );
}

export function SettingsDialog({ onClose }: { onClose?: () => void }) {
  const [tab, setTab] = useState<TabId>('general');
  const [autoSave, setAutoSave] = useState(true);
  const [autoAI, setAutoAI] = useState(false);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [skillsOn, setSkillsOn] = useState([
    true,
    true,
    false,
    false,
    false,
    true,
    false,
    false,
  ]);
  const { pref, setPref } = useTheme();

  return (
    <Overlay onClose={onClose} className="h-[640px] w-[960px]">
      <ModalHeader
        title="Settings"
        onClose={onClose}
        action={
          <button
            type="button"
            className="flex h-7 items-center rounded-md bg-bg-input px-2.5 text-xs text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            Reset to defaults
          </button>
        }
      />
      <div className="flex min-h-0 flex-1">
        {/* Tabs */}
        <div className="w-[200px] shrink-0 border-r border-border p-3">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors ${
                  active
                    ? 'bg-accent-soft text-accent-text'
                    : 'text-text-secondary hover:bg-bg-hover'
                }`}
              >
                <Icon
                  className={`h-[15px] w-[15px] ${active ? 'text-accent-strong' : 'text-text-secondary'}`}
                />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
          {tab === 'general' && (
            <>
              <h2 className="text-[18px] font-bold text-text-primary">
                General
              </h2>
              <p className="mt-1 text-xs text-text-tertiary">
                Theme, language and file preferences for design.ai.
              </p>
              <div className="mt-4 divide-y divide-border">
                <Row label="Theme" desc="Color mode for the entire interface">
                  <div className="flex h-8 items-center rounded-lg bg-bg-input p-[3px]">
                    {(['Light', 'Dark', 'System'] as const).map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setPref(o.toLowerCase() as ThemePref)}
                        className={`flex h-[26px] items-center justify-center rounded-md px-3.5 text-[11.5px] transition-colors ${pref === o.toLowerCase() ? 'bg-bg-elevated text-text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </Row>
                <Row
                  label="Default canvas zoom"
                  desc="Applied when opening a file"
                >
                  <Chips
                    options={['Fit to screen', '100%']}
                    active="Fit to screen"
                  />
                </Row>
                <Row label="Auto-save" desc="Save changes automatically">
                  <Toggle on={autoSave} onChange={setAutoSave} />
                </Row>
                <Row label="Startup" desc="What to open on launch">
                  <div className="flex h-8 w-[140px] items-center rounded-lg bg-bg-input px-3">
                    <span className="flex-1 text-xs text-text-secondary">
                      Open Dashboard
                    </span>
                    <ChevronDown className="h-3 w-3 text-text-tertiary" />
                  </div>
                </Row>
                <Row
                  label="Automatic AI actions"
                  desc="Allow the agent to act without confirmation"
                >
                  <Toggle on={autoAI} onChange={setAutoAI} />
                </Row>
              </div>
            </>
          )}

          {tab === 'agent' && (
            <>
              <h2 className="text-[18px] font-bold text-text-primary">Agent</h2>
              <p className="mt-1 text-xs text-text-tertiary">
                Model, keys and agent behaviour for the design agent.
              </p>
              <div className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                Setup Provider
              </div>
              <div className="mt-2 grid grid-cols-[1.4fr_1fr_2.2fr_1fr] items-center gap-2 px-3 text-[10.5px] font-semibold uppercase tracking-wide text-text-tertiary">
                <span>Name</span>
                <span>API Type</span>
                <span>Base Url</span>
                <span className="text-right">Status</span>
              </div>
              <div className="mt-1.5 space-y-1">
                {[
                  {
                    name: 'OpenAI',
                    type: 'OpenAI',
                    url: 'https://api.openai.com/v1',
                    status: 'Active',
                    active: true,
                  },
                  {
                    name: 'Anthropic',
                    type: 'Anthropic',
                    url: 'https://api.anthropic.com',
                    status: 'Not Connected',
                    active: false,
                  },
                  {
                    name: 'Google Gemini',
                    type: 'Gemini',
                    url: 'https://generativelanguage.googleapis.com',
                    status: 'Not Connected',
                    active: false,
                  },
                ].map((p) => (
                  <div
                    key={p.name}
                    className="grid h-[38px] grid-cols-[1.4fr_1fr_2.2fr_1fr] items-center gap-2 rounded-lg bg-bg-elevated px-3"
                  >
                    <span className="text-[12.5px] text-text-primary">
                      {p.name}
                    </span>
                    <span className="text-[11.5px] text-text-secondary">
                      {p.type}
                    </span>
                    <span className="truncate text-[11px] text-text-tertiary">
                      {p.url}
                    </span>
                    <span className="flex items-center justify-end gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${p.active ? 'bg-success' : 'bg-text-tertiary'}`}
                      />
                      <span
                        className={`text-[11.5px] ${p.active ? 'text-success' : 'text-text-secondary'}`}
                      >
                        {p.status}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowAddProvider(true)}
                className="mt-2.5 flex items-center gap-2 text-[12.5px] text-accent-strong transition-colors hover:text-accent"
              >
                <Plus className="h-[13px] w-[13px]" />
                Add Custom Provider
              </button>

              <div className="mt-4 divide-y divide-border">
                <Row label="Temperature" desc="Creativity of generated output">
                  <div className="flex w-[170px] items-center gap-2">
                    <div className="relative h-[3px] flex-1 rounded bg-bg-input">
                      <div className="absolute left-0 top-0 h-[3px] w-[70%] rounded bg-accent" />
                      <span className="absolute left-[70%] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-accent bg-white" />
                    </div>
                    <span className="text-xs text-text-secondary">0.7</span>
                  </div>
                </Row>
                <Row
                  label="Context window"
                  desc="Memory available to the agent"
                >
                  <Chips options={['32k', '64k', '128k']} active="64k" />
                </Row>
                <Row
                  label="Data collection"
                  desc="Help improve models with anonymous data"
                >
                  <Toggle on />
                </Row>
                <Row
                  label="Offline mode"
                  desc="Run fully local, no cloud calls"
                >
                  <Toggle on={false} />
                </Row>
                <Row
                  label="Auto-apply changes"
                  desc="Apply agent edits without confirmation"
                >
                  <Toggle on />
                </Row>
              </div>
            </>
          )}

          {tab === 'skills' && (
            <>
              <div className="flex items-start gap-4">
                <h2 className="text-[18px] font-bold leading-none text-text-primary">
                  Skills
                </h2>
                <button className="ml-auto flex h-7 items-center rounded-full bg-accent px-4 text-xs font-semibold text-white hover:bg-brand-500">
                  Open Marketplace
                </button>
              </div>
              <p className="mt-1 text-xs text-text-tertiary">
                Enable agent skills for targeted workflows.
              </p>
              <div className="mt-4 flex h-[34px] items-center gap-2.5 rounded-lg bg-bg-input px-3">
                <Search className="h-[13px] w-[13px] text-text-tertiary" />
                <input
                  placeholder="Search skills…"
                  className="h-6 flex-1 border-0 bg-transparent p-0 text-xs text-text-primary outline-none placeholder:text-text-tertiary"
                />
              </div>
              <div className="mt-3 flex items-center gap-1.5">
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
              <div className="mt-4 grid grid-cols-2 gap-2.5">
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
                        on={skillsOn[i]}
                        onChange={(v) =>
                          setSkillsOn((prev) =>
                            prev.map((x, idx) => (idx === i ? v : x)),
                          )
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {tab === 'subagents' && (
            <>
              <h2 className="text-[18px] font-bold text-text-primary">
                SubAgents
              </h2>
              <p className="mt-1 text-xs text-text-tertiary">
                Configure specialised sub-agents for targeted workflows.
              </p>
              <div className="mt-4 flex h-8 items-center rounded-lg bg-bg-input p-[3px] w-[340px]">
                {['Default', 'Artists', 'Scientists'].map((o, i) => (
                  <span
                    key={o}
                    className={`flex h-[26px] flex-1 items-center justify-center rounded-md text-xs ${i === 0 ? 'bg-bg-elevated text-text-primary' : 'text-text-secondary'}`}
                  >
                    {o}
                  </span>
                ))}
              </div>
              <div className="mt-3 space-y-0.5 rounded-lg border border-border bg-bg-input p-3">
                {[
                  '#aab9e1',
                  '#5acdd2',
                  '#ffaf3c',
                  '#9b8cbe',
                  '#ff73a0',
                  '#b96ef0',
                  '#78c8f0',
                  '#dcb48c',
                  '#6496ff',
                ].map((c, i) => (
                  <div
                    key={c}
                    className="flex h-9 items-center gap-2.5 rounded-md px-2.5 hover:bg-bg-hover"
                  >
                    <span className="text-[13px] text-text-primary">
                      Designer {i + 1}
                    </span>
                    <span
                      className="ml-auto h-4 w-4 rounded border border-border"
                      style={{ backgroundColor: c }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'appearance' && (
            <>
              <h2 className="text-[18px] font-bold text-text-primary">
                Appearance
              </h2>
              <p className="mt-1 text-xs text-text-tertiary">
                Density, canvas look and accent colour.
              </p>
              <div className="mt-4 divide-y divide-border">
                <Row
                  label="UI density"
                  desc="Controls spacing and sizes of panels"
                >
                  <Chips
                    options={['Compact', 'Default', 'Comfortable']}
                    active="Default"
                  />
                </Row>
                <Row
                  label="Canvas background"
                  desc="Colour of the infinite canvas"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-md border border-border bg-[#141418]" />
                    <span className="text-[11.5px] text-text-secondary">
                      #141418
                    </span>
                  </div>
                </Row>
                <Row label="Grid colour" desc="Dots behind frames">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-md bg-[#2A2A33]" />
                    <span className="text-[11.5px] text-text-secondary">
                      #2A2A33 · spacing 76
                    </span>
                  </div>
                </Row>
                <Row label="Accent colour" desc="Brand highlight across the UI">
                  <div className="flex items-center gap-2">
                    {[
                      '#7C3AED',
                      '#2563EB',
                      '#059669',
                      '#E11D48',
                      '#F59E0B',
                    ].map((c, i) => (
                      <span
                        key={c}
                        className={`h-[26px] w-[26px] rounded-lg ${i === 0 ? 'border-2 border-white' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </Row>
                <Row
                  label="Interface font"
                  desc="Font used for menus and panels"
                >
                  <div className="flex h-8 items-center gap-2 rounded-lg bg-bg-input px-3">
                    <span className="text-xs text-text-primary">Inter</span>
                    <ChevronDown className="h-3 w-3 text-text-tertiary" />
                  </div>
                </Row>
                <Row label="Canvas grid" desc="Show dotted grid behind frames">
                  <Toggle on />
                </Row>
                <Row
                  label="Rulers & guides"
                  desc="Show rulers and smart guides"
                >
                  <Toggle on />
                </Row>
              </div>
            </>
          )}

          {tab === 'shortcuts' && (
            <>
              <h2 className="text-[18px] font-bold text-text-primary">
                Shortcuts
              </h2>
              <p className="mt-1 text-xs text-text-tertiary">
                Search and edit keyboard shortcuts.
              </p>
              <div className="mt-4 flex h-[34px] items-center gap-2.5 rounded-lg bg-bg-input px-3">
                <Search className="h-[13px] w-[13px] text-text-tertiary" />
                <input
                  placeholder="Search shortcuts…"
                  className="h-6 flex-1 border-0 bg-transparent p-0 text-xs text-text-primary outline-none placeholder:text-text-tertiary"
                />
              </div>
              {(
                [
                  [
                    'AI Chat',
                    [
                      ['Toggle AI Chat', '⌘K'],
                      ['New Agent Tab', '⌘T'],
                    ],
                  ],
                  [
                    'Tools',
                    [
                      ['Move tool', 'V'],
                      ['Rectangle', 'R'],
                      ['Frame', 'A'],
                      ['Text', 'T'],
                    ],
                  ],
                  [
                    'Editing',
                    [
                      ['Undo', '⌘Z'],
                      ['Redo', '⇧⌘Z'],
                      ['Duplicate', '⌘D'],
                      ['Delete', '⌫'],
                    ],
                  ],
                ] as Array<[string, Array<[string, string]>]>
              ).map(([group, items]) => (
                <div key={group} className="mt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                    {group}
                  </div>
                  {items.map(([name, kbd]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-xs text-text-primary">{name}</span>
                      <span className="flex h-6 items-center rounded-md bg-bg-input px-2 text-[11px] text-text-secondary">
                        {kbd}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="mt-4 flex gap-5 border-t border-border pt-3 text-[11.5px] text-text-secondary">
                <span>Reset to defaults</span>
                <span className="ml-auto">Export JSON</span>
                <span>Import JSON</span>
              </div>
            </>
          )}

          {tab === 'mcp' && (
            <>
              <h2 className="text-[18px] font-bold text-text-primary">MCP</h2>
              <p className="mt-1 text-xs text-text-tertiary">
                Connect design.ai to Model Context Protocol servers.
              </p>
              <div className="mt-4 flex items-center justify-between border-b border-border py-3">
                <div>
                  <div className="text-[13px] text-text-primary">Use MCP</div>
                  <div className="text-[11px] text-text-tertiary">
                    Let the agent call tools from your configured servers
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary">
                    <Copy className="h-[13px] w-[13px]" />
                    Copy MCP
                  </button>
                  <Toggle on />
                </div>
              </div>
              <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                Add MCP Servers
              </div>
              <pre className="mt-2 rounded-lg border border-border bg-bg-input p-4 font-mono text-[11px] leading-relaxed text-text-secondary">
                {`{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"]
    }
  }
}`}
              </pre>
            </>
          )}
        </div>
      </div>

      {showAddProvider && (
        <AddProviderDialog onClose={() => setShowAddProvider(false)} />
      )}
    </Overlay>
  );
}

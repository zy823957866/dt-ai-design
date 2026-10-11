import {
  Sparkles,
  ChevronDown,
  MoreHorizontal,
  X,
  Plus,
  RefreshCw,
  Shuffle,
  Image as ImageIcon,
  Send,
  Minus,
} from 'lucide-react';

function Avatar({ size = 20 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-accent text-white"
      style={{ width: size, height: size }}
    >
      <Sparkles style={{ width: size * 0.55, height: size * 0.55 }} />
    </span>
  );
}

export function AIChatPanel({
  onOpenSkills,
}: { onOpenSkills?: () => void } = {}) {
  return (
    <div className="absolute bottom-4 right-4 z-30 flex h-[664px] max-h-[calc(100%-2rem)] w-[428px] flex-col overflow-hidden rounded-[14px] border border-border bg-bg-panel shadow-popover">
      {/* Header */}
      <div className="flex h-10 shrink-0 items-center gap-2.5 border-b border-border bg-bg-elevated px-3.5">
        <Sparkles className="h-4 w-4 text-accent-strong" />
        <span className="text-[12.5px] font-semibold text-text-primary">
          AI Chat
        </span>
        <div className="ml-auto flex items-center gap-3 text-text-tertiary">
          <ChevronDown className="h-3.5 w-3.5" />
          <button
            type="button"
            onClick={onOpenSkills}
            className="hover:text-text-secondary"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 pt-2.5">
        {/* Agent tabs */}
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="flex h-[31px] items-center gap-2 rounded-lg bg-bg-elevated px-2.5 text-xs text-text-primary">
            Agent 1
            <X className="h-2.5 w-2.5 text-text-tertiary" />
          </div>
          <button
            type="button"
            className="flex h-[26px] w-6 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-hover"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs text-text-secondary">New agent</span>
        </div>

        {/* Messages */}
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-0.5">
          {/* Welcome */}
          <div className="rounded-xl bg-bg-elevated p-3">
            <div className="flex items-center gap-2">
              <Avatar />
              <span className="text-[11px] font-semibold text-text-primary">
                Assistant
              </span>
              <span className="ml-auto text-[10.5px] text-text-tertiary">
                now
              </span>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-text-secondary">
              Hi Alex! I&apos;m your design agent. I can build, edit and
              refactor anything on this canvas.
            </p>
          </div>

          {/* User message */}
          <div className="flex justify-end">
            <div className="max-w-[238px] rounded-xl bg-accent px-3 py-2 text-[12.5px] text-white">
              Add a KPI chart to the Dashboard UI
            </div>
          </div>

          {/* Generation */}
          <div className="rounded-xl bg-bg-elevated p-3">
            <div className="flex items-center gap-2">
              <Avatar />
              <span className="text-[11px] font-semibold text-text-primary">
                Assistant
              </span>
              <span className="ml-auto text-[10.5px] text-text-tertiary">
                now
              </span>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-text-secondary">
              Done! I added a revenue KPI chart to Dashboard UI with a 7-day
              trend, live totals and a recent-orders table.
            </p>

            {/* Code block */}
            <div className="mt-3 rounded-lg bg-[#18181F] p-2.5">
              <div className="flex items-center">
                <span className="text-[10px] text-text-tertiary">html</span>
                <span className="mx-2 h-px flex-1 bg-border" />
                <CopyIcon />
              </div>
              <pre className="mt-2 whitespace-pre font-mono text-[10.5px] leading-relaxed text-accent-strong">
                {`<div class="kpi-grid">
  <article class="kpi"><h3>Revenue</h3><p>$48.2K</p></article>
  <article class="kpi"><h3>Users</h3><p>9,431</p></article>
</div>`}
              </pre>
            </div>

            {/* Action bar */}
            <div className="mt-3 flex items-center gap-1.5">
              <button
                type="button"
                className="rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-brand-500"
              >
                Apply
              </button>
              <button
                type="button"
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-text-secondary transition-colors hover:bg-bg-hover"
              >
                Reject
              </button>
            </div>

            {/* Action row 2 */}
            <div className="mt-2 flex items-center gap-4">
              <button
                type="button"
                className="flex items-center gap-1.5 text-[10.5px] text-text-tertiary transition-colors hover:text-text-secondary"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 text-[10.5px] text-text-tertiary transition-colors hover:text-text-secondary"
              >
                <Shuffle className="h-3 w-3" />
                Variants
              </button>
            </div>
          </div>
        </div>

        {/* Input area */}
        <div className="mt-3 shrink-0 rounded-xl border border-border bg-bg-input p-3">
          <p className="text-xs text-text-tertiary">
            Ask the agent to modify your design…
          </p>
          <div className="mt-3 flex items-center">
            <ImageIcon className="h-3.5 w-3.5 text-text-tertiary" />
            <button
              type="button"
              className="ml-auto flex h-[30px] w-[38px] items-center justify-center rounded-[15px] bg-accent text-white transition-colors hover:bg-brand-500"
            >
              <Send className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Model bar */}
        <div className="mt-3 mb-3 flex shrink-0 items-center">
          <button
            type="button"
            className="flex h-[26px] items-center gap-1.5 rounded-full bg-bg-input px-2.5 text-[10.5px] text-text-secondary"
          >
            sonnet-4.5
            <ChevronDown className="h-2.5 w-2.5 text-text-tertiary" />
          </button>
          <div className="flex-1" />
          <span className="mr-3 text-[10.5px] text-text-tertiary">
            Sub-agents
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-bg-input text-text-secondary hover:bg-bg-hover"
            >
              <Minus className="h-2.5 w-2.5" />
            </button>
            <span className="text-[11px] font-semibold text-text-primary">
              2
            </span>
            <button
              type="button"
              className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-bg-input text-text-secondary hover:bg-bg-hover"
            >
              <Plus className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      className="h-2.5 w-2.5 text-text-tertiary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

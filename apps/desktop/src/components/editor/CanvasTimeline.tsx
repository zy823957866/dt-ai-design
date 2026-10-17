import { Check, ChevronRight, LoaderCircle, Sparkles, X } from 'lucide-react';

import type { CanvasAgentItem } from '@/lib/useCanvasAgent';

const STAGE_LABELS: Record<string, string> = {
  planning: '正在规划…',
  editing: '正在编辑画布…',
  executing: '正在生成设计…',
  verifying: '正在自检…',
  validating: '正在校验…',
  repairing: '正在修复…',
  completed: '完成',
  failed: '失败',
  cancelled: '已停止',
};

export interface CanvasTimelineProps {
  items: CanvasAgentItem[];
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}

/** Pencil 式时间线：用户 / 助手 / 阶段 / 可展开的工具调用块。 */
export function CanvasTimeline({
  items,
  expandedIds,
  onToggle,
}: CanvasTimelineProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <CanvasTimelineItem
          key={item.id}
          item={item}
          expanded={expandedIds.has(item.id)}
          onToggle={() => onToggle(item.id)}
        />
      ))}
    </div>
  );
}

function CanvasTimelineItem({
  item,
  expanded,
  onToggle,
}: {
  item: CanvasAgentItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  switch (item.kind) {
    case 'user':
      return (
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-xl bg-accent px-3 py-2 text-[11.5px] text-white">
            {item.text}
          </div>
        </div>
      );
    case 'assistant':
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
              <Sparkles className="h-[11px] w-[11px] text-white" />
            </div>
            <span className="text-[11px] font-semibold text-text-primary">
              Assistant
            </span>
          </div>
          <div className="whitespace-pre-wrap rounded-xl bg-bg-elevated px-3 py-2 text-[12.5px] text-text-secondary">
            {item.text}
          </div>
        </div>
      );
    case 'stage':
      return (
        <div className="flex items-center gap-2 px-1">
          {item.spin ? (
            <LoaderCircle className="h-3 w-3 shrink-0 animate-spin text-text-muted" />
          ) : (
            <span className="h-1 w-1 shrink-0 rounded-full bg-text-muted" />
          )}
          <span className="text-[11px] text-text-muted">
            {STAGE_LABELS[item.message] ?? item.message}
          </span>
        </div>
      );
    case 'tool':
      return (
        <ToolCallRow item={item} expanded={expanded} onToggle={onToggle} />
      );
  }
}

function StatusIcon({ status }: { status: 'running' | 'ok' | 'error' }) {
  if (status === 'running') {
    return <LoaderCircle className="h-3 w-3 animate-spin text-accent" />;
  }
  if (status === 'ok') {
    return <Check className="h-3 w-3 text-green-500" />;
  }
  return <X className="h-3 w-3 text-red-400" />;
}

function ToolCallRow({
  item,
  expanded,
  onToggle,
}: {
  item: Extract<CanvasAgentItem, { kind: 'tool' }>;
  expanded: boolean;
  onToggle: () => void;
}) {
  const refs = Object.entries(item.refs ?? {});
  const firstLine = item.code.split('\n')[0] ?? '';

  return (
    <div
      className="rounded-lg border border-border bg-bg-elevated/60"
      data-testid="tool-call"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-2 px-2.5 py-2 text-left hover:bg-bg-hover"
      >
        <span className="mt-[2px] shrink-0">
          <StatusIcon status={item.status} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {item.agentId && (
              <span className="rounded bg-accent-soft px-1.5 py-px font-mono text-[9.5px] text-accent-text">
                {item.agentId}
              </span>
            )}
            <span className="rounded bg-bg-active px-1.5 py-px font-mono text-[9.5px] text-text-secondary">
              {item.tool}
            </span>
            {item.editId && (
              <span className="text-[9.5px] text-text-tertiary">
                patch {item.editId.slice(0, 8)}
              </span>
            )}
          </div>
          <div className="mt-1 truncate font-mono text-[10.5px] leading-[16px] text-text-secondary">
            {firstLine}
          </div>
          {refs.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {refs.slice(0, 8).map(([name, id]) => (
                <span
                  key={id}
                  className="rounded border border-border px-1 py-px font-mono text-[9.5px] text-text-muted"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
        <ChevronRight
          className={`mt-[2px] h-3 w-3 shrink-0 text-text-muted transition-transform ${
            expanded ? 'rotate-90' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="flex flex-col gap-2 border-t border-border px-2.5 py-2">
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-all rounded bg-bg-input px-2 py-1.5 font-mono text-[10px] leading-relaxed text-text-secondary">
            {item.code}
          </pre>
          {item.output && item.output.length > 0 && (
            <div>
              <div className="mb-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-text-tertiary">
                Print
              </div>
              <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed text-text-secondary">
                {item.output.join('\n')}
              </pre>
            </div>
          )}
          {item.warnings && item.warnings.length > 0 && (
            <div className="flex flex-col gap-1">
              {item.warnings.map((warning) => (
                <div
                  key={warning.code + (warning.nodeId ?? '')}
                  className="text-[10.5px] text-yellow-500"
                >
                  ⚠ {warning.message}
                </div>
              ))}
            </div>
          )}
          {item.error && (
            <div className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-[10.5px] text-red-400">
              {item.error.message}
              {item.error.editId && (
                <span className="ml-1 text-text-muted">
                  (editId {item.error.editId.slice(0, 8)})
                </span>
              )}
            </div>
          )}
          {item.screenshots && item.screenshots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.screenshots.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  alt="screenshot"
                  className="max-h-40 rounded border border-border"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
  Square,
  Circle,
  Type as TypeIcon,
  Frame,
  Layers,
  Search,
  StickyNote,
  Sparkles,
  Image as ImageIcon,
  LoaderCircle,
  X,
  Check,
  Star,
  Heart,
  Bell,
  Settings,
  User,
  Plus,
  Minus,
  Mail,
  Camera,
  Pencil,
  MapPin,
  Lock,
  Globe,
  Zap,
  History,
  Bookmark,
  Share2,
  type LucideIcon,
} from 'lucide-react';
import { useEditor } from '@/lib/editor';
import { useGeneration } from '@/lib/useGeneration';
import type { ChatTimelineItem } from '@/lib/useGeneration';
import { useAgentModel, AGENT_TOOLS } from '@/lib/useAgentModel';
import type {
  AgentModelInfo,
  AgentTool,
} from '@dt-ai-design/agent-provider-core';
import type { GenerationActivity } from '@/shared/ipc-types';

type LeftTab = 'chat' | 'layers' | 'assets' | 'images';

interface LeftPanelProps {
  collapsed: boolean;
  onCollapse?: () => void;
  onExpand: () => void;
  projectId?: string;
}

interface ContextMenuState {
  x: number;
  y: number;
  layerId: string;
}

type DropPosition = 'before' | 'after' | 'inside';

interface DropTarget {
  id: string;
  position: DropPosition;
}

const TABS: Array<{ id: LeftTab; label: string }> = [
  { id: 'chat', label: 'Chat' },
  { id: 'layers', label: 'Layers' },
  { id: 'assets', label: 'Assets' },
  { id: 'images', label: 'Images' },
];

export function LeftPanel({ collapsed, onExpand, projectId }: LeftPanelProps) {
  const [activeTab, setActiveTab] = useState<LeftTab>('layers');

  if (collapsed) {
    return (
      <div className="flex w-10 shrink-0 flex-col items-center gap-2 border-r border-border bg-bg-panel py-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={onExpand}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-bg-hover ${
              activeTab === t.id ? 'bg-bg-elevated text-text-primary' : ''
            }`}
            title={t.label}
          >
            <TabIcon id={t.id} />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full w-[252px] shrink-0 flex-col border-r border-border bg-bg-panel">
      <div className="flex flex-1 flex-col gap-3 p-3 min-h-0">
        <div className="flex h-[34px] items-center gap-[2px] rounded-lg bg-bg-input p-[3px]">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex h-[26px] flex-1 items-center justify-center rounded-md text-[12px] transition-colors ${
                activeTab === t.id
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'chat' && <ChatTab projectId={projectId} />}
        {activeTab === 'layers' && <LayersTab />}
        {activeTab === 'assets' && <AssetsTab />}
        {activeTab === 'images' && <ImagesTab />}
      </div>
    </div>
  );
}

function TabIcon({ id }: { id: LeftTab }) {
  const cls = 'h-[13px] w-[13px]';
  switch (id) {
    case 'chat':
      return <Sparkles className={cls} />;
    case 'layers':
      return <Layers className={cls} />;
    case 'assets':
      return <Square className={cls} />;
    case 'images':
      return <ImageIcon className={cls} />;
  }
}

const CHAT_HISTORY = [
  { id: '1', title: '移动端登录页设计', time: '刚刚' },
  { id: '2', title: 'Dashboard 数据看板', time: '2h 前' },
  { id: '3', title: '产品落地页 Hero', time: '昨天' },
  { id: '4', title: '支付流程优化', time: '2 天前' },
  { id: '5', title: '用户中心改版', time: '上周' },
];

function ChatHistoryBar() {
  const [open, setOpen] = useState(false);
  const [currentId, setCurrentId] = useState('1');
  const current =
    CHAT_HISTORY.find((c) => c.id === currentId) ?? CHAT_HISTORY[0];

  const handleNew = () => {
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-[30px] flex-1 items-center gap-2 rounded-md border border-border bg-bg-input px-2 text-left hover:bg-bg-hover"
        >
          <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-text-primary">
            {current.title}
          </span>
          <ChevronDown
            className={`h-3 w-3 shrink-0 text-text-tertiary transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
        <button
          onClick={handleNew}
          className="flex h-[26px] items-center gap-1 rounded-md bg-accent px-2.5 text-[11px] font-medium text-white hover:bg-brand-500"
          title="New chat"
        >
          <Plus className="h-3 w-3" />
          <span>New</span>
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-[34px] z-20 w-[calc(100%-52px)] overflow-hidden rounded-lg border border-border bg-bg-popover shadow-popover">
            <div className="max-h-[200px] overflow-y-auto py-1">
              {CHAT_HISTORY.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setCurrentId(chat.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-bg-hover ${
                    chat.id === currentId ? 'bg-accent-soft' : ''
                  }`}
                >
                  <span
                    className={`min-w-0 flex-1 truncate text-[11.5px] ${
                      chat.id === currentId
                        ? 'text-accent-text'
                        : 'text-text-secondary'
                    }`}
                  >
                    {chat.title}
                  </span>
                  <span className="shrink-0 text-[10px] text-text-tertiary">
                    {chat.time}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Chat Tab
// ============================================================

const STAGE_LABELS: Record<string, string> = {
  planning: '正在规划…',
  executing: '正在生成设计…',
  validating: '正在校验文档结构…',
  repairing: '正在修复校验错误…',
  completed: '生成完成',
  failed: '生成失败',
  cancelled: '已停止',
};

const MODEL_FALLBACK_LABEL = '默认模型';

function ToolSelector({
  tool,
  onToolChange,
}: {
  tool: AgentTool;
  onToolChange: (tool: AgentTool) => void;
}) {
  const [open, setOpen] = useState(false);
  const current =
    AGENT_TOOLS.find((option) => option.id === tool) ?? AGENT_TOOLS[0];

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-[26px] items-center gap-1.5 rounded-[13px] bg-bg-active px-2.5 text-[11px] font-semibold text-text-primary hover:bg-bg-hover"
      >
        <span>{current.label}</span>
        <ChevronDown className="h-2.5 w-2.5 text-text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-[30px] left-0 z-20 min-w-[120px] overflow-hidden rounded-lg border border-border bg-bg-popover py-1 shadow-popover">
            {AGENT_TOOLS.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onToolChange(option.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[11.5px] hover:bg-bg-hover ${
                  option.id === tool
                    ? 'bg-accent-soft text-accent-text'
                    : 'text-text-secondary'
                }`}
              >
                <span>{option.label}</span>
                {option.id === tool && <Check className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ModelSelector({
  models,
  model,
  loading,
  onModelChange,
}: {
  models: AgentModelInfo[];
  model: string;
  loading: boolean;
  onModelChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const current = models.find((option) => option.id === model);
  const keyword = query.trim().toLowerCase();
  const filtered = keyword
    ? models.filter(
        (option) =>
          option.label.toLowerCase().includes(keyword) ||
          option.id.toLowerCase().includes(keyword),
      )
    : models;

  const groups: Array<{ name: string; items: AgentModelInfo[] }> = [];
  for (const option of filtered) {
    const name = option.group ?? '';
    const group = groups.find((item) => item.name === name);
    if (group) group.items.push(option);
    else groups.push({ name, items: [option] });
  }

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="flex h-[26px] w-full items-center justify-between gap-1.5 rounded-[13px] bg-bg-active px-2.5 text-[11px] font-semibold text-text-primary hover:bg-bg-hover disabled:opacity-40"
      >
        <span className="truncate">
          {current?.label ?? MODEL_FALLBACK_LABEL}
        </span>
        <ChevronDown className="h-2.5 w-2.5 shrink-0 text-text-muted" />
      </button>

      {open && models.length > 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} />
          <div className="absolute bottom-[30px] left-0 z-20 w-[250px] overflow-hidden rounded-lg border border-border bg-bg-popover shadow-popover">
            <div className="border-b border-border p-1.5">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索模型…"
                className="h-6 w-full rounded-md bg-bg-input px-2 text-[11px] text-text-primary placeholder:text-text-tertiary outline-none"
              />
            </div>
            <div className="max-h-[250px] overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-1.5 text-[11px] text-text-muted">
                  无匹配模型
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group.name || '__all__'}>
                    {group.name && (
                      <div className="px-3 pb-1 pt-2 text-[10px] font-medium tracking-wide text-text-tertiary">
                        {group.name}
                      </div>
                    )}
                    {group.items.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          onModelChange(option.id);
                          close();
                        }}
                        className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[11.5px] hover:bg-bg-hover ${
                          option.id === model
                            ? 'bg-accent-soft text-accent-text'
                            : 'text-text-secondary'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate">{option.label}</span>
                          {option.free && (
                            <span className="shrink-0 rounded border border-border px-1 py-px text-[9px] font-normal text-text-muted">
                              免费
                            </span>
                          )}
                        </span>
                        {option.id === model && (
                          <Check className="h-3 w-3 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CountStepper({
  count,
  onCountChange,
}: {
  count: number;
  onCountChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-[3px]">
      <button
        type="button"
        onClick={() => onCountChange(Math.max(1, count - 1))}
        disabled={count <= 1}
        className="flex h-5 w-5 items-center justify-center rounded-md bg-bg-active text-text-muted hover:text-text-secondary disabled:opacity-40"
        title="减少生成数量"
      >
        <Minus className="h-2.5 w-2.5" />
      </button>
      <span className="min-w-[14px] text-center text-[11px] font-semibold text-text-primary">
        {count}
      </span>
      <button
        type="button"
        onClick={() => onCountChange(Math.min(9, count + 1))}
        disabled={count >= 9}
        className="flex h-5 w-5 items-center justify-center rounded-md bg-bg-active text-text-muted hover:text-text-secondary disabled:opacity-40"
        title="增加生成数量"
      >
        <Plus className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

function ChatTab({ projectId }: { projectId?: string }) {
  const { items, isRunning, error, start, cancel } = useGeneration({
    projectId,
  });
  const {
    tool,
    model,
    models,
    loading,
    error: modelError,
    setTool,
    setModel,
  } = useAgentModel();
  const [input, setInput] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [variantCount, setVariantCount] = useState(3);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 时间线更新时滚动到底部
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items, error]);

  const handleSend = () => {
    if (isRunning) return;
    const text = input.trim();
    if (!text) return;
    setInput('');
    void start(text, { tool, model });
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <ChatHistoryBar />
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto min-h-0"
      >
        {items.length === 0 && !error && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft">
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <p className="text-[12px] text-text-secondary">
              描述你的设计需求，AI 会生成完整设计文档并落到画布。
            </p>
            <p className="text-[11px] text-text-muted">
              例如：生成一个移动端登录页，包含 logo、输入框和登录按钮
            </p>
          </div>
        )}
        {items.map((item) => (
          <TimelineItemView
            key={item.id}
            item={item}
            expanded={expandedIds.has(item.id)}
            onToggle={() => toggleExpanded(item.id)}
          />
        ))}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11.5px] text-red-400">
            {error}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col rounded-xl border border-border bg-bg-input px-3 pt-3 pb-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isRunning}
          placeholder={isRunning ? 'AI 正在生成中…' : '描述你的设计需求…'}
          className="h-10 resize-none border-0 bg-transparent p-0 text-[12px] text-text-primary placeholder:text-text-muted outline-none disabled:opacity-60"
        />
        {modelError && (
          <div className="mt-1 text-[11px] text-red-400">{modelError}</div>
        )}
        <div className="mt-2.5 flex items-center gap-2.5">
          <CountStepper count={variantCount} onCountChange={setVariantCount} />
          <div className="flex-1" />
          {isRunning ? (
            <button
              onClick={() => void cancel()}
              className="flex h-[26px] w-8 items-center justify-center rounded-[13px] bg-red-500 text-white hover:bg-red-600"
              title="停止生成"
            >
              <Square className="h-[10px] w-[10px] fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex h-[26px] w-8 items-center justify-center rounded-[13px] bg-accent text-white disabled:opacity-40"
              title="发送"
            >
              <svg
                className="h-[11px] w-[11px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ToolSelector tool={tool} onToolChange={setTool} />
        <ModelSelector
          models={models}
          model={model}
          loading={loading}
          onModelChange={setModel}
        />
      </div>
    </div>
  );
}

function TimelineItemView({
  item,
  expanded,
  onToggle,
}: {
  item: ChatTimelineItem;
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
    case 'activity':
      return (
        <ActivityRow
          activity={item.activity}
          expanded={expanded}
          onToggle={onToggle}
        />
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
  }
}

function ActivityRow({
  activity,
  expanded,
  onToggle,
}: {
  activity: GenerationActivity;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasOutput = Boolean(activity.output?.summary || activity.error);
  return (
    <div className="rounded-lg border border-border bg-bg-elevated/60">
      <button
        onClick={hasOutput ? onToggle : undefined}
        className={`flex w-full items-start gap-2 px-2.5 py-2 text-left ${
          hasOutput ? 'cursor-pointer hover:bg-bg-hover' : 'cursor-default'
        }`}
      >
        <span className="mt-[2px] shrink-0">
          {activity.status === 'running' ? (
            <LoaderCircle className="h-3 w-3 animate-spin text-accent" />
          ) : activity.status === 'completed' ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <X className="h-3 w-3 text-red-400" />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] leading-[16px] text-text-secondary">
          $ {activity.input.command}
        </span>
        {hasOutput && (
          <ChevronRight
            className={`mt-[2px] h-3 w-3 shrink-0 text-text-muted transition-transform ${
              expanded ? 'rotate-90' : ''
            }`}
          />
        )}
      </button>
      {expanded && hasOutput && (
        <div className="border-t border-border px-2.5 py-2">
          <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed text-text-muted">
            {activity.error ? activity.error.message : activity.output?.summary}
          </pre>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Layers Tab
// ============================================================

function LayersTab() {
  const editor = useEditor();
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const dragStateRef = useRef<{
    sourceId: string | null;
    target: DropTarget | null;
  }>({ sourceId: null, target: null });

  const doc = editor.getDocument();
  const rootLayerIds = doc.rootLayerIds;
  const allLayers = doc.layers;
  const searchActive = searchQuery.trim().length > 0;

  const filteredRootIds = useMemo(() => {
    if (!searchQuery.trim()) return rootLayerIds;
    const q = searchQuery.toLowerCase();
    return rootLayerIds.filter((id) =>
      allLayers[id]?.name?.toLowerCase().includes(q),
    );
  }, [rootLayerIds, allLayers, searchQuery]);

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startRename = (id: string) => {
    setRenamingId(id);
    setRenameValue(allLayers[id]?.name || '');
  };

  const commitRename = () => {
    if (renamingId) {
      const next = renameValue.trim();
      if (next && next !== allLayers[renamingId]?.name) {
        editor.setLayerProperty(renamingId, 'name', next);
      }
    }
    setRenamingId(null);
  };

  const toggleVisible = (id: string) => {
    const layer = allLayers[id];
    if (layer) editor.setLayerProperty(id, 'visible', !layer.visible);
  };

  const getParentId = (id: string): string | null => {
    for (const [pid, layer] of Object.entries(allLayers)) {
      if (
        (layer.type === 'frame' || layer.type === 'group') &&
        (layer as { children: string[] }).children.includes(id)
      ) {
        return pid;
      }
    }
    return null;
  };

  const isDescendant = (ancestorId: string, nodeId: string): boolean => {
    const stack = [ancestorId];
    const seen = new Set<string>();
    while (stack.length > 0) {
      const id = stack.pop() as string;
      if (seen.has(id)) continue;
      seen.add(id);
      const layer = allLayers[id];
      if (layer && (layer.type === 'frame' || layer.type === 'group')) {
        for (const child of (layer as { children: string[] }).children) {
          if (child === nodeId) return true;
          stack.push(child);
        }
      }
    }
    return false;
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setContextMenu(null);
    setDraggedId(id);
    dragStateRef.current = { sourceId: id, target: null };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    const source = dragStateRef.current.sourceId;
    if (!source || searchActive) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id === source || isDescendant(source, id)) {
      dragStateRef.current.target = null;
      setDropTarget(null);
      return;
    }
    const layer = allLayers[id];
    if (!layer) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0.5;
    const isContainer = layer.type === 'frame' || layer.type === 'group';
    let position: DropPosition;
    if (isContainer) {
      if (ratio < 0.25) position = 'before';
      else if (ratio > 0.75) position = 'after';
      else position = 'inside';
    } else {
      position = ratio < 0.5 ? 'before' : 'after';
    }
    dragStateRef.current.target = { id, position };
    setDropTarget({ id, position });
  };

  const handleDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    const source = dragStateRef.current.sourceId;
    const target = dragStateRef.current.target;
    dragStateRef.current = { sourceId: null, target: null };
    setDraggedId(null);
    setDropTarget(null);
    if (!source || !target || target.id !== id || source === id) return;
    if (isDescendant(source, id)) return;
    const targetLayer = allLayers[id];
    if (!targetLayer) return;

    if (target.position === 'inside') {
      const children = (targetLayer as { children: string[] }).children;
      editor.reorderLayer(source, id, children.length);
      return;
    }

    const parentId = getParentId(id);
    const siblings = parentId
      ? (allLayers[parentId] as { children: string[] }).children
      : rootLayerIds;
    const idx = siblings.indexOf(id);
    const insertIndex = target.position === 'before' ? idx : idx + 1;
    editor.reorderLayer(source, parentId, insertIndex);
  };

  const handleDragEnd = () => {
    dragStateRef.current = { sourceId: null, target: null };
    setDraggedId(null);
    setDropTarget(null);
  };

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  useEffect(() => {
    if (!contextMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [contextMenu]);

  const contextLayer = contextMenu ? allLayers[contextMenu.layerId] : undefined;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex h-8 items-center gap-2 rounded-lg bg-bg-input px-2.5">
        <Search className="h-[13px] w-[13px] shrink-0 text-text-muted" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter layers"
          className="h-5 flex-1 border-0 bg-transparent p-0 text-[12px] text-text-primary placeholder:text-text-muted outline-none"
        />
      </div>

      <div
        className="flex-1 overflow-y-auto"
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu(null);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setDropTarget(null);
          }
        }}
      >
        <div className="flex flex-col gap-px">
          {filteredRootIds.map((id) => (
            <LayerTreeItem
              key={id}
              layerId={id}
              depth={0}
              collapsedIds={collapsedIds}
              onToggleCollapse={toggleCollapse}
              selectedIds={new Set(editor.getSelection().layerIds)}
              onSelect={(e, lid) => {
                e.stopPropagation();
                editor.setSelection([lid]);
              }}
              renamingId={renamingId}
              renameValue={renameValue}
              renameInputRef={renameInputRef}
              onStartRename={startRename}
              onRenameChange={setRenameValue}
              onCommitRename={commitRename}
              onCancelRename={() => setRenamingId(null)}
              onContextMenu={(e, lid) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({ x: e.clientX, y: e.clientY, layerId: lid });
              }}
              onToggleVisible={toggleVisible}
              dragEnabled={!searchActive}
              draggingId={draggedId}
              dropTarget={dropTarget}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </div>

      {contextMenu && contextLayer && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div
            className="fixed z-50 min-w-[148px] overflow-hidden rounded-lg border border-border bg-bg-popover py-1 shadow-popover"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <ContextMenuItem
              icon={<Pencil className="h-3.5 w-3.5" />}
              label="重命名"
              onClick={() => {
                startRename(contextMenu.layerId);
                setContextMenu(null);
              }}
            />
            <ContextMenuItem
              icon={
                contextLayer.visible ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )
              }
              label={contextLayer.visible ? '隐藏' : '显示'}
              onClick={() => {
                toggleVisible(contextMenu.layerId);
                setContextMenu(null);
              }}
            />
            <div className="my-1 h-px bg-border" />
            <ContextMenuItem
              icon={<Trash2 className="h-3.5 w-3.5" />}
              label="删除"
              danger
              onClick={() => {
                editor.removeLayer([contextMenu.layerId]);
                setContextMenu(null);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function ContextMenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-bg-hover ${
        danger ? 'text-red-400' : 'text-text-secondary'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

interface LayerTreeItemProps {
  layerId: string;
  depth: number;
  collapsedIds: Set<string>;
  selectedIds: Set<string>;
  onToggleCollapse: (id: string) => void;
  onSelect: (e: React.MouseEvent, id: string) => void;
  renamingId: string | null;
  renameValue: string;
  renameInputRef: React.RefObject<HTMLInputElement | null>;
  onStartRename: (id: string) => void;
  onRenameChange: (v: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onToggleVisible: (id: string) => void;
  dragEnabled: boolean;
  draggingId: string | null;
  dropTarget: DropTarget | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}

function LayerTreeItem({
  layerId,
  depth,
  collapsedIds,
  selectedIds,
  onToggleCollapse,
  onSelect,
  renamingId,
  renameValue,
  renameInputRef,
  onStartRename,
  onRenameChange,
  onCommitRename,
  onCancelRename,
  onContextMenu,
  onToggleVisible,
  dragEnabled,
  draggingId,
  dropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: LayerTreeItemProps) {
  const editor = useEditor();
  const layer = editor.getDocument().layers[layerId];
  if (!layer) return null;

  const isContainer = layer.type === 'frame' || layer.type === 'group';
  const isCollapsed = collapsedIds.has(layerId);
  const isSelected = selectedIds.has(layerId);
  const children = isContainer
    ? (layer as { children: string[] }).children
    : [];

  const isDragging = draggingId === layerId;
  const dropPos = dropTarget?.id === layerId ? dropTarget.position : null;
  const canDrag = dragEnabled && renamingId !== layerId;

  return (
    <>
      <div
        draggable={canDrag}
        onClick={(e) => onSelect(e, layerId)}
        onContextMenu={(e) => onContextMenu(e, layerId)}
        onDragStart={(e) => onDragStart(e, layerId)}
        onDragOver={(e) => onDragOver(e, layerId)}
        onDrop={(e) => onDrop(e, layerId)}
        onDragEnd={onDragEnd}
        style={{ paddingLeft: depth * 12 + 8 }}
        className={`group relative flex h-[26px] cursor-pointer items-center gap-2 rounded-md px-2 ${
          isSelected
            ? 'bg-accent-soft text-accent-text'
            : 'text-text-primary hover:bg-bg-hover'
        } ${layer.visible ? '' : 'opacity-50'} ${
          isDragging ? 'opacity-40' : ''
        }`}
      >
        {dropPos === 'before' && (
          <span className="pointer-events-none absolute inset-x-1 top-0 h-[2px] rounded-full bg-accent" />
        )}
        {dropPos === 'after' && (
          <span className="pointer-events-none absolute inset-x-1 bottom-0 h-[2px] rounded-full bg-accent" />
        )}
        {dropPos === 'inside' && (
          <span className="pointer-events-none absolute inset-0 rounded-md border border-accent" />
        )}
        {isContainer ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(layerId);
            }}
            className="flex h-3 w-3 shrink-0 items-center justify-center text-text-muted"
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <LayerIcon type={layer.type} />
        <div className="min-w-0 flex-1">
          {renamingId === layerId ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onBlur={onCommitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCommitRename();
                if (e.key === 'Escape') onCancelRename();
              }}
              onClick={(e) => e.stopPropagation()}
              className="h-[18px] w-full border-0 bg-bg-input px-1 text-[12px] text-text-primary outline-none ring-1 ring-accent"
            />
          ) : (
            <div
              className="truncate text-[12px]"
              onDoubleClick={(e) => {
                e.stopPropagation();
                onStartRename(layerId);
              }}
            >
              {layer.name}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisible(layerId);
          }}
          title={layer.visible ? '隐藏图层' : '显示图层'}
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${
            layer.visible
              ? 'text-text-muted opacity-0 group-hover:opacity-100'
              : 'text-text-secondary opacity-100'
          }`}
        >
          {layer.visible ? (
            <Eye className="h-3 w-3" />
          ) : (
            <EyeOff className="h-3 w-3" />
          )}
        </button>
      </div>
      {isContainer && !isCollapsed && (
        <>
          {children.map((cid) => (
            <LayerTreeItem
              key={cid}
              layerId={cid}
              depth={depth + 1}
              collapsedIds={collapsedIds}
              selectedIds={selectedIds}
              onToggleCollapse={onToggleCollapse}
              onSelect={onSelect}
              renamingId={renamingId}
              renameValue={renameValue}
              renameInputRef={renameInputRef}
              onStartRename={onStartRename}
              onRenameChange={onRenameChange}
              onCommitRename={onCommitRename}
              onCancelRename={onCancelRename}
              onContextMenu={onContextMenu}
              onToggleVisible={onToggleVisible}
              dragEnabled={dragEnabled}
              draggingId={draggingId}
              dropTarget={dropTarget}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
            />
          ))}
        </>
      )}
    </>
  );
}

function LayerIcon({ type }: { type: string }) {
  const cls = 'h-3 w-3 text-text-secondary';
  switch (type) {
    case 'rectangle':
      return <Square className={cls} />;
    case 'ellipse':
      return <Circle className={cls} />;
    case 'text':
      return <TypeIcon className={cls} />;
    case 'frame':
      return <Frame className={cls} />;
    case 'group':
      return <Layers className={cls} />;
    case 'stickyNote':
      return <StickyNote className={cls} />;
    default:
      return <Square className={cls} />;
  }
}

// ============================================================
// Assets Tab
// ============================================================

const ASSET_ICONS: Array<{ name: string; icon: string }> = [
  { name: 'star', icon: 'Star' },
  { name: 'heart', icon: 'Heart' },
  { name: 'bell', icon: 'Bell' },
  { name: 'settings', icon: 'Settings' },
  { name: 'user', icon: 'User' },
  { name: 'search', icon: 'Search' },
  { name: 'plus', icon: 'Plus' },
  { name: 'image', icon: 'ImageIcon' },
  { name: 'mail', icon: 'Mail' },
  { name: 'camera', icon: 'Camera' },
  { name: 'pencil', icon: 'Pencil' },
  { name: 'map-pin', icon: 'MapPin' },
  { name: 'lock', icon: 'Lock' },
  { name: 'globe', icon: 'Globe' },
  { name: 'zap', icon: 'Zap' },
  { name: 'history', icon: 'History' },
  { name: 'bookmark', icon: 'Bookmark' },
  { name: 'share', icon: 'Share2' },
];

const ASSET_COMPONENTS: Array<{ name: string; variants: number }> = [
  { name: 'Button', variants: 3 },
  { name: 'Navbar', variants: 2 },
  { name: 'Card', variants: 4 },
  { name: 'Avatar', variants: 5 },
  { name: 'Input', variants: 2 },
  { name: 'Badge', variants: 3 },
];

function AssetsTab() {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            Icons · {ASSET_ICONS.length}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ASSET_ICONS.map((item) => (
            <div
              key={item.name}
              className="flex flex-col items-center gap-1 rounded-lg bg-bg-elevated py-2"
            >
              <div className="flex h-[22px] w-[22px] items-center justify-center text-text-secondary">
                <AssetsIcon
                  name={item.icon}
                  className="h-[22px] w-[22px]"
                  strokeWidth={1.75}
                />
              </div>
              <span className="text-[10px] text-text-muted">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            Components · {ASSET_COMPONENTS.length}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {ASSET_COMPONENTS.map((c) => (
            <div
              key={c.name}
              className="flex flex-col gap-1.5 rounded-xl border border-border bg-bg-elevated p-2.5"
            >
              <div className="h-16 rounded-md bg-bg-active" />
              <span className="text-[10.5px] font-medium text-text-primary">
                {c.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const ICON_COMPONENTS: Record<string, LucideIcon> = {
  Star,
  Heart,
  Bell,
  Settings,
  User,
  Search,
  Plus,
  ImageIcon,
  Mail,
  Camera,
  Pencil,
  MapPin,
  Lock,
  Globe,
  Zap,
  History,
  Bookmark,
  Share2,
};

function AssetsIcon({
  name,
  className,
  strokeWidth,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = ICON_COMPONENTS[name] ?? Square;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}

// ============================================================
// Images Tab
// ============================================================

const GENERATED_IMAGES: Array<{
  name: string;
  time: string;
  color: string;
  color2: string;
}> = [
  { name: 'Dashboard UI', time: '2m ago', color: '#7C3AED', color2: '#A78BFA' },
  { name: 'Landing Hero', time: '1h ago', color: '#0369A1', color2: '#38BDF8' },
  {
    name: 'Mobile App',
    time: 'yesterday',
    color: '#0F766E',
    color2: '#34D399',
  },
  { name: 'KPI Cards', time: '2d ago', color: '#BE185D', color2: '#F472B6' },
  { name: 'Pricing Page', time: '3d ago', color: '#C2410C', color2: '#FB923C' },
];

function ImagesTab() {
  return (
    <div className="flex h-full flex-col gap-3.5 overflow-y-auto">
      <div className="flex items-center gap-2 px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
          Generated Images · {GENERATED_IMAGES.length}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {GENERATED_IMAGES.map((img) => (
          <div
            key={img.name}
            className="flex flex-col gap-2 rounded-xl border border-border bg-bg-elevated p-2.5"
          >
            <div
              className="flex h-[118px] flex-col overflow-hidden rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${img.color}33, ${img.color2}33)`,
              }}
            >
              <div className="flex h-[18px] items-center gap-1.5 bg-black/30 px-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                <span className="ml-1 h-1.5 w-16 rounded-full bg-white/15" />
              </div>
              <div className="flex flex-1 flex-col gap-1 p-2">
                <span className="h-2 w-[70px] rounded bg-white/20" />
                <span className="h-2 w-[90px] rounded bg-white/15" />
                <span
                  className="mt-1 h-[11px] w-[60px] rounded-md"
                  style={{ backgroundColor: img.color }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-text-primary">
                {img.name}
              </span>
              <span className="text-[10px] text-text-muted">{img.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

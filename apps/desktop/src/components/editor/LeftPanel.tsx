import { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Square,
  Circle,
  Type as TypeIcon,
  Frame,
  Layers,
  Search,
  StickyNote,
  Plus,
  Sparkles,
  Image as ImageIcon,
  Paperclip,
  Minus,
} from 'lucide-react';
import { useEditor } from '@/lib/editor';

type LeftTab = 'chat' | 'layers' | 'assets' | 'images';

interface LeftPanelProps {
  collapsed: boolean;
  onCollapse?: () => void;
  onExpand: () => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  layerId: string;
}

const TABS: Array<{ id: LeftTab; label: string }> = [
  { id: 'chat', label: 'Chat' },
  { id: 'layers', label: 'Layers' },
  { id: 'assets', label: 'Assets' },
  { id: 'images', label: 'Images' },
];

export function LeftPanel({ collapsed, onExpand }: LeftPanelProps) {
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

        {activeTab === 'chat' && <ChatTab />}
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

// ============================================================
// Chat Tab
// ============================================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

const SAMPLE_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    role: 'user',
    content: 'Make the cards more compact',
    time: 'now',
  },
  {
    id: 'm2',
    role: 'assistant',
    content: 'Done! Tightened the card grid and reduced padding.',
    time: '2m ago',
  },
];

function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>(SAMPLE_MESSAGES);
  const [input, setInput] = useState('');
  const [model] = useState('GPT-4o');
  const [agentCount, setAgentCount] = useState(3);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'user',
        content: input.trim(),
        time: 'now',
      },
    ]);
    setInput('');
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex h-9 flex-1 items-center justify-between rounded-lg border border-border bg-bg-input px-3">
          <span className="text-[12px] font-semibold text-text-primary">
            Dashboard redesign
          </span>
          <ChevronDown className="h-[13px] w-[13px] shrink-0 text-text-muted" />
        </div>
        <button className="flex h-8 items-center gap-1 rounded-lg bg-accent px-2.5 text-[11px] font-semibold text-white">
          <Plus className="h-3 w-3" />
          New
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto min-h-0">
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-input p-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask the agent to modify your design…"
          className="h-10 resize-none border-0 bg-transparent p-0 text-[12px] text-text-primary placeholder:text-text-muted outline-none"
        />
        <div className="flex items-center gap-2.5">
          <button className="text-text-muted hover:text-text-secondary">
            <ImageIcon className="h-[14px] w-[14px]" />
          </button>
          <button className="text-text-muted hover:text-text-secondary">
            <Paperclip className="h-[14px] w-[14px]" />
          </button>
          <div className="flex-1" />
          <button
            onClick={handleSend}
            className="flex h-[26px] w-8 items-center justify-center rounded-[13px] bg-accent text-white"
          >
            {/* arrow up */}
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
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex h-[26px] items-center gap-1.5 rounded-[13px] bg-bg-input px-2.5">
          <span className="text-[11px] font-semibold text-text-primary">
            {model}
          </span>
          <ChevronDown className="h-2.5 w-2.5 text-text-muted" />
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-[3px]">
          <button
            onClick={() => setAgentCount(Math.max(1, agentCount - 1))}
            className="flex h-5 w-5 items-center justify-center rounded-md bg-bg-input text-text-muted hover:text-text-secondary"
          >
            <Minus className="h-2.5 w-2.5" />
          </button>
          <span className="w-5 text-center text-[11px] font-semibold text-text-primary">
            {agentCount}
          </span>
          <button
            onClick={() => setAgentCount(Math.min(5, agentCount + 1))}
            className="flex h-5 w-5 items-center justify-center rounded-md bg-bg-input text-text-muted hover:text-text-secondary"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-xl bg-accent px-3 py-2 text-[11.5px] text-white">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
          <Sparkles className="h-[11px] w-[11px] text-white" />
        </div>
        <span className="text-[11px] font-semibold text-text-primary">
          Assistant
        </span>
        <span className="text-[10.5px] text-text-muted">{message.time}</span>
      </div>
      <div className="rounded-xl bg-bg-elevated px-3 py-2 text-[12.5px] text-text-secondary">
        {message.content}
      </div>
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
  const [, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    layerId: '',
  });
  const renameInputRef = useRef<HTMLInputElement>(null);

  const doc = editor.getDocument();
  const rootLayerIds = doc.rootLayerIds;
  const allLayers = doc.layers;

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

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

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
          setContextMenu({ visible: false, x: 0, y: 0, layerId: '' });
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
              onStartRename={(lid) => {
                setRenamingId(lid);
                setRenameValue(allLayers[lid]?.name || '');
              }}
              onRenameChange={setRenameValue}
              onCommitRename={() => setRenamingId(null)}
              onCancelRename={() => setRenamingId(null)}
              onContextMenu={(e, lid) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  layerId: lid,
                });
              }}
            />
          ))}
        </div>
      </div>
    </div>
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

  return (
    <>
      <div
        onClick={(e) => onSelect(e, layerId)}
        onContextMenu={(e) => onContextMenu(e, layerId)}
        style={{ paddingLeft: depth * 12 + 8 }}
        className={`group flex h-[26px] cursor-pointer items-center gap-2 rounded-md px-2 ${
          isSelected
            ? 'bg-accent-soft text-accent-text'
            : 'text-text-primary hover:bg-bg-hover'
        }`}
      >
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
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100"
        >
          <Eye className="h-3 w-3 text-text-muted" />
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
  { name: 'star', icon: 'star' },
  { name: 'heart', icon: 'heart' },
  { name: 'bell', icon: 'bell' },
  { name: 'settings', icon: 'settings' },
  { name: 'user', icon: 'user' },
  { name: 'search', icon: 'search' },
  { name: 'plus', icon: 'plus' },
  { name: 'image', icon: 'image' },
  { name: 'mail', icon: 'mail' },
  { name: 'camera', icon: 'camera' },
  { name: 'pencil', icon: 'pencil' },
  { name: 'map-pin', icon: 'map-pin' },
  { name: 'lock', icon: 'lock' },
  { name: 'globe', icon: 'globe' },
  { name: 'zap', icon: 'zap' },
  { name: 'history', icon: 'history' },
  { name: 'bookmark', icon: 'bookmark' },
  { name: 'share', icon: 'share' },
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
              className="flex flex-col items-center gap-1 rounded-lg bg-[#1b1b23] py-2"
            >
              <div className="flex h-[22px] w-[22px] items-center justify-center text-text-secondary">
                <AssetsIcon name={item.icon} className="h-[22px] w-[22px]" />
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
              <div className="h-16 rounded-md bg-[#1b1b23]" />
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

function AssetsIcon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, string> = {
    star: '★',
    heart: '♥',
    bell: '🔔',
    settings: '⚙',
    user: '👤',
    search: '🔍',
    plus: '+',
    image: '🖼',
    mail: '✉',
    camera: '📷',
    pencil: '✎',
    'map-pin': '📍',
    lock: '🔒',
    globe: '🌐',
    zap: '⚡',
    history: '⟲',
    bookmark: '🔖',
    share: '↗',
  };
  return <span className={className}>{icons[name] || '◆'}</span>;
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

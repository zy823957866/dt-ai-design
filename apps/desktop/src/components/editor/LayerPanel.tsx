import { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Square,
  Circle,
  Type,
  Frame,
  Layers,
  Copy,
  Trash2,
  Group,
  Ungroup,
  ArrowUp,
  ArrowDown,
  Search,
  ArrowDownUp,
  StickyNote,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useEditor } from '@/lib/editor';
import type {
  Layer,
  FrameLayer,
  GroupLayer,
} from '@dt-ai-design/design-schema';

interface LayerPanelProps {
  collapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  onOpenAssets?: () => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  layerId: string;
}

export function LayerPanel({
  collapsed,
  onCollapse,
  onExpand,
  onOpenAssets,
}: LayerPanelProps) {
  const editor = useEditor();
  const [activeTab, setActiveTab] = useState<'layers' | 'assets'>('layers');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    layerId: '',
  });
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<
    'before' | 'after' | 'inside' | null
  >(null);
  const [, forceUpdate] = useState(0);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const off1 = editor.subscribe('change', () => forceUpdate((t) => t + 1));
    const off2 = editor.subscribe('selectionChange', () =>
      forceUpdate((t) => t + 1),
    );
    return () => {
      off1();
      off2();
    };
  }, [editor]);

  useEffect(() => {
    if (!contextMenu.visible) return;
    const handleClick = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu.visible]);

  const doc = editor.getDocument();
  const selection = editor.getSelection();

  const layerList = useMemo(() => {
    const list: Array<{ layer: Layer; depth: number; hasChildren: boolean }> =
      [];
    function walk(ids: string[], depth: number): void {
      for (const id of ids) {
        const layer = doc.layers[id];
        if (!layer) continue;
        const isContainer = layer.type === 'frame' || layer.type === 'group';
        const children = isContainer
          ? (layer as FrameLayer | GroupLayer).children
          : undefined;
        const hasChildren = !!(children && children.length > 0);
        list.push({ layer, depth, hasChildren });
        if (isContainer && hasChildren && !collapsedIds.has(layer.id)) {
          walk(children, depth + 1);
        }
      }
    }
    walk(doc.rootLayerIds, 0);
    return list.reverse();
  }, [doc, collapsedIds]);

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startRenaming = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const layer = doc.layers[id];
    if (!layer || layer.locked) return;
    setRenamingId(id);
    setRenameValue(layer.name);
    setContextMenu((prev) => ({ ...prev, visible: false }));
    setTimeout(() => renameInputRef.current?.focus(), 0);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      editor.setLayerProperty(renamingId, 'name', renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleSelectLayer = (id: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      const current = selection.layerIds;
      const listIds = layerList.map((l) => l.layer.id);
      const clickedIndex = listIds.indexOf(id);
      const lastSelectedIndex =
        current.length > 0 ? listIds.indexOf(current[current.length - 1]) : -1;
      if (lastSelectedIndex >= 0 && clickedIndex >= 0) {
        const start = Math.min(lastSelectedIndex, clickedIndex);
        const end = Math.max(lastSelectedIndex, clickedIndex);
        editor.setSelection(listIds.slice(start, end + 1));
      } else {
        editor.setSelection([...current, id]);
      }
    } else if (e.metaKey || e.ctrlKey) {
      const current = selection.layerIds;
      editor.setSelection(
        current.includes(id)
          ? current.filter((i) => i !== id)
          : [...current, id],
      );
    } else {
      editor.setSelection([id]);
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleContextMenu = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selection.layerIds.includes(id)) editor.setSelection([id]);
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, layerId: id });
  };

  const toggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const layer = doc.layers[id];
    if (layer) editor.setLayerProperty(id, 'visible', !layer.visible);
  };

  const toggleLock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const layer = doc.layers[id];
    if (layer) editor.setLayerProperty(id, 'locked', !layer.locked);
  };

  const close = () => setContextMenu((prev) => ({ ...prev, visible: false }));
  const targetIds = () =>
    selection.layerIds.length > 0 ? selection.layerIds : [contextMenu.layerId];

  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    e.dataTransfer.setData('text/plain', layerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (
    e: React.DragEvent,
    layerId: string,
    hasChildren: boolean,
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    setDragPosition(
      hasChildren && y > height * 0.25 && y < height * 0.75
        ? 'inside'
        : y < height / 2
          ? 'before'
          : 'after',
    );
    setDragOverId(layerId);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetId) {
      setDragOverId(null);
      setDragPosition(null);
      return;
    }
    const targetLayer = doc.layers[targetId];
    if (!targetLayer) return;
    let targetParentId: string | null = null;
    let targetIndex = -1;
    for (const [id, layer] of Object.entries(doc.layers)) {
      if (layer.type === 'frame' || layer.type === 'group') {
        const idx = (layer as FrameLayer | GroupLayer).children.indexOf(
          targetId,
        );
        if (idx !== -1) {
          targetParentId = id;
          targetIndex = idx;
          break;
        }
      }
    }
    if (targetIndex === -1) {
      targetIndex = doc.rootLayerIds.indexOf(targetId);
      if (targetIndex === -1) return;
    }
    let newParentId: string | null = targetParentId;
    let newIndex = targetIndex + (dragPosition === 'before' ? 0 : 1);
    if (
      dragPosition === 'inside' &&
      (targetLayer.type === 'frame' || targetLayer.type === 'group')
    ) {
      newParentId = targetId;
      newIndex = (targetLayer as FrameLayer | GroupLayer).children.length;
    }
    editor.setLayerProperty(draggedId, 'parentId', newParentId);
    editor.setLayerProperty(draggedId, 'index', newIndex);
    setDragOverId(null);
    setDragPosition(null);
  };

  const filteredList = searchQuery
    ? layerList.filter(({ layer }) =>
        layer.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : layerList;

  const getLayerIcon = (type: string) => {
    const cls = 'h-3 w-3';
    switch (type) {
      case 'ellipse':
        return <Circle className={cls} />;
      case 'text':
        return <Type className={cls} />;
      case 'frame':
        return <Frame className={cls} />;
      case 'group':
        return <Layers className={cls} />;
      case 'stickyNote':
        return <StickyNote className={cls} />;
      default:
        return <Square className={cls} />;
    }
  };

  if (collapsed) {
    return (
      <div className="flex w-10 shrink-0 flex-col items-center gap-1 border-r border-border bg-bg-panel py-2">
        <button
          className={`flex h-7 w-7 items-center justify-center rounded-md ${activeTab === 'layers' ? 'bg-accent-soft text-accent-strong' : 'text-text-secondary hover:bg-bg-hover'}`}
          onClick={() => {
            onExpand();
            setActiveTab('layers');
          }}
        >
          <Layers className="h-4 w-4" />
        </button>
        <button
          className={`flex h-7 w-7 items-center justify-center rounded-md ${activeTab === 'assets' ? 'bg-accent-soft text-accent-strong' : 'text-text-secondary hover:bg-bg-hover'}`}
          onClick={() => {
            onExpand();
            setActiveTab('assets');
          }}
        >
          <Square className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex w-[252px] shrink-0 flex-col border-r border-border bg-bg-panel">
      {/* Panel tabs */}
      <div className="px-3 pt-3">
        <div className="flex h-[34px] rounded-lg bg-bg-input p-[3px]">
          {(['layers', 'assets'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                if (tab === 'assets' && onOpenAssets) {
                  onOpenAssets();
                  return;
                }
                setActiveTab(tab);
              }}
              className={`flex h-[26px] flex-1 items-center justify-center rounded-md text-xs capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'layers' ? (
        <>
          {/* Search */}
          <div className="px-3 pt-2.5">
            <div className="flex h-8 items-center gap-2 rounded-lg bg-bg-input px-2.5">
              <Search className="h-[13px] w-[13px] text-text-tertiary" />
              <Input
                placeholder="Filter layers"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-6 border-0 bg-transparent p-0 text-xs text-text-primary shadow-none placeholder:text-text-tertiary focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Layer tree */}
          <div className="mt-3 flex-1 overflow-y-auto px-3">
            <div className="flex h-[26px] items-center gap-2 px-2">
              <ChevronDown className="h-3 w-3 text-text-tertiary" />
              <span className="text-xs font-semibold text-text-primary">
                Page 1
              </span>
              <span className="text-[11px] text-text-tertiary">
                ({filteredList.length})
              </span>
            </div>

            {filteredList.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-tertiary">
                Draw a shape to begin
              </div>
            ) : (
              filteredList.map(({ layer, depth, hasChildren }) => {
                const selected = selection.layerIds.includes(layer.id);
                return (
                  <div key={layer.id}>
                    {dragOverId === layer.id && dragPosition === 'before' && (
                      <div className="h-0.5 bg-accent" />
                    )}
                    <div
                      className={`group relative flex h-[26px] cursor-pointer items-center gap-2 rounded-md px-2 text-xs transition-colors ${
                        selected
                          ? 'bg-accent-soft text-accent-text'
                          : 'text-text-primary hover:bg-bg-hover'
                      } ${dragOverId === layer.id && dragPosition === 'inside' ? 'ring-1 ring-accent' : ''}`}
                      style={{ paddingLeft: `${8 + depth * 14}px` }}
                      onClick={(e) => handleSelectLayer(layer.id, e)}
                      onContextMenu={(e) => handleContextMenu(layer.id, e)}
                      draggable={!layer.locked}
                      onDragStart={(e) => handleDragStart(e, layer.id)}
                      onDragOver={(e) =>
                        handleDragOver(e, layer.id, hasChildren)
                      }
                      onDragLeave={() => {
                        setDragOverId(null);
                        setDragPosition(null);
                      }}
                      onDrop={(e) => handleDrop(e, layer.id)}
                    >
                      <span className="flex w-3 shrink-0 items-center justify-center text-text-tertiary">
                        {hasChildren ? (
                          <button
                            onClick={(e) => toggleCollapse(layer.id, e)}
                            className="flex items-center justify-center"
                          >
                            {collapsedIds.has(layer.id) ? (
                              <ChevronRight className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                        ) : null}
                      </span>
                      <span
                        className={`shrink-0 ${selected ? 'text-accent-strong' : 'text-text-secondary'}`}
                      >
                        {getLayerIcon(layer.type)}
                      </span>
                      {renamingId === layer.id ? (
                        <Input
                          ref={renameInputRef}
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename();
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-5 flex-1 px-1 text-xs"
                        />
                      ) : (
                        <span
                          className="flex-1 truncate"
                          onDoubleClick={(e) => startRenaming(layer.id, e)}
                        >
                          {layer.name}
                        </span>
                      )}
                      <button
                        className="shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => toggleLock(layer.id, e)}
                      >
                        {layer.locked ? (
                          <Lock className="h-3 w-3" />
                        ) : (
                          <Unlock className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        className="shrink-0 text-text-tertiary"
                        onClick={(e) => toggleVisibility(layer.id, e)}
                      >
                        {layer.visible === false ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    {dragOverId === layer.id && dragPosition === 'after' && (
                      <div className="h-0.5 bg-accent" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-4 pb-3 pt-2">
            <span className="text-[11.5px] text-text-tertiary">
              {layerList.length} layers
            </span>
            <ArrowDownUp className="h-[13px] w-[13px] text-text-tertiary" />
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 text-center text-xs text-text-tertiary">
          No assets yet
        </div>
      )}

      {/* Collapse */}
      <button
        className="flex h-6 items-center justify-center border-t border-border text-text-tertiary hover:bg-bg-hover hover:text-text-secondary"
        onClick={onCollapse}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Context menu */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[180px] rounded-lg border border-border bg-bg-popover py-1 text-xs shadow-popover"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <CtxItem
            icon={<Copy className="h-3.5 w-3.5" />}
            label="Duplicate"
            onClick={() => {
              editor.duplicateLayer(targetIds());
              close();
            }}
          />
          <CtxItem
            icon={<Trash2 className="h-3.5 w-3.5" />}
            label="Delete"
            onClick={() => {
              editor.removeLayer(targetIds());
              close();
            }}
          />
          <div className="my-1 h-px bg-border" />
          <CtxItem
            icon={<Group className="h-3.5 w-3.5" />}
            label="Group"
            onClick={() => {
              editor.groupSelection();
              close();
            }}
          />
          <CtxItem
            icon={<Ungroup className="h-3.5 w-3.5" />}
            label="Ungroup"
            onClick={() => {
              editor.ungroupSelection();
              close();
            }}
          />
          <div className="my-1 h-px bg-border" />
          <CtxItem
            icon={<ArrowUp className="h-3.5 w-3.5" />}
            label="Bring to Front"
            onClick={() => {
              editor.moveLayerToFront(contextMenu.layerId);
              close();
            }}
          />
          <CtxItem
            icon={<ArrowDown className="h-3.5 w-3.5" />}
            label="Send to Back"
            onClick={() => {
              editor.moveLayerToBack(contextMenu.layerId);
              close();
            }}
          />
          <div className="my-1 h-px bg-border" />
          <CtxItem
            icon={<Type className="h-3.5 w-3.5" />}
            label="Rename"
            onClick={() => startRenaming(contextMenu.layerId)}
          />
          <CtxItem
            icon={<Lock className="h-3.5 w-3.5" />}
            label="Lock / Unlock"
            onClick={() => {
              const l = doc.layers[contextMenu.layerId];
              if (l)
                editor.setLayerProperty(
                  contextMenu.layerId,
                  'locked',
                  !l.locked,
                );
              close();
            }}
          />
          <CtxItem
            icon={<Eye className="h-3.5 w-3.5" />}
            label="Show / Hide"
            onClick={() => {
              const l = doc.layers[contextMenu.layerId];
              if (l)
                editor.setLayerProperty(
                  contextMenu.layerId,
                  'visible',
                  !l.visible,
                );
              close();
            }}
          />
        </div>
      )}
    </div>
  );
}

function CtxItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

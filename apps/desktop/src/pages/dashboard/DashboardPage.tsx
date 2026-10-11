import { useState, useEffect, useRef, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PenTool,
  Search,
  Clock,
  LayoutTemplate,
  Settings as SettingsIcon,
  Grid3x3,
  List,
  Plus,
  ChevronDown,
  Trash2,
  MoreHorizontal,
  Copy,
  FolderOpen,
  Loader2,
  Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ProjectMeta } from '@/shared/ipc-types';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';

type ViewMode = 'grid' | 'list';
type Section = 'recent' | 'templates';
type TimeFilter = 'today' | 'week' | 'month' | 'all';

interface FileCard {
  id: string;
  name: string;
  time: string;
  from: string;
  to: string;
  ageMs: number;
}

const HOUR = 3600_000;
const DAY = 24 * HOUR;

const TIME_FILTERS: Array<{ id: TimeFilter; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Last Week' },
  { id: 'month', label: 'Last Month' },
  { id: 'all', label: 'All' },
];

const SAMPLE_FILES: FileCard[] = [
  {
    id: 's1',
    name: 'mobile-app.pen',
    time: '2 hours ago',
    from: '#6D28D9',
    to: '#C084FC',
    ageMs: 2 * HOUR,
  },
  {
    id: 's2',
    name: 'onboarding-flow.pen',
    time: 'Yesterday',
    from: '#0F766E',
    to: '#34D399',
    ageMs: 1.5 * DAY,
  },
  {
    id: 's3',
    name: 'dashboard-ui.pen',
    time: '4 days ago',
    from: '#047857',
    to: '#10B981',
    ageMs: 4 * DAY,
  },
  {
    id: 's4',
    name: 'icon-set.pen',
    time: '2 weeks ago',
    from: '#4338CA',
    to: '#818CF8',
    ageMs: 14 * DAY,
  },
  {
    id: 's5',
    name: 'landing-page.pen',
    time: 'Yesterday',
    from: '#0369A1',
    to: '#38BDF8',
    ageMs: 1.5 * DAY,
  },
  {
    id: 's6',
    name: 'design-system.pen',
    time: '3 days ago',
    from: '#BE185D',
    to: '#F472B6',
    ageMs: 3 * DAY,
  },
  {
    id: 's7',
    name: 'marketing-site.pen',
    time: '1 week ago',
    from: '#C2410C',
    to: '#FB923C',
    ageMs: 7 * DAY,
  },
  {
    id: 's8',
    name: 'presentation.pen',
    time: '3 weeks ago',
    from: '#0E7490',
    to: '#22D3EE',
    ageMs: 21 * DAY,
  },
];

const PROJECT_GRADIENTS: Array<[string, string]> = [
  ['#6D28D9', '#C084FC'],
  ['#0F766E', '#34D399'],
  ['#047857', '#10B981'],
  ['#4338CA', '#818CF8'],
  ['#0369A1', '#38BDF8'],
  ['#BE185D', '#F472B6'],
  ['#C2410C', '#FB923C'],
  ['#0E7490', '#22D3EE'],
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [section, setSection] = useState<Section>('recent');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('未命名设计');
  const [showSettings, setShowSettings] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectMeta | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState<ProjectMeta | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const list = await window.desktopAPI.listProjects();
      setProjects(list);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const useSample = projects.length === 0;
  const files: FileCard[] = useSample
    ? SAMPLE_FILES
    : projects.map((p, i) => {
        const [from, to] = PROJECT_GRADIENTS[i % PROJECT_GRADIENTS.length];
        return {
          id: p.id,
          name: p.name,
          time: formatDate(p.updatedAt),
          from,
          to,
          ageMs: Date.now() - p.updatedAt,
        };
      });

  const filteredFiles = files.filter((f) => {
    if (
      searchQuery &&
      !f.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    if (timeFilter === 'today') return f.ageMs < DAY;
    if (timeFilter === 'week') return f.ageMs < 7 * DAY;
    if (timeFilter === 'month') return f.ageMs < 30 * DAY;
    return true;
  });

  const startRename = (file: FileCard) => {
    const project = projects.find((p) => p.id === file.id);
    if (!project) return;
    setRenamingId(file.id);
    setRenameValue(project.name);
    setTimeout(() => renameInputRef.current?.focus(), 0);
  };

  const cancelRename = () => {
    setRenamingId(null);
  };

  const commitRename = async () => {
    const id = renamingId;
    setRenamingId(null);
    if (!id || !renameValue.trim()) return;
    try {
      await window.desktopAPI.renameProject(id, renameValue.trim());
      await loadProjects();
    } catch (err) {
      console.error('Failed to rename project:', err);
    }
  };

  const handleCreateProject = async () => {
    try {
      setActionLoading(true);
      const project = await window.desktopAPI.createProject(
        newProjectName.trim() || '未命名设计',
      );
      navigate(`/editor/${project.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setActionLoading(false);
      setNewDialogOpen(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoading(true);
      await window.desktopAPI.deleteProject(deleteTarget.id);
      await loadProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleDuplicateConfirm = async () => {
    if (!duplicateTarget) return;
    try {
      setActionLoading(true);
      const full = await window.desktopAPI.openProject(duplicateTarget.id);
      if (full) {
        const newProject = await window.desktopAPI.createProject(
          `${duplicateTarget.name} 副本`,
        );
        await window.desktopAPI.saveProject(newProject.id, full.document);
        await loadProjects();
      }
    } catch (err) {
      console.error('Failed to duplicate project:', err);
    } finally {
      setActionLoading(false);
      setDuplicateDialogOpen(false);
      setDuplicateTarget(null);
    }
  };

  const requestDuplicate = (project: ProjectMeta) => {
    setDuplicateTarget(project);
    setDuplicateDialogOpen(true);
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-bg-canvas text-text-primary">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-bg-panel px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white">
            <PenTool className="h-[15px] w-[15px]" />
          </div>
          <span className="text-sm font-semibold text-text-primary">
            design.ai
          </span>
        </div>

        <div className="flex flex-1 justify-center px-6">
          <div className="flex h-8 w-[360px] items-center gap-2.5 rounded-lg bg-bg-input px-3">
            <Search className="h-[13px] w-[13px] text-text-tertiary" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files, templates, components…"
              className="h-6 flex-1 border-0 bg-transparent p-0 text-xs text-text-primary outline-none placeholder:text-text-tertiary"
            />
            <kbd className="text-[10.5px] text-text-tertiary">⌘K</kbd>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-[200px] shrink-0 flex-col border-r border-border bg-bg-panel py-3">
          <nav className="px-3">
            <SidebarItem
              icon={<Clock className="h-[15px] w-[15px]" />}
              label="Recent"
              active={section === 'recent'}
              onClick={() => setSection('recent')}
            />
            <SidebarItem
              icon={<LayoutTemplate className="h-[15px] w-[15px]" />}
              label="Templates"
              active={section === 'templates'}
              onClick={() => setSection('templates')}
            />
            <div className="my-1 ml-3 h-px w-[176px] bg-border" />
            <SidebarItem
              icon={<SettingsIcon className="h-[15px] w-[15px]" />}
              label="Settings"
              active={false}
              onClick={() => setShowSettings(true)}
            />
          </nav>
        </aside>

        {/* Main */}
        <main className="flex flex-1 flex-col overflow-hidden bg-bg-canvas">
          <div className="flex-1 overflow-y-auto px-7 py-7">
            {section === 'recent' && (
              <>
                {/* Header */}
                <div className="flex items-center">
                  <div>
                    <h1 className="text-[22px] font-bold text-text-primary">
                      Recent files
                    </h1>
                    <p className="mt-1 text-xs text-text-tertiary">
                      {filteredFiles.length} files · Synced 2 minutes ago
                    </p>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex h-8 w-[120px] items-center justify-between gap-1.5 rounded-lg bg-bg-input px-3 text-xs text-text-secondary hover:text-text-primary">
                          <span className="truncate">
                            {
                              TIME_FILTERS.find((t) => t.id === timeFilter)
                                ?.label
                            }
                          </span>
                          <ChevronDown className="h-3 w-3 shrink-0 text-text-tertiary" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        style={{ width: 140 }}
                        className="min-w-[140px]"
                      >
                        {TIME_FILTERS.map((t) => (
                          <DropdownMenuItem
                            key={t.id}
                            onClick={() => setTimeFilter(t.id)}
                            className="justify-between"
                          >
                            {t.label}
                            {timeFilter === t.id && (
                              <Check className="h-3.5 w-3.5 text-accent-strong" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex h-8 items-center rounded-lg bg-bg-input p-[3px]">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`flex h-[26px] w-7 items-center justify-center rounded-md ${viewMode === 'grid' ? 'bg-bg-elevated text-text-primary' : 'text-text-tertiary'}`}
                      >
                        <Grid3x3 className="h-[13px] w-[13px]" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`flex h-[26px] w-7 items-center justify-center rounded-md ${viewMode === 'list' ? 'bg-bg-elevated text-text-primary' : 'text-text-tertiary'}`}
                      >
                        <List className="h-[13px] w-[13px]" />
                      </button>
                    </div>

                    <button className="flex h-8 items-center rounded-lg bg-bg-input px-3 text-xs text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary">
                      Import
                    </button>

                    <button
                      onClick={() => {
                        setNewProjectName('未命名设计');
                        setNewDialogOpen(true);
                      }}
                      className="flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-500"
                    >
                      <Plus className="h-[13px] w-[13px]" />
                      New file
                    </button>
                  </div>
                </div>

                {/* Files */}
                {loading && !useSample ? (
                  <div className="mt-16 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="mt-7 grid grid-cols-4 gap-4">
                    {filteredFiles.map((file) => (
                      <FileCardView
                        key={file.id}
                        file={file}
                        project={projects.find((p) => p.id === file.id)}
                        onOpen={() =>
                          !useSample && navigate(`/editor/${file.id}`)
                        }
                        onDelete={(p) => {
                          setDeleteTarget(p);
                          setDeleteDialogOpen(true);
                        }}
                        onDuplicate={requestDuplicate}
                        renaming={renamingId === file.id}
                        renameValue={renameValue}
                        renameRef={renameInputRef}
                        onStartRename={() => startRename(file)}
                        onRenameChange={setRenameValue}
                        onCommitRename={commitRename}
                        onCancelRename={cancelRename}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-7 overflow-hidden rounded-xl border border-border bg-bg-panel">
                    {filteredFiles.map((file) => {
                      const project = projects.find((p) => p.id === file.id);
                      return (
                        <div
                          key={file.id}
                          onClick={() =>
                            !useSample && navigate(`/editor/${file.id}`)
                          }
                          className="group flex cursor-pointer items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0 hover:bg-bg-hover"
                        >
                          <span
                            className="h-8 w-8 shrink-0 rounded-md"
                            style={{
                              background: `linear-gradient(135deg, ${file.from}, ${file.to})`,
                            }}
                          />
                          <div className="flex-1">
                            {renamingId === file.id ? (
                              <input
                                ref={renameInputRef}
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={commitRename}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  e.stopPropagation();
                                  if (e.key === 'Enter') commitRename();
                                  if (e.key === 'Escape') cancelRename();
                                }}
                                className="h-5 w-full border-0 bg-bg-input px-1.5 text-[12.5px] text-text-primary outline-none ring-1 ring-accent"
                              />
                            ) : (
                              <div
                                className="text-[12.5px] text-text-primary"
                                onClick={(e) => e.stopPropagation()}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  startRename(file);
                                }}
                              >
                                {file.name}
                              </div>
                            )}
                            <div className="text-[11px] text-text-tertiary">
                              {file.time}
                            </div>
                          </div>
                          {project && (
                            <div
                              className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="text-text-tertiary hover:text-text-secondary"
                                onClick={() => requestDuplicate(project)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button
                                className="text-text-tertiary hover:text-text-secondary"
                                onClick={() => {
                                  setDeleteTarget(project);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {section === 'templates' && (
              <div className="pt-20 text-center text-sm text-text-tertiary">
                Templates coming soon
              </div>
            )}
          </div>
        </main>
      </div>

      {/* New project dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New file</DialogTitle>
            <DialogDescription>Give your design a name</DialogDescription>
          </DialogHeader>
          <input
            autoFocus
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateProject();
            }}
            className="h-8 w-full rounded-md border border-border bg-bg-input px-3 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent"
          />
          <DialogFooter>
            <button
              className="h-8 rounded-md px-3 text-sm text-text-secondary hover:bg-bg-hover"
              onClick={() => setNewDialogOpen(false)}
            >
              Cancel
            </button>
            <button
              className="h-8 rounded-md bg-accent px-3 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"
              onClick={handleCreateProject}
              disabled={actionLoading}
            >
              Create
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete file</DialogTitle>
            <DialogDescription>
              Delete “{deleteTarget?.name}”? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              className="h-8 rounded-md px-3 text-sm text-text-secondary hover:bg-bg-hover"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </button>
            <button
              className="h-8 rounded-md bg-error-bg px-3 text-sm font-medium text-error hover:bg-error-bg/80 disabled:opacity-50"
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate confirm dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicate file</DialogTitle>
            <DialogDescription>
              Duplicate “{duplicateTarget?.name}” as a new copy?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              className="h-8 rounded-md px-3 text-sm text-text-secondary hover:bg-bg-hover"
              onClick={() => setDuplicateDialogOpen(false)}
            >
              Cancel
            </button>
            <button
              className="h-8 rounded-md bg-accent px-3 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"
              onClick={handleDuplicateConfirm}
              disabled={actionLoading}
            >
              {actionLoading ? 'Duplicating…' : 'Duplicate'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showSettings && (
        <SettingsDialog onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors ${
        active
          ? 'bg-accent-soft text-accent-text'
          : 'text-text-secondary hover:bg-bg-hover'
      }`}
    >
      <span className={active ? 'text-accent-strong' : 'text-text-secondary'}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function FileCardView({
  file,
  project,
  onOpen,
  onDelete,
  onDuplicate,
  renaming,
  renameValue,
  renameRef,
  onStartRename,
  onRenameChange,
  onCommitRename,
  onCancelRename,
}: {
  file: FileCard;
  project?: ProjectMeta;
  onOpen: () => void;
  onDelete: (project: ProjectMeta) => void;
  onDuplicate: (project: ProjectMeta) => void;
  renaming: boolean;
  renameValue: string;
  renameRef: RefObject<HTMLInputElement | null>;
  onStartRename: () => void;
  onRenameChange: (v: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
}) {
  return (
    <div className="group flex h-[220px] w-full flex-col overflow-hidden rounded-xl border border-border bg-bg-panel transition-colors hover:border-border-strong">
      <button onClick={onOpen} className="h-[169px] w-full shrink-0">
        <span
          className="block h-full w-full"
          style={{
            background: `linear-gradient(135deg, ${file.from}, ${file.to})`,
          }}
        />
      </button>
      <div className="flex h-[51px] items-center px-2.5">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              ref={renameRef}
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onBlur={onCommitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCommitRename();
                if (e.key === 'Escape') onCancelRename();
              }}
              className="h-[18px] w-full border-0 bg-bg-input px-1.5 text-[12.5px] text-text-primary outline-none ring-1 ring-accent"
            />
          ) : (
            <div
              title="Double click to rename"
              onDoubleClick={onStartRename}
              className="truncate text-[12.5px] text-text-primary"
            >
              {file.name}
            </div>
          )}
          <div className="text-[11px] text-text-tertiary">{file.time}</div>
        </div>
        {project && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-6 w-6 items-center justify-center rounded-md text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100 hover:bg-bg-hover">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpen}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(project)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-error"
                onClick={() => onDelete(project)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

function formatDate(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

import { PenTool, ChevronDown, Share, Settings } from 'lucide-react';
import { Save } from 'lucide-react';

interface TitleBarProps {
  documentName: string;
  isDirty?: boolean;
  zoom: number;
  breadcrumb?: string;
  onLogoClick?: () => void;
  onExport?: () => void;
  onOpenSettings?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export function TitleBar({
  documentName,
  isDirty,
  zoom,
  breadcrumb = 'My Workspace  /  Projects  /  Dashboard',
  onLogoClick,
  onExport,
  onOpenSettings,
  onSave,
  isSaving,
}: TitleBarProps) {
  return (
    <header className="flex h-11 shrink-0 items-center border-b border-border bg-bg-panel px-4">
      {/* Left cluster */}
      <div className="flex shrink-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onLogoClick}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-brand-500"
        >
          <PenTool className="h-[15px] w-[15px]" />
        </button>
        <span className="text-sm font-semibold text-text-primary">
          design.ai
        </span>
        <span className="mx-1 h-5 w-px bg-border" />
        <span className="text-[12.5px] text-text-primary">{documentName}</span>
        {isDirty && <span className="text-[12.5px] text-accent-strong">*</span>}
      </div>

      {/* Breadcrumb */}
      <div className="flex flex-1 items-center justify-center">
        <span className="truncate text-xs text-text-tertiary">
          {breadcrumb}
        </span>
      </div>

      {/* Right cluster */}
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          className="flex h-6 items-center gap-1 rounded-md px-2 text-xs text-text-secondary transition-colors hover:bg-bg-hover"
        >
          {Math.round(zoom * 100)}%
          <ChevronDown className="h-3 w-3 text-text-tertiary" />
        </button>

        <button
          type="button"
          onClick={onExport}
          className="flex h-7 items-center gap-1.5 rounded-md px-3 text-xs text-text-secondary transition-colors hover:bg-bg-hover"
        >
          <Share className="h-3 w-3" />
          Export
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-hover"
          title="Settings"
        >
          <Settings className="h-[15px] w-[15px]" />
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-hover disabled:opacity-40"
          title={isSaving ? 'Saving…' : 'Save'}
        >
          <Save className="h-[15px] w-[15px]" />
        </button>
      </div>
    </header>
  );
}

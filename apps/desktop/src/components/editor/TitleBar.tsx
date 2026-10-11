import { PenTool, ChevronDown, Minus, Square, X, Share } from 'lucide-react';

interface TitleBarProps {
  documentName: string;
  isDirty?: boolean;
  zoom: number;
  breadcrumb?: string;
  onLogoClick?: () => void;
  onExport?: () => void;
  onOpenSettings?: () => void;
}

export function TitleBar({
  documentName,
  isDirty,
  zoom,
  breadcrumb = 'My Workspace  /  Projects  /  Dashboard',
  onLogoClick,
  onExport,
  onOpenSettings,
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

        <div className="flex h-[30px] items-center rounded-lg bg-bg-input p-[3px]">
          <span className="flex h-6 items-center rounded-md bg-bg-elevated px-3 text-xs text-text-primary">
            Design
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8B5CF6] text-[11px] font-bold text-white"
        >
          A
        </button>

        <div className="flex items-center gap-[18px] pl-2 text-text-tertiary">
          <Minus className="h-[13px] w-[13px]" />
          <Square className="h-3 w-3" />
          <X className="h-[13px] w-[13px]" />
        </div>
      </div>
    </header>
  );
}

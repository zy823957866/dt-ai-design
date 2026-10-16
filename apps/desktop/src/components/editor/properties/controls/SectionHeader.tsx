import type { ReactNode } from 'react';

export function SectionHeader({
  label,
  action,
}: {
  label: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2 mt-4 flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
      {action}
    </div>
  );
}

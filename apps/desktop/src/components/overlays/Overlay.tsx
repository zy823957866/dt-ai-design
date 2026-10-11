import type { ReactNode } from 'react';

export function Overlay({
  children,
  onClose,
  className,
}: {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex max-h-full flex-col overflow-hidden rounded-[14px] border border-border bg-bg-panel shadow-popover ${className ?? ''}`}
      >
        {children}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center rounded-lg bg-bg-input p-[3px] ${className ?? ''}`}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`flex h-[26px] flex-1 items-center justify-center rounded-md px-3 text-xs transition-colors ${
            value === o.id
              ? 'bg-bg-elevated text-text-primary'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!on)}
      className={`flex h-[26px] w-[44px] shrink-0 items-center rounded-full p-0.5 transition-colors ${on ? 'bg-accent' : 'bg-bg-input'}`}
    >
      <span
        className={`h-[20px] w-[20px] rounded-full bg-white transition-transform ${on ? 'translate-x-[18px]' : 'translate-x-0'}`}
      />
    </button>
  );
}

export function ModalHeader({
  title,
  onClose,
  action,
}: {
  title: string;
  onClose?: () => void;
  action?: ReactNode;
}) {
  return (
    <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-bg-elevated px-5">
      <span className="text-[14px] font-semibold text-text-primary">
        {title}
      </span>
      <div className="flex items-center gap-3">
        {action}
        <button
          type="button"
          onClick={onClose}
          className="text-text-tertiary hover:text-text-secondary"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <label className="flex h-[34px] items-center gap-2 rounded-lg bg-bg-input px-3">
      <span className="text-[10.5px] font-semibold uppercase tracking-wide text-text-tertiary">
        {label}
      </span>
      <input
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-6 w-full min-w-0 border-0 bg-transparent p-0 text-xs text-text-primary outline-none"
      />
    </label>
  );
}

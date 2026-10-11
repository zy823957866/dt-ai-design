import { Plus, ChevronDown, Sparkles, RefreshCw } from 'lucide-react';
import { Overlay, ModalHeader } from '@/components/overlays/Overlay';

function LField({
  label,
  placeholder,
  defaultValue,
}: {
  label: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
        {label}
      </span>
      <div className="mt-1.5 flex h-[34px] items-center rounded-lg bg-bg-input px-3">
        <input
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="h-6 w-full border-0 bg-transparent p-0 text-xs text-text-primary outline-none placeholder:text-text-tertiary"
        />
      </div>
    </label>
  );
}

export function AddProviderDialog({ onClose }: { onClose?: () => void }) {
  return (
    <Overlay onClose={onClose} className="w-[460px]">
      <ModalHeader title="Add Custom Provider" onClose={onClose} />
      <div className="space-y-3 px-5 py-4">
        <LField label="Name" placeholder="e.g. My Provider" />
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            API Type
          </span>
          <div className="mt-1.5 flex h-[34px] items-center rounded-lg bg-bg-input px-3">
            <span className="flex-1 text-xs text-text-primary">OpenAI</span>
            <ChevronDown className="h-3 w-3 text-text-tertiary" />
          </div>
        </label>
        <LField label="Base URL" placeholder="https://api.openai.com/v1" />
        <LField label="API Key" placeholder="sk-••••••••••••" />
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            Model
          </span>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex h-[34px] flex-1 items-center gap-2 rounded-lg bg-bg-input px-3">
              <Sparkles className="h-[13px] w-[13px] text-accent-strong" />
              <span className="flex-1 text-xs text-text-primary">
                claude-sonnet-4-5
              </span>
              <ChevronDown className="h-3 w-3 text-text-tertiary" />
            </div>
            <button className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary">
              <RefreshCw className="h-[13px] w-[13px]" />
              Fetch models
            </button>
          </div>
        </label>
      </div>
      <div className="flex h-14 items-center justify-end gap-3 border-t border-border px-5">
        <button
          onClick={onClose}
          className="text-xs text-text-secondary hover:text-text-primary"
        >
          Cancel
        </button>
        <button className="flex h-7 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-white hover:bg-brand-500">
          <Plus className="h-3 w-3" />
          Add Provider
        </button>
      </div>
    </Overlay>
  );
}

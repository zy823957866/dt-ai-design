import { Plus } from 'lucide-react';
import { Overlay, ModalHeader } from '@/components/overlays/Overlay';

export function AddGroupDialog({ onClose }: { onClose?: () => void }) {
  return (
    <Overlay onClose={onClose} className="w-[360px]">
      <ModalHeader title="Add group" onClose={onClose} />
      <div className="px-5 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Group name
        </div>
        <input
          placeholder="e.g. Navigation"
          className="mt-2 h-[34px] w-full rounded-lg bg-bg-input px-3 text-xs text-text-primary outline-none placeholder:text-text-tertiary"
        />
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
          Add
        </button>
      </div>
    </Overlay>
  );
}

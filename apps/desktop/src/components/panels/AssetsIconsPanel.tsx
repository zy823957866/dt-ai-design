import {
  Search,
  Plus,
  Pencil,
  Star,
  Heart,
  Bell,
  Settings,
  Home,
  User,
  Image as ImageIcon,
  Music,
  Mail,
  Camera,
  Clock,
  MapPin,
  Book,
  Play,
  Share2,
  Trash2,
  Edit3,
  Download,
  Upload,
  Link,
  Check,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Overlay } from '@/components/overlays/Overlay';

const ICON_MAP: Record<string, LucideIcon> = {
  star: Star,
  heart: Heart,
  bell: Bell,
  settings: Settings,
  home: Home,
  search: Search,
  user: User,
  image: ImageIcon,
  music: Music,
  mail: Mail,
  camera: Camera,
  clock: Clock,
  'map-pin': MapPin,
  book: Book,
  play: Play,
  'share-2': Share2,
  'trash-2': Trash2,
  'edit-3': Edit3,
  download: Download,
  upload: Upload,
  link: Link,
  check: Check,
  x: X,
  plus: Plus,
};

interface AssetsIconsPanelProps {
  onClose?: () => void;
  onAddIcon?: () => void;
  onAddGroup?: () => void;
}

export function AssetsIconsPanel({
  onClose,
  onAddIcon,
  onAddGroup,
}: AssetsIconsPanelProps) {
  const icons = Object.keys(ICON_MAP);
  return (
    <Overlay onClose={onClose} className="w-[720px]">
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="text-[14px] font-semibold text-text-primary">
          Assets
        </span>
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

      <div className="flex items-center gap-1 px-5 pt-3">
        <button className="flex h-[30px] items-center rounded-lg px-3 text-xs font-semibold text-text-secondary hover:bg-bg-hover">
          Components
        </button>
        <span className="flex h-[30px] items-center rounded-lg bg-accent px-3.5 text-xs font-semibold text-white">
          Icons
        </span>
        <button className="flex h-[30px] items-center rounded-lg px-3 text-xs font-semibold text-text-secondary hover:bg-bg-hover">
          Variables
        </button>
      </div>

      <div className="px-5 pt-4">
        <div className="flex h-[34px] items-center gap-2.5 rounded-lg bg-bg-input px-3">
          <Search className="h-[13px] w-[13px] text-text-tertiary" />
          <input
            placeholder="Search icons…"
            className="h-6 flex-1 border-0 bg-transparent p-0 text-xs text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-5 pt-3">
        <span className="flex h-[26px] items-center rounded-full bg-accent px-3 text-[11.5px] text-white">
          Basic
        </span>
        {['UI', 'Social', 'Arrows', 'Brands'].map((c) => (
          <span
            key={c}
            className="flex h-[26px] items-center rounded-full px-3 text-[11.5px] text-text-secondary"
          >
            {c}
          </span>
        ))}
        <button
          type="button"
          onClick={onAddGroup}
          className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-border bg-bg-input text-text-secondary hover:bg-bg-hover"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <div className="grid max-h-[260px] grid-cols-6 gap-1.5 overflow-y-auto px-5 py-3">
        {icons.map((name) => {
          const Icon = ICON_MAP[name];
          return (
            <button
              key={name}
              type="button"
              className="flex h-[50px] flex-col items-center justify-center gap-1 rounded-lg bg-bg-elevated hover:bg-bg-hover"
            >
              <Icon className="h-[18px] w-[18px] text-text-secondary" />
              <span className="text-[9px] text-text-tertiary">{name}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 px-5 pb-5 pt-1">
        <span className="flex-1 text-[11px] text-text-tertiary">
          Drag any icon onto the canvas — recolor and re-weight instantly
        </span>
        <button
          type="button"
          onClick={onAddIcon}
          className="flex h-7 items-center gap-1.5 rounded-full bg-accent px-3.5 text-xs font-semibold text-white hover:bg-brand-500"
        >
          <Plus className="h-3 w-3" />
          Add icon
        </button>
        <span className="flex h-7 items-center gap-1.5 rounded-full border border-accent bg-accent-soft px-3.5 text-xs font-semibold text-white">
          <Pencil className="h-3 w-3" />
          Edit
        </span>
      </div>
    </Overlay>
  );
}

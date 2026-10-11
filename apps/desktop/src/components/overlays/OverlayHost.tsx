import { AssetsPanel } from '@/components/panels/AssetsPanel';
import { AssetsIconsPanel } from '@/components/panels/AssetsIconsPanel';
import { VariablesPanel } from '@/components/panels/VariablesPanel';
import { AISkillsPanel } from '@/components/panels/AISkillsPanel';
import { ColorPickerPanel } from '@/components/panels/ColorPickerPanel';
import { ExportDialog } from '@/components/dialogs/ExportDialog';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';
import { AddIconDialog } from '@/components/dialogs/AddIconDialog';
import { AddGroupDialog } from '@/components/dialogs/AddGroupDialog';
import { AddProviderDialog } from '@/components/dialogs/AddProviderDialog';

export type OverlayName =
  | 'assets'
  | 'icons'
  | 'variables'
  | 'skills'
  | 'color'
  | 'export'
  | 'settings'
  | 'addIcon'
  | 'addGroup'
  | 'addProvider';

export function OverlayHost({
  panel,
  onOpen,
  onClose,
}: {
  panel: OverlayName | null;
  onOpen: (p: OverlayName) => void;
  onClose: () => void;
}) {
  if (!panel) return null;

  switch (panel) {
    case 'assets':
      return (
        <AssetsPanel
          onClose={onClose}
          onOpenIcons={() => onOpen('icons')}
          onOpenVariables={() => onOpen('variables')}
        />
      );
    case 'icons':
      return (
        <AssetsIconsPanel
          onClose={onClose}
          onAddIcon={() => onOpen('addIcon')}
          onAddGroup={() => onOpen('addGroup')}
        />
      );
    case 'variables':
      return <VariablesPanel onClose={onClose} />;
    case 'skills':
      return <AISkillsPanel onClose={onClose} />;
    case 'color':
      return <ColorPickerPanel onClose={onClose} />;
    case 'export':
      return <ExportDialog onClose={onClose} />;
    case 'settings':
      return <SettingsDialog onClose={onClose} />;
    case 'addIcon':
      return <AddIconDialog onClose={() => onOpen('icons')} />;
    case 'addGroup':
      return <AddGroupDialog onClose={() => onOpen('icons')} />;
    case 'addProvider':
      return <AddProviderDialog onClose={() => onOpen('settings')} />;
    default:
      return null;
  }
}

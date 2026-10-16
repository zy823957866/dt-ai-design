import type { CanvasToolId } from '@dt-ai-design/editor-interaction';
import {
  MousePointer2,
  Scaling,
  Hand,
  Square,
  Circle,
  Pentagon,
  Frame as FrameIcon,
  Type as TypeIcon,
  StickyNote,
  PenTool,
  Globe,
  type LucideIcon,
} from 'lucide-react';

export interface ToolDef {
  id: CanvasToolId;
  label: string;
  shortcut: string;
  enabled: boolean;
  icon: LucideIcon;
}

export interface ToolGroup {
  id: string;
  tools: ToolDef[];
  /** 前面显示分隔线 */
  separatorBefore?: boolean;
  /** 主按钮展示前 N 个，其余进 flyout */
  pinned?: number;
  flyout?: boolean;
  desktopOnly?: boolean;
}

export const TOOL_GROUPS: ToolGroup[] = [
  {
    id: 'move',
    tools: [
      {
        id: 'move',
        label: 'Move',
        shortcut: 'V',
        enabled: true,
        icon: MousePointer2,
      },
      {
        id: 'scale',
        label: 'Scale',
        shortcut: 'K',
        enabled: true,
        icon: Scaling,
      },
    ],
  },
  {
    id: 'primitives',
    separatorBefore: true,
    flyout: true,
    tools: [
      {
        id: 'rectangle',
        label: 'Rectangle',
        shortcut: 'R',
        enabled: true,
        icon: Square,
      },
      {
        id: 'ellipse',
        label: 'Ellipse',
        shortcut: 'O',
        enabled: true,
        icon: Circle,
      },
      {
        id: 'polygon',
        label: 'Polygon',
        shortcut: '',
        enabled: true,
        icon: Pentagon,
      },
    ],
  },
  {
    id: 'pen',
    separatorBefore: true,
    tools: [
      { id: 'pen', label: 'Pen', shortcut: 'P', enabled: true, icon: PenTool },
    ],
  },
  {
    id: 'text',
    tools: [
      {
        id: 'text',
        label: 'Text',
        shortcut: 'T',
        enabled: true,
        icon: TypeIcon,
      },
    ],
  },
  {
    id: 'frame',
    tools: [
      {
        id: 'frame',
        label: 'Frame',
        shortcut: 'F',
        enabled: true,
        icon: FrameIcon,
      },
    ],
  },
  {
    id: 'sticky',
    tools: [
      {
        id: 'sticky',
        label: 'Sticky Note',
        shortcut: 'N',
        enabled: true,
        icon: StickyNote,
      },
    ],
  },
  {
    id: 'browser',
    desktopOnly: true,
    tools: [
      {
        id: 'browser',
        label: 'Browser',
        shortcut: '',
        enabled: true,
        icon: Globe,
      },
    ],
  },
  {
    id: 'hand',
    separatorBefore: true,
    tools: [
      { id: 'hand', label: 'Hand', shortcut: 'H', enabled: true, icon: Hand },
    ],
  },
];

export const SHAPE_TOOLS = ['rectangle', 'ellipse', 'polygon'] as const;

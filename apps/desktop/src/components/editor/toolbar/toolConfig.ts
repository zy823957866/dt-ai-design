import type { CanvasToolId } from '@dt-ai-design/editor-interaction';
import {
  MousePointer2,
  Scaling,
  Hand,
  MessageSquare,
  Square,
  Circle,
  Pentagon,
  Frame as FrameIcon,
  Type as TypeIcon,
  StickyNote,
  PenTool,
  Globe,
  Box,
  Code2,
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
    pinned: 2,
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
        enabled: false,
        icon: Pentagon,
      },
      { id: 'icon', label: 'Icon', shortcut: '', enabled: false, icon: Box },
      {
        id: 'script',
        label: 'Script',
        shortcut: '',
        enabled: false,
        icon: Code2,
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
        enabled: false,
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
  {
    id: 'comment',
    tools: [
      {
        id: 'comment',
        label: 'Comment',
        shortcut: 'C',
        enabled: false,
        icon: MessageSquare,
      },
    ],
  },
];

export const SHAPE_TOOLS = ['rectangle', 'ellipse', 'frame'] as const;

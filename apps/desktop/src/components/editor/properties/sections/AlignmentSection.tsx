import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
} from 'lucide-react';
import { SectionHeader } from '../controls/SectionHeader';
import type { PropertySection, PropertyContextValue } from '../PropertySection';
import type { AlignDirection } from '@dt-ai-design/editor-core';

const ROW_H: { dir: AlignDirection; icon: typeof AlignStartVertical }[] = [
  { dir: 'left', icon: AlignStartVertical },
  { dir: 'centerH', icon: AlignCenterVertical },
  { dir: 'right', icon: AlignEndVertical },
];
const ROW_V: { dir: AlignDirection; icon: typeof AlignStartHorizontal }[] = [
  { dir: 'top', icon: AlignStartHorizontal },
  { dir: 'centerV', icon: AlignCenterHorizontal },
  { dir: 'bottom', icon: AlignEndHorizontal },
];

function AlignmentPanel({ ctx }: { ctx: PropertyContextValue }) {
  const { editor, layers } = ctx;
  const disabled = layers.length < 2;
  const render = (row: typeof ROW_H) =>
    row.map(({ dir, icon: Icon }) => (
      <button
        key={dir}
        type="button"
        disabled={disabled}
        onClick={() => editor.alignSelection(dir)}
        className="flex h-6 flex-1 items-center justify-center rounded-md text-text-tertiary hover:bg-bg-hover disabled:opacity-40"
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
    ));
  return (
    <>
      <SectionHeader label="Alignment" />
      <div className="flex gap-1">{render(ROW_H)}</div>
      <div className="mt-1 flex gap-1">{render(ROW_V)}</div>
    </>
  );
}

export const AlignmentSection: PropertySection = {
  id: 'alignment',
  title: 'Alignment',
  isAvailable: (ctx) => ctx.layers.length > 0,
  Component: AlignmentPanel,
};

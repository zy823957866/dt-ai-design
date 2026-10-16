import type { ComponentType } from 'react';
import type { Layer } from '@dt-ai-design/design-schema';
import type { EditorApi } from '@/lib/editor';

export interface PropertyContextValue {
  editor: EditorApi;
  layer: Layer | null;
  layers: Layer[];
  isMulti: boolean;
}

export interface PropertySection {
  id: string;
  title: string;
  isAvailable(ctx: PropertyContextValue): boolean;
  Component: ComponentType<{ ctx: PropertyContextValue }>;
}

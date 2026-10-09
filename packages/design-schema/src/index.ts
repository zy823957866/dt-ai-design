export interface Attrs {
  [name: string]: unknown;
}

export interface NodeSpec {
  name: string;
  attrs?: Attrs;
  group?: string;
}

export interface MarkSpec {
  name: string;
  attrs?: Attrs;
}

export interface EditorSchema {
  nodes: Record<string, NodeSpec>;
  marks: Record<string, MarkSpec>;
}

export const emptySchema: EditorSchema = {
  nodes: {},
  marks: {},
};

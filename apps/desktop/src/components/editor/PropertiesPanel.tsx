import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import {
  Minus,
  ChevronDown,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  StretchHorizontal,
  StretchVertical,
  Link2,
} from 'lucide-react';
import { useEditor } from '@/lib/editor';
import type {
  Layer,
  RectangleLayer,
  FrameLayer,
  FillStyle,
} from '@dt-ai-design/design-schema';
import {
  nodeToFormValues,
  type LayerFormValues,
} from './properties/nodeToFormValues';
import {
  formValuesToPatch,
  isPatchEmpty,
} from './properties/formValuesToPatch';

interface PropertiesPanelProps {
  collapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  onOpenColor?: () => void;
}

type LayoutMode = 'none' | 'row' | 'col';

const DEBOUNCE_MS = 300;

export function PropertiesPanel({
  collapsed,
  onCollapse,
  onExpand,
  onOpenColor,
}: PropertiesPanelProps) {
  const editor = useEditor();
  const [tab, setTab] = useState<'design' | 'dev'>('design');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('col');
  const [justify, setJustify] = useState(1);
  const [align, setAlign] = useState(2);
  const [, forceUpdate] = useState(0);

  const {
    register,
    reset,
    watch,
    formState: { isDirty },
  } = useForm<LayerFormValues>({
    defaultValues: {
      name: '',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    },
    mode: 'onChange',
  });

  // Subscribe to form value changes for debounced batch commit
  const watchedValues = watch();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalValuesRef = useRef<LayerFormValues | null>(null);
  const selectedLayerIdRef = useRef<string | null>(null);

  // Keep selection synced from editor
  useEffect(() => {
    const off1 = editor.subscribe('change', () => forceUpdate((t) => t + 1));
    const off2 = editor.subscribe('selectionChange', () =>
      forceUpdate((t) => t + 1),
    );
    return () => {
      off1();
      off2();
    };
  }, [editor]);

  const doc = editor.getDocument();
  const selection = editor.getSelection();
  const selected = selection.layerIds
    .map((id) => doc.layers[id])
    .filter(Boolean) as Layer[];
  const layer = selected.length === 1 ? selected[0] : null;

  // Reset form when selected layer changes
  useEffect(() => {
    if (!layer) {
      selectedLayerIdRef.current = null;
      originalValuesRef.current = null;
      return;
    }
    const values = nodeToFormValues(layer);
    selectedLayerIdRef.current = layer.id;
    originalValuesRef.current = values;
    reset(values);
    // Clear any pending debounced writes
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, [layer?.id, reset]);

  // Debounced batch commit: write changes to editor in a single patch
  useEffect(() => {
    if (!layer || !originalValuesRef.current || !isDirty) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const original = originalValuesRef.current!;
      const patch = formValuesToPatch(layer, watchedValues, original);
      if (!isPatchEmpty(patch)) {
        // Apply each changed field as part of a single logical edit
        // (each setLayerProperty creates its own history entry — future work: batch)
        for (const [key, value] of Object.entries(patch)) {
          if (key === 'width' || key === 'height') {
            // Width/height go through resizeLayer to keep x/y stable
            continue;
          }
          editor.setLayerProperty(layer.id, key, value);
        }
        // Handle resize separately
        const w = patch.width as number | undefined;
        const h = patch.height as number | undefined;
        if (w !== undefined || h !== undefined) {
          editor.resizeLayer(layer.id, w ?? layer.width, h ?? layer.height);
        }
        // Update baseline after commit
        originalValuesRef.current = nodeToFormValues(
          editor.getDocument().layers[layer.id],
        );
      }
      debounceRef.current = null;
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [watchedValues, layer, editor, isDirty]);

  if (collapsed) {
    return (
      <div className="flex w-10 shrink-0 flex-col items-center border-l border-border bg-bg-panel py-2">
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-bg-hover"
          onClick={onExpand}
        >
          <ChevronDown className="h-4 w-4 -rotate-90" />
        </button>
      </div>
    );
  }

  const fill = (layer as RectangleLayer | FrameLayer | undefined)
    ?.fills?.[0] as FillStyle | undefined;
  const isFrame = layer?.type === 'frame';
  const isText = layer?.type === 'text';
  const hasBox =
    layer && ['rectangle', 'frame', 'ellipse'].includes(layer.type);

  return (
    <div className="flex w-[300px] shrink-0 flex-col border-l border-border bg-bg-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="text-[12.5px] font-semibold text-text-primary">
          Properties
        </span>
        <button
          className="text-text-tertiary hover:text-text-secondary"
          onClick={onCollapse}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Design / Dev tabs */}
      <div className="px-4 pt-3">
        <div className="flex h-[30px] rounded-lg bg-bg-input p-[3px]">
          {(['design', 'dev'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex h-[22px] flex-1 items-center justify-center rounded-md text-xs capitalize transition-colors ${
                tab === t
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'dev' ? (
        <div className="flex-1 overflow-y-auto p-4">
          <pre className="rounded-lg border border-border bg-bg-panel-deep p-3 font-mono text-[11px] leading-relaxed text-text-secondary">
            {`/* ${layer?.name || 'canvas'} */
/* Live CSS / Tailwind output */`}
          </pre>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
          {!layer ? (
            <div className="pt-10 text-center text-xs text-text-tertiary">
              Nothing selected
            </div>
          ) : (
            <>
              {/* Name */}
              <div className="flex h-[34px] items-center gap-2 rounded-lg bg-bg-input px-2.5">
                <input
                  {...register('name')}
                  className="h-6 flex-1 border-0 bg-transparent p-0 text-xs text-text-primary outline-none"
                />
                <Link2 className="h-3 w-3 text-text-tertiary" />
              </div>

              {/* Position & Size */}
              <SectionHeader label="Position & Size" link />
              <div className="grid grid-cols-2 gap-2">
                <NumField label="X" valueKey="x" register={register} />
                <NumField label="Y" valueKey="y" register={register} />
                <NumField label="W" valueKey="width" register={register} />
                <NumField label="H" valueKey="height" register={register} />
              </div>

              {/* Layout (frame only) */}
              {isFrame && (
                <>
                  <SectionHeader label="Layout" />
                  <div className="flex gap-1.5">
                    {(
                      [
                        ['none', 'None'],
                        ['row', 'Flex row'],
                        ['col', 'Flex col'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        onClick={() => setLayoutMode(id)}
                        className={`h-[26px] flex-1 rounded-md text-[11.5px] transition-colors ${
                          layoutMode === id
                            ? 'border border-accent bg-accent-soft text-accent-text'
                            : 'text-text-secondary hover:bg-bg-hover'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <IconRow
                    label="Justify"
                    icons={[
                      AlignStartHorizontal,
                      AlignCenterHorizontal,
                      AlignEndHorizontal,
                      StretchHorizontal,
                    ]}
                    active={justify}
                    onSelect={setJustify}
                  />
                  <IconRow
                    label="Align"
                    icons={[
                      AlignStartVertical,
                      AlignCenterVertical,
                      AlignEndVertical,
                      StretchVertical,
                    ]}
                    active={align}
                    onSelect={setAlign}
                  />
                  <NumFieldRow label="Gap" value={12} unit="px" />
                  <NumFieldRow label="Padding" value={16} unit="px" />
                  <div className="mt-1 text-[11px] text-text-tertiary">
                    Direction · Column
                  </div>
                </>
              )}

              {/* Background */}
              {hasBox && (
                <>
                  <SectionHeader label="Background" />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onOpenColor}
                      className="h-6 w-6 rounded-md border border-border"
                      style={{ backgroundColor: fill?.color || '#1C1C24' }}
                    />
                    <span className="text-[11.5px] text-text-secondary">
                      Solid · {(fill?.color || '#1C1C24').toUpperCase()}
                    </span>
                  </div>
                </>
              )}

              {/* Corner Radius */}
              {hasBox && (
                <>
                  <SectionHeader label="Corner Radius" />
                  <NumField
                    label="px"
                    valueKey="cornerRadius"
                    register={register}
                  />
                </>
              )}

              {/* Text */}
              {isText && (
                <>
                  <SectionHeader label="Text" />
                  <textarea
                    {...register('content')}
                    rows={3}
                    className="mt-2 w-full rounded-md border border-border bg-bg-input px-2 py-1.5 text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent"
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <NumField
                      label="Size"
                      valueKey="fontSize"
                      register={register}
                    />
                    <NumField
                      label="Weight"
                      valueKey="fontWeight"
                      register={register}
                    />
                  </div>
                </>
              )}

              {/* Shadow */}
              {['rectangle', 'frame', 'ellipse'].includes(layer.type) && (
                <>
                  <SectionHeader label="Shadow" />
                  <div className="text-[11px] text-text-secondary">
                    0 · 0 · 24 · 35% rgba(0,0,0)
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section Helpers ───

function SectionHeader({ label, link }: { label: string; link?: boolean }) {
  return (
    <div className="mt-5 mb-2 flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
      {link && <Link2 className="h-3 w-3 text-text-tertiary" />}
    </div>
  );
}

function NumField({
  label,
  valueKey,
  register,
}: {
  label: string;
  valueKey: keyof LayerFormValues;
  register: ReturnType<typeof useForm<LayerFormValues>>['register'];
}) {
  return (
    <div className="flex h-7 items-center gap-2 rounded-md bg-bg-input px-2">
      <span className="text-[10.5px] text-text-tertiary">{label}</span>
      <input
        type="number"
        {...register(valueKey as 'x', { valueAsNumber: true })}
        className="h-6 w-full min-w-0 border-0 bg-transparent p-0 text-[11.5px] text-text-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    </div>
  );
}

function NumFieldRow({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="mt-2.5 flex items-center">
      <span className="text-[11px] text-text-tertiary">{label}</span>
      <span className="mx-3 h-px flex-1 bg-border" />
      <div className="flex h-7 items-center gap-2 rounded-md bg-bg-input px-2">
        <span className="text-[10.5px] text-text-tertiary">{unit}</span>
        <span className="text-[11.5px] text-text-primary">{value}</span>
      </div>
    </div>
  );
}

function IconRow({
  label,
  icons,
  active,
  onSelect,
}: {
  label: string;
  icons: Array<typeof AlignStartHorizontal>;
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="mt-2.5 flex items-center gap-2">
      <span className="w-12 text-[11px] text-text-tertiary">{label}</span>
      <div className="flex flex-1 gap-1">
        {icons.map((Icon, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={`flex h-6 flex-1 items-center justify-center rounded-md transition-colors ${
              active === i
                ? 'bg-accent-soft text-accent-strong'
                : 'text-text-tertiary hover:bg-bg-hover hover:text-text-secondary'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}

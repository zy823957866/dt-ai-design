export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T | undefined;
  options: SegmentOption<T>[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`h-[26px] flex-1 rounded-md text-[11.5px] transition-colors disabled:opacity-40 ${
            value === o.value
              ? 'border border-accent bg-accent-soft text-accent-text'
              : 'text-text-secondary hover:bg-bg-hover'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

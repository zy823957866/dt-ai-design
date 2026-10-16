import { Checkbox } from '@/components/ui/checkbox';

export function CheckboxField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean | 'indeterminate';
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-1.5 text-[11.5px] text-text-secondary"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="size-4"
      />
      {label}
    </label>
  );
}

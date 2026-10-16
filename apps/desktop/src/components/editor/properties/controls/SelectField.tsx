import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export function SelectField<T extends string>({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: T | undefined;
  options: SelectOption<T>[];
  onChange: (v: T) => void;
  placeholder?: string;
}) {
  return (
    <Select value={value ?? ''} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger className="h-7 text-[11.5px]">
        <SelectValue placeholder={placeholder ?? 'Mixed'} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

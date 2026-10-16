import { useEffect, useRef, useState } from 'react';

interface NumberFieldProps {
  label?: string;
  value: number | undefined;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
}

export function NumberField({
  label,
  value,
  onCommit,
  min,
  max,
  step = 1,
  suffix,
  disabled,
}: NumberFieldProps) {
  const [text, setText] = useState(value === undefined ? '' : String(value));
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startValRef = useRef(0);

  useEffect(() => {
    setText(value === undefined ? '' : String(Number(value.toFixed(2))));
  }, [value]);

  const clamp = (n: number) => {
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startValRef.current = value ?? 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const delta = (e.clientX - startXRef.current) * step;
    onCommit(clamp(Math.round((startValRef.current + delta) * 100) / 100));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div className="flex h-7 items-center gap-1 rounded-md bg-bg-input px-2">
      {label && (
        <span
          className="cursor-ew-resize select-none text-[10.5px] text-text-tertiary"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {label}
        </span>
      )}
      <input
        type="text"
        value={text}
        disabled={disabled}
        placeholder={value === undefined ? 'Mixed' : ''}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = Number(text);
          if (!Number.isNaN(n)) onCommit(clamp(n));
          else setText(value === undefined ? '' : String(value));
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          else if (e.key === 'ArrowUp') {
            e.preventDefault();
            onCommit(clamp((value ?? 0) + step * (e.shiftKey ? 10 : 1)));
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            onCommit(clamp((value ?? 0) - step * (e.shiftKey ? 10 : 1)));
          }
        }}
        className="h-6 w-full min-w-0 border-0 bg-transparent p-0 text-[11.5px] text-text-primary outline-none"
      />
      {suffix && (
        <span className="text-[10.5px] text-text-tertiary">{suffix}</span>
      )}
    </div>
  );
}

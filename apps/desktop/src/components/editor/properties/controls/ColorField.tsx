export function ColorField({
  color,
  onCommit,
}: {
  color: string;
  onCommit: (hex: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={color}
        onChange={(e) => onCommit(e.target.value)}
        className="h-6 w-6 cursor-pointer rounded-md border border-border bg-transparent p-0"
      />
      <input
        type="text"
        value={color}
        onChange={(e) => onCommit(e.target.value)}
        className="h-6 flex-1 rounded-md bg-bg-input px-2 text-[11.5px] text-text-primary outline-none"
      />
    </div>
  );
}

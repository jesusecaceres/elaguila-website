"use client";

const INPUT = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm";

export function EmpleosStringLinesEditor({
  items,
  onChange,
  addLabel,
  removeLabel,
  placeholder,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  addLabel: string;
  removeLabel: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((line, i) => (
        <div key={i} className="flex gap-2">
          <input
            className={`${INPUT} min-w-0 flex-1`}
            value={line}
            placeholder={placeholder}
            onChange={(e) => {
              const n = [...items];
              n[i] = e.target.value;
              onChange(n);
            }}
          />
          <button type="button" className="shrink-0 text-xs font-semibold text-red-700" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            {removeLabel}
          </button>
        </div>
      ))}
      <button type="button" className="text-sm font-semibold text-[#2563EB] underline" onClick={() => onChange([...items, ""])}>
        {addLabel}
      </button>
    </div>
  );
}

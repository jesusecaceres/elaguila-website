"use client";

import { useEffect, useState } from "react";

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
  const [localItems, setLocalItems] = useState<string[]>(items);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const commitToParent = (next: string[]) => {
    const nonBlank = next.filter((s) => s.trim() !== "");
    onChange(nonBlank);
  };

  return (
    <div className="space-y-2">
      {localItems.map((line, i) => (
        <div key={i} className="flex gap-2">
          <input
            className={`${INPUT} min-w-0 flex-1`}
            value={line}
            placeholder={placeholder}
            onChange={(e) => {
              const n = [...localItems];
              n[i] = e.target.value;
              setLocalItems(n);
            }}
            onBlur={() => commitToParent(localItems)}
          />
          <button
            type="button"
            className="shrink-0 text-xs font-semibold text-red-700"
            onClick={() => {
              const n = localItems.filter((_, j) => j !== i);
              setLocalItems(n);
              commitToParent(n);
            }}
          >
            {removeLabel}
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-sm font-semibold text-[#2563EB] underline"
        onClick={() => setLocalItems([...localItems, ""])}
      >
        {addLabel}
      </button>
    </div>
  );
}

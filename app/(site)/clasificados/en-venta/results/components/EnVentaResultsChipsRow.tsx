"use client";

type Chip = { key: string; label: string; onRemove: () => void };

export function EnVentaResultsChipsRow({
  label,
  clearLabel,
  chips,
  onClearAll,
}: {
  label: string;
  clearLabel: string;
  chips: Chip[];
  onClearAll: () => void;
}) {
  if (chips.length === 0) return null;
  return (
    <div className="w-full rounded-2xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/80 px-3 py-3 sm:px-4 sm:py-3.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A7164]">{label}</span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button
              key={`${c.key}:${c.label}`}
              type="button"
              onClick={c.onRemove}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#D4E0EA] bg-gradient-to-br from-[#F5F8FB] to-[#FFFCF7] px-3 py-1.5 text-left text-xs font-semibold text-[#2F4A65] shadow-sm transition hover:border-[#C9B46A]/35 hover:bg-[#E8EEF3]"
            >
              <span className="min-w-0 truncate">{c.label}</span>
              <span aria-hidden className="shrink-0 text-[#B8891A]">
                ×
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="shrink-0 rounded-full border border-[#C9B46A]/40 bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#2C2416] shadow-sm transition hover:bg-[#FAF7F2]"
        >
          {clearLabel}
        </button>
      </div>
    </div>
  );
}

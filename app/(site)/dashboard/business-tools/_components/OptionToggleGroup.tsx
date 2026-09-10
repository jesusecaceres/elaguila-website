"use client";

/**
 * Reusable card-style option group — single-select (radiogroup) or multi-select (group of
 * checkboxes) — shared by every step that renders a controlled-value grid (broad type, stage,
 * operating model, sales relationships/channels, authorization role) instead of duplicating the
 * same button-grid markup per step.
 */
export function OptionToggleGroup({
  legend,
  options,
  selected,
  onToggle,
  mode,
  columns = 2,
}: {
  legend: string;
  options: readonly { value: string; label: string; description?: string }[];
  selected: readonly string[];
  onToggle: (value: string) => void;
  mode: "single" | "multiple";
  columns?: 1 | 2 | 3;
}) {
  const colsClass = columns === 3 ? "sm:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : "";
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-semibold text-[#3D3428]">{legend}</legend>
      <div className={`grid grid-cols-1 gap-2 ${colsClass}`} role={mode === "single" ? "radiogroup" : "group"} aria-label={legend}>
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              role={mode === "single" ? "radio" : "checkbox"}
              aria-checked={checked}
              onClick={() => onToggle(opt.value)}
              className={`min-h-[44px] rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition ${
                checked ? "border-[#C9A84A] bg-[#FBF7EF] text-[#1E1810]" : "border-[#E8DFD0] bg-white text-[#3D3428] hover:bg-[#FAF7F2]"
              }`}
            >
              {opt.label}
              {opt.description ? <span className="mt-0.5 block text-xs font-normal text-[#7A7164]">{opt.description}</span> : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function WhyWeAsk({ label, text }: { label: string; text: string }) {
  return (
    <details className="rounded-xl border border-dashed border-[#D6C7AD] bg-[#FAF7F2]/60 p-3 text-xs text-[#5C5346]">
      <summary className="cursor-pointer font-semibold text-[#8A6B1F]">{label}</summary>
      <p className="mt-1.5">{text}</p>
    </details>
  );
}

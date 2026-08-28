"use client";

/**
 * Reusable "Agregar otra característica" input — canonical checkboxes stay whatever the caller
 * already renders; this piece only owns the free-text add/chip-list interaction, so it can be
 * dropped under any BR/Rentas highlights checklist without duplicating the pattern per form.
 */

type Props = {
  label: string;
  placeholder?: string;
  addLabel: string;
  removeAriaLabel: (label: string) => string;
  capReachedLabel?: string;
  pendingValue: string;
  onPendingChange: (next: string) => void;
  onAdd: () => void;
  canAdd: boolean;
  atCap: boolean;
  customValues: readonly string[];
  onRemove: (index: number) => void;
  inputClassName: string;
  labelClassName: string;
};

export function LeonixCustomHighlightChipAdd({
  label,
  placeholder,
  addLabel,
  removeAriaLabel,
  capReachedLabel,
  pendingValue,
  onPendingChange,
  onAdd,
  canAdd,
  atCap,
  customValues,
  onRemove,
  inputClassName,
  labelClassName,
}: Props) {
  return (
    <div className="mt-4">
      <span className={labelClassName}>{label}</span>
      <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          className={inputClassName}
          placeholder={placeholder}
          value={pendingValue}
          onChange={(e) => onPendingChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (canAdd) onAdd();
            }
          }}
        />
        <button
          type="button"
          disabled={!canAdd}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-[#C9B46A]/70 bg-[#FFF6E7] px-4 text-sm font-semibold text-[#1E1810] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          onClick={onAdd}
        >
          {addLabel}
        </button>
      </div>
      {atCap && capReachedLabel ? <p className="mt-2 text-xs text-[#8a7a62]">{capReachedLabel}</p> : null}
      {customValues.length > 0 ? (
        <div className="-mx-1 mt-3 flex flex-wrap gap-2 px-1">
          {customValues.map((v, i) => (
            <button
              key={`${v}-${i}`}
              type="button"
              title={v}
              aria-label={removeAriaLabel(v)}
              onClick={() => onRemove(i)}
              className="inline-flex max-w-full min-w-0 min-h-[40px] touch-manipulation items-center gap-1.5 rounded-full border border-[#C9B46A] bg-[#FFF6E7] px-3 py-2 text-left text-sm font-medium text-[#1E1810]"
            >
              <span className="min-w-0 flex-1 truncate">{v}</span>
              <span aria-hidden className="shrink-0 opacity-70">
                ×
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

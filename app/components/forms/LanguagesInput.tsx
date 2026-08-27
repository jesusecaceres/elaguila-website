"use client";

/**
 * Shared business-application languages primitive — generalized from Restaurantes' working
 * language-chip implementation (preset checkbox chips + a bounded custom "Other" text-entry
 * list with removable chips). Fully controlled: this component owns no persistence and no
 * field names — the caller supplies the option catalog, current selection, and every mutation
 * callback, so each category keeps its own draft shape untouched.
 *
 * Worktree A builds this component only; wiring it into Servicios/Restaurantes/Comida Local's
 * live application forms is category-adapter work for a later worktree.
 */

export type LanguageChipOption = {
  key: string;
  label: string;
  emoji?: string;
};

export type LanguagesInputProps = {
  /** Preset language chips (checkbox-style toggle). */
  options: LanguageChipOption[];
  selectedKeys: string[];
  onToggle: (key: string) => void;
  /** Key inside `options` that reveals the custom free-text entry list when selected. */
  otherKey: string;
  customValues: string[];
  /**
   * Optional cap on custom entries. Omit (or leave undefined) to allow as many as the
   * surrounding layout supports — the shared primitive itself does not impose an arbitrary
   * limit (e.g. the old "3 languages" cap some categories had is not reproduced here).
   */
  customValuesMax?: number;
  customInputValue: string;
  onCustomInputChange: (value: string) => void;
  onAddCustom: () => void;
  onRemoveCustom: (index: number) => void;
  labels: {
    otherLabel?: string;
    otherHelper?: string;
    otherPlaceholder?: string;
    add: string;
    removeAria: (value: string) => string;
  };
  className?: string;
};

export function LanguagesInput({
  options,
  selectedKeys,
  onToggle,
  otherKey,
  customValues,
  customValuesMax,
  customInputValue,
  onCustomInputChange,
  onAddCustom,
  onRemoveCustom,
  labels,
  className,
}: LanguagesInputProps) {
  const otherSelected = selectedKeys.includes(otherKey);
  const atCustomCap =
    typeof customValuesMax === "number" && customValues.length >= customValuesMax;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 rounded-xl border border-black/10 bg-black/[0.02] p-3">
        {options.map((o) => (
          <label key={o.key} className="inline-flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              className="shrink-0"
              checked={selectedKeys.includes(o.key)}
              onChange={() => onToggle(o.key)}
            />
            {o.emoji ? <span aria-hidden>{o.emoji}</span> : null}
            <span className="min-w-0">{o.label}</span>
          </label>
        ))}
      </div>

      {otherSelected ? (
        <div className="mt-3 max-w-md space-y-3">
          {customValues.length ? (
            <div className="flex flex-wrap gap-2">
              {customValues.map((value, index) => (
                <span
                  key={`${value}-${index}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/15 bg-white px-3 py-1 text-sm font-medium"
                >
                  {value}
                  <button
                    type="button"
                    className="ml-0.5 rounded-full px-1 text-black/50 hover:text-black/90"
                    aria-label={labels.removeAria(value)}
                    onClick={() => onRemoveCustom(index)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          {!atCustomCap ? (
            <>
              {labels.otherLabel ? (
                <p className="text-xs font-semibold uppercase tracking-wide">{labels.otherLabel}</p>
              ) : null}
              {labels.otherHelper ? (
                <p className="text-xs leading-relaxed opacity-70">{labels.otherHelper}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="min-w-[10rem] flex-1 rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
                  maxLength={48}
                  placeholder={labels.otherPlaceholder}
                  value={customInputValue}
                  onChange={(e) => onCustomInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onAddCustom();
                    }
                  }}
                />
                <button
                  type="button"
                  className="shrink-0 rounded-xl border border-black/15 bg-black/[0.03] px-4 py-2 text-sm font-semibold hover:bg-black/[0.06]"
                  onClick={onAddCustom}
                >
                  {labels.add}
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

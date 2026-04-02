"use client";

import { isOtroIncomplete, SELECT_OTHER_VALUE } from "@/app/clasificados/autos/negocios/lib/autoDealerSelectResolve";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";

export function SelectWithOtherField({
  label,
  options,
  value,
  customValue,
  onChange,
  customPlaceholder,
  incompleteHint,
  emptyLabel,
  optionLabels,
}: {
  label: string;
  options: readonly string[];
  value: string | undefined;
  customValue: string | undefined;
  onChange: (next: { value: string | undefined; custom: string | undefined }) => void;
  customPlaceholder: string;
  incompleteHint?: string;
  /** Label for the empty option (`value=""`). Defaults to “Seleccionar…”. */
  emptyLabel?: string;
  /** Parallel to `options` — localized display text while `value` stays canonical. */
  optionLabels?: readonly string[];
}) {
  const showCustom = value === SELECT_OTHER_VALUE;
  const incomplete = incompleteHint ? isOtroIncomplete(value, customValue) : false;

  return (
    <div>
      <label className={LABEL}>{label}</label>
      <select
        className={`${INPUT} pr-10`}
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value || undefined;
          if (v === SELECT_OTHER_VALUE) {
            onChange({ value: SELECT_OTHER_VALUE, custom: customValue });
          } else {
            onChange({ value: v, custom: undefined });
          }
        }}
      >
        {options.map((s, i) => (
          <option key={s || "empty"} value={s}>
            {s === "" ? emptyLabel ?? "Seleccionar…" : optionLabels?.[i] ?? s}
          </option>
        ))}
      </select>
      {showCustom ? (
        <>
          <input
            className={`${INPUT} mt-2`}
            placeholder={customPlaceholder}
            value={customValue ?? ""}
            onChange={(e) => onChange({ value: SELECT_OTHER_VALUE, custom: e.target.value || undefined })}
          />
          {incomplete ? <p className="mt-1 text-xs text-amber-900/90">{incompleteHint}</p> : null}
        </>
      ) : null}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { getEngineOptionsForVehicle } from "@/app/lib/clasificados/autos/autosVehicleEngineOptions";
import { autosDraftTextValue } from "@/app/lib/clasificados/autos/autosPublishFormText";

const INPUT =
  "mt-1.5 min-h-[46px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3.5 py-2.5 text-[15px] leading-snug text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";

const ENGINE_CUSTOM = "__engine_custom__";

export type AutosVehicleEngineLabels = {
  engine: string;
  selectEngine: string;
  customHint: string;
  customPlaceholder: string;
  filterNote: string;
};

export function AutosVehicleEngineField({
  lang,
  labels,
  make,
  model,
  trim,
  engine,
  onPatch,
}: {
  lang: "es" | "en";
  labels: AutosVehicleEngineLabels;
  make: string | undefined;
  model: string | undefined;
  trim: string | undefined;
  engine: string | undefined;
  onPatch: (patch: { engine?: string; engineNormalized?: string }) => void;
}) {
  const options = useMemo(() => getEngineOptionsForVehicle(make, model, trim), [make, model, trim]);
  const emptySelect = lang === "es" ? "Selecciona motor" : "Select engine";
  const customOptionLabel = lang === "es" ? "Escribir motor manualmente" : "Enter engine manually";

  const catalogMatch = engine && options.some((o) => o.toLowerCase() === engine.trim().toLowerCase());
  const [customMode, setCustomMode] = useState(() => Boolean(engine?.trim()) && !catalogMatch && options.length > 0);

  const selectValue = customMode || (engine && !catalogMatch && options.length > 0) ? ENGINE_CUSTOM : engine ?? "";

  if (options.length === 0) {
    return (
      <div>
        <label className={LABEL}>{labels.engine}</label>
        <input
          className={INPUT}
          value={engine ?? ""}
          onChange={(e) => {
            onPatch({ engine: autosDraftTextValue(e.target.value), engineNormalized: undefined });
          }}
          placeholder={labels.customPlaceholder}
          autoComplete="off"
        />
        <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{labels.customHint}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{labels.filterNote}</p>
      </div>
    );
  }

  return (
    <div>
      <label className={LABEL}>{labels.engine}</label>
      <select
        className={INPUT}
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === ENGINE_CUSTOM) {
            setCustomMode(true);
            onPatch({ engine: engine && !catalogMatch ? engine : undefined, engineNormalized: undefined });
            return;
          }
          setCustomMode(false);
          const picked = v.trim() || undefined;
          onPatch({ engine: picked, engineNormalized: picked });
        }}
      >
        <option value="">{emptySelect}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        <option value={ENGINE_CUSTOM}>{customOptionLabel}</option>
        {engine && !catalogMatch && !customMode ? (
          <option value={engine}>{engine} ({lang === "es" ? "guardado" : "saved"})</option>
        ) : null}
      </select>
      {(customMode || selectValue === ENGINE_CUSTOM) && (
        <>
          <input
            className={`${INPUT} mt-2`}
            value={engine ?? ""}
            onChange={(e) => {
              onPatch({ engine: autosDraftTextValue(e.target.value), engineNormalized: undefined });
            }}
            placeholder={labels.customPlaceholder}
            autoComplete="off"
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{labels.customHint}</p>
        </>
      )}
      <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{labels.filterNote}</p>
    </div>
  );
}

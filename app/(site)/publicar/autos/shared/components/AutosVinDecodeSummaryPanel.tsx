"use client";

import type { AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import {
  getDecodedVehicleFieldSummary,
  type AutosVehicleStructuredFields,
} from "@/app/lib/clasificados/autos/autosVehicleStructuredData";
import { autosVinDecodeSummaryTitle } from "@/app/lib/clasificados/autos/autosVinDecodeCopy";

export function AutosVinDecodeSummaryPanel({
  lang,
  fields,
  className,
}: {
  lang: AutosClassifiedsLang;
  fields: Partial<AutosVehicleStructuredFields>;
  className?: string;
}) {
  const rows = getDecodedVehicleFieldSummary(fields);
  if (rows.length === 0) return null;

  return (
    <div
      className={`mt-3 rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-3 ${className ?? ""}`}
      data-autos-vin-decode-summary="1"
    >
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-emerald-900">
        {autosVinDecodeSummaryTitle(lang)}
      </p>
      <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.key} className="flex flex-wrap gap-x-1.5 text-xs leading-snug">
            <dt className="font-semibold text-emerald-950">{lang === "es" ? row.labelEs : row.labelEn}:</dt>
            <dd className="text-emerald-900">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

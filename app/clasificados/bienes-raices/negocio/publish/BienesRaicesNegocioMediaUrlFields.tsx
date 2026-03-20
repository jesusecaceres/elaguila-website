"use client";

import type { Dispatch, SetStateAction } from "react";

export type BienesRaicesNegocioMediaUrlFieldsProps = {
  lang: "es" | "en";
  details: Record<string, string>;
  setDetails: Dispatch<SetStateAction<Record<string, string>>>;
};

/** BR Negocio: property video + virtual tour URL fields on the media step (current copy/behavior). */
export function BienesRaicesNegocioMediaUrlFields({ lang, details, setDetails }: BienesRaicesNegocioMediaUrlFieldsProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-[#111111]">
        {lang === "es" ? "Medios de la propiedad (Negocio)" : "Property media (Business)"}
      </h4>
      <div>
        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Video de la propiedad (URL)" : "Property video (URL)"}</label>
        <input
          type="url"
          value={details.enVentaVideoUrl ?? ""}
          onChange={(e) => setDetails((prev) => ({ ...prev, enVentaVideoUrl: e.target.value }))}
          placeholder="https://"
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Tour virtual (URL)" : "Virtual tour (URL)"}</label>
        <input
          type="url"
          value={details.negocioRecorridoVirtual ?? details.enVentaVirtualTourUrl ?? ""}
          onChange={(e) =>
            setDetails((prev) => ({
              ...prev,
              negocioRecorridoVirtual: e.target.value,
              enVentaVirtualTourUrl: e.target.value,
            }))
          }
          placeholder="https://"
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}

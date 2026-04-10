"use client";

import { useState } from "react";

type ZoomMode = "region" | "city";

const MAP_DEFAULTS = {
  softView: "Vista suave",
  location: "Monterrey, NL",
  area: "Área",
  zoom: "Acercar",
  hint: "Solo se muestran pocos puntos · sin “millón de pins”",
  ariaCluster: "38 anuncios en la zona. Acercar mapa.",
} as const;

/** Allow any string per field so i18n layers can override defaults without literal-type friction. */
export type BienesRaicesMapPreviewCopy = Partial<Record<keyof typeof MAP_DEFAULTS, string>>;

/**
 * Mapa secundario estático: sin SDK externo.
 * Vista “región” = burbuja de agrupación; “ciudad” = pocos marcadores (sin densidad caótica).
 */
export function BienesRaicesMapPreview({ copy }: { copy?: BienesRaicesMapPreviewCopy } = {}) {
  const [zoom, setZoom] = useState<ZoomMode>("region");
  const t = { ...MAP_DEFAULTS, ...copy };

  return (
    <div className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-[1.25rem] border border-[#E8DFD0]/80 bg-[#FDFBF7] shadow-[0_14px_44px_-20px_rgba(42,36,22,0.28)] ring-1 ring-[#C9B46A]/[0.1] lg:min-h-[320px]">
      <div className="flex items-center justify-between gap-2 border-b border-[#E8DFD0]/75 bg-gradient-to-r from-[#FFFCF7] to-[#F9F5EE]/95 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#5C5346]/75">
          <span className="shrink-0 rounded-full bg-[#E8DFD0]/55 px-2 py-0.5 text-[#3D3630]">{t.softView}</span>
          <span className="hidden truncate sm:inline">{t.location}</span>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setZoom("region")}
            className={
              "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition " +
              (zoom === "region"
                ? "bg-[#2A2620] text-[#FAF7F2] shadow-sm"
                : "text-[#5C5346] hover:bg-white/90")
            }
          >
            {t.area}
          </button>
          <button
            type="button"
            onClick={() => setZoom("city")}
            className={
              "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition " +
              (zoom === "city"
                ? "bg-[#2A2620] text-[#FAF7F2] shadow-sm"
                : "text-[#5C5346] hover:bg-white/90")
            }
          >
            {t.zoom}
          </button>
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-center bg-[#FDFBF7] p-4">
        {/* Calles sugeridas */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(61,54,48,0.25) 1px, transparent 1px),
              linear-gradient(rgba(61,54,48,0.2) 1px, transparent 1px)
            `,
            backgroundSize: "28px 28px",
          }}
        />
        {zoom === "region" ? (
          <button
            type="button"
            onClick={() => setZoom("city")}
            className="relative z-[1] flex min-h-[52px] min-w-[52px] items-center justify-center rounded-full border-2 border-white bg-[#C5A059] text-sm font-bold text-[#1E1810] shadow-[0_8px_24px_rgba(61,54,48,0.2)] transition hover:scale-[1.03]"
            aria-label={t.ariaCluster}
          >
            38
          </button>
        ) : (
          <div className="relative z-[1] flex h-40 w-full max-w-[220px] items-center justify-center">
            {[
              { t: "12%", l: "18%" },
              { t: "55%", l: "62%" },
              { t: "28%", l: "72%" },
            ].map((pos, i) => (
              <span
                key={i}
                className="absolute flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#B8954A] text-[10px] font-bold text-[#1E1810] shadow-md"
                style={{ top: pos.t, left: pos.l }}
              >
                L
              </span>
            ))}
            <p className="pointer-events-none absolute bottom-0 left-1/2 w-max max-w-[min(100%,280px)] -translate-x-1/2 text-center text-[10px] font-medium leading-snug text-[#5C5346]/75">
              {t.hint}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

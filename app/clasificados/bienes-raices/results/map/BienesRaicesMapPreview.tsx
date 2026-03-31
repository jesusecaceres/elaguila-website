"use client";

import { useState } from "react";

type ZoomMode = "region" | "city";

/**
 * Mapa secundario estático: sin SDK externo.
 * Vista “región” = burbuja de agrupación; “ciudad” = pocos marcadores (sin densidad caótica).
 */
export function BienesRaicesMapPreview() {
  const [zoom, setZoom] = useState<ZoomMode>("region");

  return (
    <div className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-[#E8DFD0]/90 bg-[#FDFBF7] shadow-[0_12px_36px_-18px_rgba(42,36,22,0.25)] lg:min-h-[320px]">
      <div className="flex items-center justify-between gap-2 border-b border-[#E8DFD0]/80 bg-[#FFFCF7]/90 px-3 py-2">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#5C5346]/75">
          <span className="rounded-full bg-[#E8DFD0]/60 px-2 py-0.5 text-[#3D3630]">Vista suave</span>
          <span className="hidden sm:inline">Monterrey, NL</span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setZoom("region")}
            className={
              "rounded-lg px-2 py-1 text-xs font-semibold " +
              (zoom === "region"
                ? "bg-[#2A2620] text-[#FAF7F2]"
                : "text-[#5C5346] hover:bg-white/80")
            }
          >
            Área
          </button>
          <button
            type="button"
            onClick={() => setZoom("city")}
            className={
              "rounded-lg px-2 py-1 text-xs font-semibold " +
              (zoom === "city"
                ? "bg-[#2A2620] text-[#FAF7F2]"
                : "text-[#5C5346] hover:bg-white/80")
            }
          >
            Acercar
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
            aria-label="38 anuncios en la zona. Acercar mapa."
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
            <p className="pointer-events-none absolute bottom-0 left-1/2 w-max -translate-x-1/2 text-center text-[10px] font-medium text-[#5C5346]/75">
              Solo se muestran pocos puntos · sin “millón de pins”
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

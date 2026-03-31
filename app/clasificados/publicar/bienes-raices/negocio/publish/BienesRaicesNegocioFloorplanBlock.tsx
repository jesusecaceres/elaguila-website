"use client";

import type { Dispatch, SetStateAction } from "react";
import { isFloorplanUrlProbablyImage, isFloorplanUrlProbablyPdf } from "../utils/floorplanUrlGuards";

export type BienesRaicesNegocioFloorplanBlockProps = {
  lang: "es" | "en";
  details: Record<string, string>;
  setDetails: Dispatch<SetStateAction<Record<string, string>>>;
  floorPlanUploading: boolean;
  uploadBusinessFloorPlan: (file: File) => void | Promise<void>;
};

/** BR Negocio: floorplan upload + URL + inline preview (current behavior). */
export function BienesRaicesNegocioFloorplanBlock({
  lang,
  details,
  setDetails,
  floorPlanUploading,
  uploadBusinessFloorPlan,
}: BienesRaicesNegocioFloorplanBlockProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
      <label className="text-sm text-[#111111] font-semibold">
        {lang === "es" ? "Plano / Floorplan" : "Floorplan"}
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="shrink-0 cursor-pointer rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-[#EFE7D8] focus-within:ring-2 focus-within:ring-yellow-400/30">
          {floorPlanUploading ? (lang === "es" ? "Subiendo…" : "Uploading…") : (lang === "es" ? "Subir plano" : "Upload floorplan")}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.pdf,application/pdf"
            className="sr-only"
            disabled={floorPlanUploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadBusinessFloorPlan(f);
              e.target.value = "";
            }}
          />
        </label>
        {details.negocioFloorPlanUrl ? (
          (() => {
            const u = (details.negocioFloorPlanUrl ?? "").trim();
            if (isFloorplanUrlProbablyPdf(u)) {
              return (
                <a
                  href={u}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-[#EFEFEF]"
                >
                  <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#111111]/80">PDF</span>
                  {lang === "es" ? "Abrir archivo PDF" : "Open PDF file"}
                </a>
              );
            }
            if (isFloorplanUrlProbablyImage(u)) {
              return (
                <a
                  href={u}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-black/10 bg-white p-1.5 pr-2 hover:bg-[#F8F6F0] transition"
                >
                  <img src={u} alt="" className="h-14 w-20 rounded object-cover bg-[#E8E8E8]" />
                  <span className="text-xs font-medium text-[#111111] underline decoration-[#C9B46A]/70">
                    {lang === "es" ? "Ver imagen" : "View image"}
                  </span>
                </a>
              );
            }
            return (
              <a
                href={u}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#111111] underline decoration-[#C9B46A]/70"
              >
                {lang === "es" ? "Abrir archivo" : "Open file"}
              </a>
            );
          })()
        ) : null}
      </div>
      <input
        type="url"
        value={details.negocioFloorPlanUrl ?? ""}
        onChange={(e) => setDetails((prev) => ({ ...prev, negocioFloorPlanUrl: e.target.value }))}
        placeholder="https://"
        className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
      />
      {details.negocioFloorPlanUrl &&
        !floorPlanUploading &&
        (() => {
          const u = (details.negocioFloorPlanUrl ?? "").trim();
          if (!u || u.startsWith("blob:")) return null;
          if (isFloorplanUrlProbablyImage(u)) {
            return (
              <div className="mt-3 rounded-lg border border-black/10 bg-[#E8E8E8]/50 p-2">
                <img src={u} alt="" className="max-h-40 w-full rounded object-contain bg-white" />
              </div>
            );
          }
          if (isFloorplanUrlProbablyPdf(u)) {
            return (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-black/15 bg-white/80 px-3 py-2 text-xs text-[#111111]/80">
                <span className="rounded bg-[#F5F5F5] px-1.5 py-0.5 text-[10px] font-bold uppercase">PDF</span>
                {lang === "es"
                  ? "Archivo PDF: usa “Abrir archivo PDF” arriba para verlo."
                  : "PDF file: use “Open PDF file” above to view it."}
              </div>
            );
          }
          return (
            <p className="mt-3 text-xs text-[#111111]/60">
              {lang === "es"
                ? "Enlace guardado. Usa “Abrir archivo” arriba si la vista previa no aplica."
                : "Link saved. Use “Open file” above if no inline preview applies."}
            </p>
          );
        })()}
      <p className="mt-1 text-xs text-[#111111]/50">
        {lang === "es"
          ? "Sube imagen/PDF o pega enlace. (Se abrirá en nueva pestaña.)"
          : "Upload image/PDF or paste URL. (Opens in a new tab.)"}
      </p>
    </div>
  );
}

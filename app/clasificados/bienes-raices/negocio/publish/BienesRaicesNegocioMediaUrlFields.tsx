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
        {lang === "es" ? "Enlaces de video y tour (opcional)" : "Video & tour links (optional)"}
      </h4>
      <p className="text-[11px] leading-snug text-[#111111]/65">
        {lang === "es"
          ? "Pega un enlace público (YouTube, Vimeo, Matterport, etc.). Aparecerá en la galería y en la vista previa igual que para los compradores."
          : "Paste a public link (YouTube, Vimeo, Matterport, etc.). It will show in the gallery and preview the same way buyers see it."}
      </p>
      <div>
        <label className="text-xs font-medium text-[#111111]/85">{lang === "es" ? "Video de la propiedad (URL)" : "Property video (URL)"}</label>
        <input
          type="url"
          value={details.brVideoUrl ?? ""}
          onChange={(e) => setDetails((prev) => ({ ...prev, brVideoUrl: e.target.value }))}
          placeholder="https://"
          className="mt-1 w-full min-w-0 rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-[10px] text-[#111111]/55">
          {lang === "es"
            ? "Opcional si ya subiste video en el paso de fotos. Si usas ambos, revisa la vista previa para ver cuál quieres destacar."
            : "Optional if you already uploaded a video with photos. If you use both, check the preview to see which should lead."}
        </p>
      </div>
      <div>
        <label className="text-xs font-medium text-[#111111]/85">{lang === "es" ? "Tour virtual (URL)" : "Virtual tour (URL)"}</label>
        <input
          type="url"
          value={details.negocioRecorridoVirtual ?? details.brVirtualTourUrl ?? ""}
          onChange={(e) =>
            setDetails((prev) => ({
              ...prev,
              negocioRecorridoVirtual: e.target.value,
              brVirtualTourUrl: e.target.value,
            }))
          }
          placeholder="https://"
          className="mt-1 w-full min-w-0 rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-[10px] text-[#111111]/55">
          {lang === "es"
            ? "Matterport, URL de tu sitio u otro recorrido 360°. Debe abrirse sin contraseña para que los compradores confíen."
            : "Matterport, your site, or another 360° tour. It should open without a password so buyers trust the link."}
        </p>
      </div>
    </div>
  );
}

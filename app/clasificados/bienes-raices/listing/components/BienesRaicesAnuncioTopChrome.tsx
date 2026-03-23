"use client";

import type { BrAnuncioLang } from "../types/brAnuncioLiveTypes";

const SECTIONS_PRIVADO = [
  { id: "resumen", es: "Resumen", en: "Summary" },
  { id: "detalles", es: "Detalles", en: "Details" },
  { id: "ubicacion", es: "Ubicación", en: "Location" },
  { id: "contacto", es: "Contacto", en: "Contact" },
] as const;

const SECTIONS_NEGOCIO = [
  { id: "resumen", es: "Resumen", en: "Summary" },
  { id: "interior", es: "Interior", en: "Interior" },
  { id: "exterior", es: "Exterior", en: "Exterior" },
  { id: "detalles", es: "Detalles", en: "Details" },
  { id: "ubicacion", es: "Ubicación", en: "Location" },
  { id: "contacto", es: "Contacto", en: "Contact" },
] as const;

/** BR Privado/Negocio live anuncio: faux hub header + in-page section nav (extracted from anuncio page). */
export function BienesRaicesAnuncioTopChrome({
  lang,
  variant = "negocio",
}: {
  lang: BrAnuncioLang;
  /** Privado preview uses four sections; negocio adds interior/exterior anchors. */
  variant?: "privado" | "negocio";
}) {
  const sections = variant === "privado" ? SECTIONS_PRIVADO : SECTIONS_NEGOCIO;
  return (
    <>
      <header className="mt-8 rounded-2xl border border-[#C9B46A]/25 bg-[#FAFAF8] shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#111111]">{lang === "es" ? "Leonix Clasificados" : "Leonix Classifieds"}</span>
          </div>
          <div className="flex-1 min-w-0 max-w-md mx-auto">
            <div className="rounded-xl border border-[#C9B46A]/30 bg-white/90 px-4 py-2.5 text-sm text-[#111111]/60">
              {lang === "es" ? "Buscar anuncios…" : "Search listings…"}
            </div>
          </div>
          <div>
            <a
              href={`/clasificados/publicar/bienes-raices?lang=${lang}`}
              className="inline-block rounded-xl bg-[#2D5016] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#244012] transition"
            >
              {lang === "es" ? "Publicar" : "Post"}
            </a>
          </div>
        </div>
      </header>
      <nav className="mt-3 flex flex-wrap items-center gap-2" aria-label={lang === "es" ? "Secciones del anuncio" : "Listing sections"}>
        {sections.map(({ id, es: esLabel, en: enLabel }) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-lg border border-[#C9B46A]/30 bg-[#F8F6F0]/80 px-3 py-2 text-xs font-medium text-[#111111]/90 hover:bg-[#EFE7D8] transition"
          >
            {lang === "es" ? esLabel : enLabel}
          </a>
        ))}
      </nav>
    </>
  );
}

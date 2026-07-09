"use client";

import { FiMapPin } from "react-icons/fi";
import { buildOfertaLocalPreviewMapEmbedUrl } from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";

type Lang = "es" | "en";

const BTN_PRIMARY =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a1926]";

/** Free Google Maps embed preview — same pattern as Ofertas Locales Business Hub. */
export function BrLeonixPreviewMiniMap({
  locationLine,
  directionsHref,
  lang,
  variant = "light",
}: {
  locationLine: string;
  directionsHref: string;
  lang: Lang;
  /** `light` for cream pages; `dark` for negocio contact rail. */
  variant?: "light" | "dark";
}) {
  const embedUrl = buildOfertaLocalPreviewMapEmbedUrl(locationLine);
  const mapTitle = lang === "en" ? "Map preview" : "Vista del mapa";
  const directionsLabel = lang === "en" ? "Get directions" : "Cómo llegar";
  const textClass = variant === "dark" ? "text-[#F5F0E8]" : "text-[#1E1814]/85";
  const pinClass = variant === "dark" ? "text-[#C5A059]" : "text-[#B8860B]";
  const frameClass =
    variant === "dark"
      ? "overflow-hidden rounded-lg border border-white/15 bg-[#3A342E]/60"
      : "overflow-hidden rounded-lg border border-[#D4C4A8]/70 bg-[#FDF8F0]/40";
  const frameHeaderClass =
    variant === "dark"
      ? "border-b border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#E8DFD4]/70"
      : "border-b border-[#E8D9C4]/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/50";

  if (!locationLine.trim() && !directionsHref) return null;

  return (
    <div className="space-y-3">
      {locationLine.trim() ? (
        <p className={`flex items-start gap-2 text-sm leading-relaxed ${textClass}`}>
          <FiMapPin className={`mt-0.5 h-4 w-4 shrink-0 ${pinClass}`} aria-hidden />
          <span>{locationLine}</span>
        </p>
      ) : null}
      {embedUrl ? (
        <div className={frameClass}>
          <p className={frameHeaderClass}>{mapTitle}</p>
          <iframe
            title={mapTitle}
            src={embedUrl}
            className="h-40 w-full max-w-full border-0 sm:h-44"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}
      {directionsHref ? (
        <a href={directionsHref} target="_blank" rel="noopener noreferrer" className={BTN_PRIMARY}>
          <FiMapPin className="h-4 w-4" aria-hidden />
          {directionsLabel}
        </a>
      ) : null}
    </div>
  );
}

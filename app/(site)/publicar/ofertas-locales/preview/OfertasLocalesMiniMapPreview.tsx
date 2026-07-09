"use client";

import { FiMapPin } from "react-icons/fi";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { buildOfertaLocalPreviewMapEmbedUrl } from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

const BTN_PRIMARY =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a1926]";

export function OfertasLocalesMiniMapPreview({
  locationLine,
  directionsHref,
  lang,
}: {
  locationLine: string;
  directionsHref: string;
  lang: OfertasLocalesAppLang;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  const embedUrl = buildOfertaLocalPreviewMapEmbedUrl(locationLine);
  const mapTitle = lang === "en" ? c.quickMapViewEn : c.quickMapViewEs;

  return (
    <div className="space-y-3">
      <p className="flex items-start gap-2 text-sm leading-relaxed text-[#1E1814]/85">
        <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#B8860B]" aria-hidden />
        <span>{locationLine}</span>
      </p>
      {embedUrl ? (
        <div className="overflow-hidden rounded-lg border border-[#D4C4A8]/70 bg-[#FDF8F0]/40">
          <p className="border-b border-[#E8D9C4]/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/50">
            {mapTitle}
          </p>
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
          {lang === "en" ? c.directions : c.directionsEs}
        </a>
      ) : null}
    </div>
  );
}

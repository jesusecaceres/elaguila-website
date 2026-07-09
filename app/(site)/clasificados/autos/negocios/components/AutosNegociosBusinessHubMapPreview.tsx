"use client";

import { FiMapPin } from "react-icons/fi";
import { buildAutosDealerMapEmbedUrl } from "@/app/lib/clasificados/autos/autosDealerStructuredAddress";
import { autosPreviewBurgundyPrimaryBtnClass } from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

/**
 * Real embedded map preview — mirrors OfertasLocalesMiniMapPreview (no API key, address-driven).
 */
export function AutosNegociosBusinessHubMapPreview({
  locationLine,
  directionsHref,
  quickMapLabel,
  directionsLabel,
}: {
  locationLine: string;
  directionsHref?: string;
  quickMapLabel: string;
  directionsLabel: string;
}) {
  const line = locationLine.trim();
  const embedUrl = buildAutosDealerMapEmbedUrl(line);
  const directions = directionsHref?.trim() ?? "";

  if (!line && !embedUrl && !directions) return null;

  return (
    <div className="space-y-3">
      {line ? (
        <p className="flex items-start gap-2 text-left text-sm leading-relaxed text-[color:var(--lx-text-2)] lg:text-[15px]">
          <FiMapPin className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
          <span className="font-medium text-[color:var(--lx-text)]">{line}</span>
        </p>
      ) : null}
      {embedUrl ? (
        <div className="overflow-hidden rounded-xl border border-[#D6C7AD]/70 bg-[#FDF8F0]/40">
          <p className="border-b border-[#E8D9C4]/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/50">
            {quickMapLabel}
          </p>
          <iframe
            title={quickMapLabel}
            src={embedUrl}
            className="h-40 w-full max-w-full border-0 sm:h-44"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}
      {directions ? (
        <a
          href={directions}
          target="_blank"
          rel="noopener noreferrer"
          className={`${autosPreviewBurgundyPrimaryBtnClass} inline-flex min-h-[48px] w-full items-center justify-center gap-2 sm:w-auto sm:min-w-[12rem]`}
        >
          <FiMapPin className="h-4 w-4 shrink-0" aria-hidden />
          {directionsLabel}
        </a>
      ) : null}
    </div>
  );
}

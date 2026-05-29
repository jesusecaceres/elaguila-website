"use client";

import type { ReactNode } from "react";

type Props = {
  lang: "es" | "en";
  sellerInitials: string;
  sellerName: string;
  sellerSubline?: string;
  sellerKindLabel?: string;
  locationLine?: string;
  locationNote?: string;
  /** Google Maps search/directions href when location exists. */
  mapHref?: string | null;
  onOpenMap?: () => void;
  fulfillmentLabels?: string[];
  contactSection: ReactNode;
  safetyLine: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function EnVentaBuyerPanel({
  lang,
  sellerInitials,
  sellerName,
  sellerSubline,
  sellerKindLabel,
  locationLine,
  locationNote,
  mapHref,
  onOpenMap,
  fulfillmentLabels = [],
  contactSection,
  safetyLine,
}: Props) {
  const contactH = lang === "es" ? "Contacto" : "Contact";
  const locationH = lang === "es" ? "Ubicación" : "Location";
  const fulfillmentH = lang === "es" ? "Entrega" : "Fulfillment";
  const mapLabel = lang === "es" ? "Abrir mapa" : "Open map";
  const defaultLocationNote =
    lang === "es" ? "Ubicación indicada por el vendedor" : "Location provided by the seller";

  return (
    <aside className="rounded-md border border-[#E8DFD0]/90 bg-[#FFFCF7] p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] sm:p-5">
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] text-[12px] font-bold text-[#1E1810] ring-1 ring-[#C9B46A]/35"
          aria-hidden
        >
          {sellerInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-bold tracking-tight text-[#1E1810]">{sellerName}</p>
            {sellerKindLabel ? (
              <span className="shrink-0 rounded-md border border-[#E8DFD0]/90 bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5C5346]">
                {sellerKindLabel}
              </span>
            ) : null}
          </div>
          {sellerSubline ? (
            <p className="mt-1 text-xs font-medium leading-snug text-[#5C5346]/90">{sellerSubline}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 border-t border-[#E8DFD0]/80 pt-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{contactH}</p>
        <div className="mt-3">{contactSection}</div>
      </div>

      {locationLine ? (
        <div className="mt-4 border-t border-[#E8DFD0]/80 pt-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{locationH}</p>
          <p className="mt-2 flex items-start gap-2 text-sm font-semibold leading-snug text-[#1E1810]">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#8A8070]" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                fill="currentColor"
              />
            </svg>
            <span className="min-w-0 break-words">{locationLine}</span>
          </p>
          <p className="mt-1.5 text-[11px] leading-snug text-[#7A7164]/95">{locationNote || defaultLocationNote}</p>
          {mapHref || onOpenMap ? (
            <button
              type="button"
              onClick={() => {
                if (onOpenMap) {
                  onOpenMap();
                  return;
                }
                if (mapHref && typeof window !== "undefined") {
                  window.open(mapHref, "_blank", "noopener,noreferrer");
                }
              }}
              className="mt-3 inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-md border border-[#C9B46A]/45 bg-white px-3 py-2 text-xs font-bold text-[#1E1810] transition hover:border-[#C9A84A]/65 hover:bg-[#FFFCF7]"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {mapLabel}
            </button>
          ) : null}
        </div>
      ) : null}

      {fulfillmentLabels.length > 0 ? (
        <div className="mt-4 border-t border-[#E8DFD0]/80 pt-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{fulfillmentH}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {fulfillmentLabels.map((label) => (
              <span
                key={label}
                className="inline-flex max-w-full rounded-md border border-[#C9B46A]/40 bg-[#FBF7EF] px-2.5 py-1 text-[11px] font-semibold leading-snug text-[#3D3428]"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <p className={cx("mt-4 border-t border-[#E8DFD0]/80 pt-4 text-[11px] leading-relaxed text-[#7A7164]/95")}>
        {safetyLine}
      </p>
    </aside>
  );
}

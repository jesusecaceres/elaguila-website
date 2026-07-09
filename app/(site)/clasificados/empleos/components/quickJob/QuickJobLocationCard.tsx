"use client";

import type { QuickJobLocationBlock } from "../../data/empleoQuickJobSampleData";

type Props = {
  location: QuickJobLocationBlock;
  sectionTitle: string;
  ctaLabel: string;
  onOpen?: () => void;
  compact?: boolean;
};

/** Build Google Maps embed URL from a real address line (no fake coordinates). */
function buildEmpleosPreviewMapEmbedUrl(locationLine: string): string {
  const q = locationLine.trim();
  if (!q) return "";
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
}

export function QuickJobLocationCard({ location, sectionTitle, ctaLabel, onOpen, compact }: Props) {
  const locality = [location.city, location.state, location.country].filter((x) => (x ?? "").trim()).join(", ");
  const fullLine = [locality, location.zip].filter((x) => (x ?? "").trim()).join(" · ");
  const query = [location.addressLine1, fullLine].filter((x) => x.trim() && x !== "—" && x !== "Remoto").join(", ");
  const mapsHref = query.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : null;
  const showMap = !location.isRemote && Boolean(location.addressLine1?.trim() && location.addressLine1 !== "—");
  const embedUrl = showMap ? buildEmpleosPreviewMapEmbedUrl(query) : "";

  return (
    <section className={`rounded-xl border border-[#D6C7AD]/80 bg-[#FFFDF7] shadow-[0_10px_28px_-16px_rgba(31,36,28,0.18)] ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8A6B1F]">{sectionTitle}</p>
      <div className="mt-2.5 flex items-start gap-2">
        <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#8A8070]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
        <address className="min-w-0 not-italic text-sm leading-relaxed text-[#4A4744]">
          <p className="font-semibold text-[#3D3428]">{location.businessLine}</p>
          {location.isRemote ? (
            <p className="mt-0.5 font-medium text-[#5C5346]">Remoto</p>
          ) : null}
          {location.addressLine1 && location.addressLine1 !== "—" && !location.isRemote ? (
            <p className="mt-0.5">{location.addressLine1}</p>
          ) : null}
          {location.addressLine2 ? <p className="mt-0.5">{location.addressLine2}</p> : null}
          {fullLine ? <p className="mt-0.5">{fullLine}</p> : null}
          {location.locationNotes ? (
            <p className="mt-1 text-xs text-[#7A7164]">{location.locationNotes}</p>
          ) : null}
        </address>
      </div>
      {embedUrl ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-[#D4C4A8]/70 bg-[#FDF8F0]/40">
          <p className="border-b border-[#E8D9C4]/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/50">
            Mapa
          </p>
          <iframe
            title="Mapa de ubicación"
            src={embedUrl}
            className={`border-0 ${compact ? "h-32" : "h-40"} w-full max-w-full sm:h-44`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}
      {mapsHref ? (
        <button
          type="button"
          onClick={() => {
            window.open(mapsHref, "_blank", "noopener,noreferrer");
            onOpen?.();
          }}
          className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] ${compact ? "min-h-[36px] px-3 py-1.5 text-xs" : "min-h-[40px] px-3 py-2 text-xs"}`}
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {ctaLabel}
        </button>
      ) : null}
    </section>
  );
}

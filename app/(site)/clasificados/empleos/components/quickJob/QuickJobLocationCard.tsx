"use client";

import { useId } from "react";
import type { QuickJobLocationBlock } from "../../data/empleoQuickJobSampleData";

type Props = {
  location: QuickJobLocationBlock;
  sectionTitle: string;
  ctaLabel: string;
  onOpen?: () => void;
  compact?: boolean;
};

function QuickJobFauxMap({ compact }: { compact?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const gridId = `ej-map-grid-${uid}`;
  const washId = `ej-map-wash-${uid}`;
  const vigId = `ej-map-vig-${uid}`;
  return (
    <div
      className={`relative mt-3 w-full max-w-full overflow-hidden rounded-lg border border-[#C9A84A]/25 shadow-sm ${compact ? "aspect-[3/1]" : "aspect-[2/1]"}`}
      style={{
        background: "linear-gradient(160deg, #2A2620 0%, #1E1814 38%, #2F241F 72%, #1A1612 100%)",
        maxHeight: compact ? "4.5rem" : "7.5rem",
      }}
      aria-hidden
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={gridId} width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M 22 0 L 0 0 0 22" fill="none" stroke="rgba(201,168,74,0.14)" strokeWidth="0.75" />
          </pattern>
          <linearGradient id={washId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(122,30,44,0.22)" />
            <stop offset="55%" stopColor="rgba(30,24,20,0.08)" />
            <stop offset="100%" stopColor="rgba(201,168,74,0.12)" />
          </linearGradient>
          <radialGradient id={vigId} cx="50%" cy="50%" r="68%">
            <stop offset="55%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
          </radialGradient>
        </defs>
        <rect width="400" height="200" fill={`url(#${gridId})`} />
        <rect width="400" height="200" fill={`url(#${washId})`} />
        <rect width="400" height="200" fill={`url(#${vigId})`} />
      </svg>
      <div className="pointer-events-none absolute left-1/2 top-[44%] z-10 flex -translate-x-1/2 flex-col items-center">
        <div
          className={`flex items-center justify-center rounded-full border-2 border-[#FFFCF7] ${compact ? "h-7 w-7" : "h-9 w-9"}`}
          style={{ backgroundColor: "#7A1E2C", boxShadow: "0 8px 22px rgba(30,24,16,0.45),0 0 0 4px rgba(201,168,74,0.35)" }}
        >
          <svg className={`text-white ${compact ? "h-3 w-3" : "h-4 w-4"}`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function QuickJobLocationCard({ location, sectionTitle, ctaLabel, onOpen, compact }: Props) {
  const locality = [location.city, location.state, location.country].filter((x) => (x ?? "").trim()).join(", ");
  const fullLine = [locality, location.zip].filter((x) => (x ?? "").trim()).join(" · ");
  const query = [location.addressLine1, fullLine].filter((x) => x.trim() && x !== "—" && x !== "Remoto").join(", ");
  const mapsHref = query.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : null;
  const showMap = !location.isRemote && Boolean(location.addressLine1?.trim() && location.addressLine1 !== "—");

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
      {showMap ? <QuickJobFauxMap compact={compact} /> : null}
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

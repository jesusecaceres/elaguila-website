"use client";

import type { ReactNode } from "react";

type Props = {
  lang: "es" | "en";
  sellerInitials: string;
  sellerName: string;
  sellerSubline?: string;
  sellerKindLabel?: string;
  showProBadge?: boolean;
  locationLine?: string;
  locationNote?: string;
  fulfillmentLabels?: string[];
  fulfillmentNotes?: string[];
  contactSection: ReactNode;
  safetyLine: string;
  /** Optional block below location (e.g. preview distance tools). */
  locationExtra?: ReactNode;
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
  showProBadge = false,
  locationLine,
  locationNote,
  fulfillmentLabels = [],
  fulfillmentNotes = [],
  contactSection,
  safetyLine,
  locationExtra,
}: Props) {
  const contactH = lang === "es" ? "Contacto" : "Contact";
  const locationH = lang === "es" ? "Ubicación" : "Location";
  const fulfillmentH = lang === "es" ? "Entrega" : "Fulfillment";

  return (
    <aside className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-5 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.14),inset_0_1px_0_rgba(255,255,255,0.85)]">
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] text-[13px] font-bold text-[#1E1810] shadow-[0_4px_14px_-4px_rgba(201,164,74,0.55)] ring-2 ring-white/90"
          aria-hidden
        >
          {sellerInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-bold tracking-tight text-[#1E1810]">{sellerName}</p>
            {sellerKindLabel ? (
              <span className="shrink-0 rounded-full border border-[#E8DFD0]/90 bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5C5346]">
                {sellerKindLabel}
              </span>
            ) : null}
            {showProBadge ? (
              <span className="shrink-0 rounded-full border border-[#C9B46A]/45 bg-[#FBF7EF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5C4E2E]">
                👑 Pro
              </span>
            ) : null}
          </div>
          {sellerSubline ? (
            <p className="mt-1 text-xs font-medium text-[#5C5346]/90">{sellerSubline}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 border-t border-[#E8DFD0]/80 pt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{contactH}</p>
        <div className="mt-3">{contactSection}</div>
      </div>

      {locationLine ? (
        <div className="mt-4 border-t border-[#E8DFD0]/80 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{locationH}</p>
          <p className="mt-2 flex items-start gap-2 text-sm font-semibold leading-snug text-[#1E1810]">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#8A8070]" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                fill="currentColor"
              />
            </svg>
            <span className="min-w-0 break-words">{locationLine}</span>
          </p>
          {locationNote ? (
            <p className="mt-1.5 text-[11px] leading-snug text-[#7A7164]/95">{locationNote}</p>
          ) : null}
          {locationExtra ? <div className="mt-3">{locationExtra}</div> : null}
        </div>
      ) : null}

      {fulfillmentLabels.length > 0 ? (
        <div className="mt-4 border-t border-[#E8DFD0]/80 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{fulfillmentH}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {fulfillmentLabels.map((label) => (
              <span
                key={label}
                className="inline-flex max-w-full rounded-full border border-[#C9B46A]/40 bg-[#FBF7EF] px-2.5 py-1 text-[11px] font-semibold leading-snug text-[#3D3428]"
              >
                {label}
              </span>
            ))}
          </div>
          {fulfillmentNotes.length > 0 ? (
            <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-[#5C5346]/95">
              {fulfillmentNotes.map((note, i) => (
                <li key={i} className="break-words [overflow-wrap:anywhere]">
                  {note}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <p className={cx("mt-4 border-t border-[#E8DFD0]/80 pt-4 text-center text-[11px] leading-relaxed text-[#7A7164]/95")}>
        {safetyLine}
      </p>
    </aside>
  );
}

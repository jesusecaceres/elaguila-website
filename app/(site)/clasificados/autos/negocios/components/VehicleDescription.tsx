"use client";

import type { AutoDealerListing } from "../types/autoDealerListing";
import { useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-4 shadow-[0_4px_24px_-6px_rgba(42,36,22,0.06)]";

export function VehicleDescription({ data }: { data: AutoDealerListing }) {
  const { lang, t } = useAutosNegociosPreviewCopy();
  const body = data.description?.trim();
  const extra = data.otherEquipmentDetails?.trim();
  if (!body && !extra) return null;

  const dealer = data.dealerName?.trim();
  const { title, byline } = t.preview.description;

  return (
    <section className={CARD}>
      <h2 className="text-base font-bold tracking-tight text-[color:var(--lx-text)]">{title}</h2>
      {dealer ? <p className="mt-1 text-sm text-[color:var(--lx-muted)]">{byline(dealer)}</p> : null}
      {body ? <p className="mt-4 max-w-[65ch] break-words text-[15px] leading-[1.7] text-[color:var(--lx-text-2)]">{body}</p> : null}
      {extra ? (
        <div className={body ? "mt-6 border-t border-[color:var(--lx-nav-border)]/70 pt-5" : "mt-4"}>
          <h3 className="text-sm font-bold tracking-tight text-[color:var(--lx-text)]">
            {lang === "es" ? "Otros equipos, mejoras o detalles" : "Other equipment, upgrades, or details"}
          </h3>
          <p className="mt-2 max-w-[65ch] break-words text-[15px] leading-[1.7] text-[color:var(--lx-text-2)]">{extra}</p>
        </div>
      ) : null}
    </section>
  );
}

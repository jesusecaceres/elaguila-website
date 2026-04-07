"use client";

import type { AutoDealerListing } from "../types/autoDealerListing";
import { useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-4 shadow-[0_4px_24px_-6px_rgba(42,36,22,0.06)]";

export function VehicleDescription({ data }: { data: AutoDealerListing }) {
  const { t } = useAutosNegociosPreviewCopy();
  const body = data.description?.trim();
  if (!body) return null;

  const dealer = data.dealerName?.trim();
  const { title, byline } = t.preview.description;

  return (
    <section className={CARD}>
      <h2 className="text-base font-bold tracking-tight text-[color:var(--lx-text)]">{title}</h2>
      {dealer ? <p className="mt-1 text-sm text-[color:var(--lx-muted)]">{byline(dealer)}</p> : null}
      <p className="mt-4 max-w-[65ch] break-words text-[15px] leading-[1.7] text-[color:var(--lx-text-2)]">{body}</p>
    </section>
  );
}

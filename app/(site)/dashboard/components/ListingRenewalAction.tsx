"use client";

import type { ListingLifecycleResolved } from "@/app/lib/listingLifecycle/listingLifecycleTypes";
import { listingRenewalCtaLabel, type ListingLifecycleLang } from "@/app/lib/listingLifecycle/listingLifecycleLabels";

export function ListingRenewalAction({
  lifecycle,
  lang,
  busy,
  onRenew,
}: {
  lifecycle: ListingLifecycleResolved;
  lang: ListingLifecycleLang;
  busy?: boolean;
  onRenew?: () => void;
}) {
  if (!lifecycle.isRenewalEligible || !onRenew) return null;
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onRenew}
      className="min-h-[44px] rounded-xl bg-[#1E1810] px-4 py-2 text-sm font-bold text-[#F9F6F1] shadow-sm disabled:opacity-50"
    >
      {busy ? (lang === "es" ? "Iniciando pago..." : "Starting checkout...") : listingRenewalCtaLabel(lifecycle, lang)}
    </button>
  );
}

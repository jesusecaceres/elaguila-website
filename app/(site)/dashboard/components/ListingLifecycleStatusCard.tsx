"use client";

import type { ListingLifecycleResolved } from "@/app/lib/listingLifecycle/listingLifecycleTypes";
import {
  listingLifecycleExpirationLine,
  listingLifecyclePrimaryLine,
  listingLifecycleStateLabel,
  type ListingLifecycleLang,
} from "@/app/lib/listingLifecycle/listingLifecycleLabels";

export function ListingLifecycleStatusCard({
  lifecycle,
  lang,
  compact = false,
}: {
  lifecycle: ListingLifecycleResolved;
  lang: ListingLifecycleLang;
  compact?: boolean;
}) {
  const danger = lifecycle.lifecycleState === "expired" || lifecycle.lifecycleState === "suspended";
  const warn = lifecycle.lifecycleState === "expiring_soon" || lifecycle.lifecycleState === "pending_payment";
  const tone = danger
    ? "border-red-200 bg-red-50 text-red-950"
    : warn
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-emerald-200 bg-emerald-50 text-emerald-950";
  const expiration = listingLifecycleExpirationLine(lifecycle, lang);
  return (
    <div className={`rounded-2xl border px-3 py-2 text-xs ${tone} ${compact ? "w-full" : "mt-3"}`}>
      <p className="font-bold">{listingLifecycleStateLabel(lifecycle.lifecycleState, lang)}</p>
      <p className="mt-0.5 font-medium">{listingLifecyclePrimaryLine(lifecycle, lang)}</p>
      {expiration ? <p className="mt-0.5 text-[11px] opacity-85">{expiration}</p> : null}
    </div>
  );
}

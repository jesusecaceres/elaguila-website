"use client";

import type { AutosPublicBlueprintCopy } from "../../lib/autosPublicBlueprintCopy";

/** Launch-safe messaging: demo sample vs no live rows yet. */
export function AutosPublicInventoryNotice({
  copy,
  loaded,
  isDemoInventory,
  hasAnyListings,
}: {
  copy: AutosPublicBlueprintCopy;
  loaded: boolean;
  isDemoInventory: boolean;
  hasAnyListings: boolean;
}) {
  if (!loaded) return null;

  if (isDemoInventory) {
    return (
      <div
        className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm"
        role="status"
      >
        {copy.demoInventoryBanner}
      </div>
    );
  }

  if (!hasAnyListings) {
    return (
      <div className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-4 text-sm text-[color:var(--lx-text-2)] shadow-sm" role="status">
        <p className="font-semibold text-[color:var(--lx-text)]">{copy.publicNoLiveListingsTitle}</p>
        <p className="mt-1 text-[color:var(--lx-muted)]">{copy.publicNoLiveListingsBody}</p>
      </div>
    );
  }

  return null;
}

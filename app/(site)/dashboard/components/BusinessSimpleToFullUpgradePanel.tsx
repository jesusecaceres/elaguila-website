"use client";

import { useState } from "react";
import { businessUpgradeOfferedForHeldPackageKey } from "@/app/lib/listingPlans/businessAccessLevel";
import { getRevenuePackageDefinition } from "@/app/lib/listingPlans/revenuePricingMatrix";
import {
  businessUpgradeBusyLabel,
  businessUpgradeCtaLabel,
  businessUpgradeHint,
  redirectBusinessSimpleToFullUpgradeCheckout,
} from "../lib/businessSimpleToFullUpgradeCheckout";

/**
 * The SIMPLE -> FULL offer, for owner surfaces that render their own markup rather than the
 * shared `ActionItem` lists (the Servicios/Restaurantes/Autos dashboards use those instead).
 *
 * Renders NOTHING unless the base package key the SERVER resolved for this listing is the
 * category's Simple package. There is no prop by which a caller can force the offer on: the
 * eligibility rule lives in `businessUpgradeOfferedForHeldPackageKey`, and the price shown is
 * read from the same server pricing matrix the checkout charges from.
 */
export function BusinessSimpleToFullUpgradePanel({
  category,
  listingId,
  leonixAdId = null,
  heldPackageKey,
  lang,
  returnPath = null,
}: {
  category: string;
  listingId: string;
  leonixAdId?: string | null;
  /** The base package this listing currently holds, as resolved server-side. Never inferred. */
  heldPackageKey: string | null | undefined;
  lang: "es" | "en";
  returnPath?: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upgradeToFullPackageKey = businessUpgradeOfferedForHeldPackageKey(category, heldPackageKey);
  if (!upgradeToFullPackageKey || !listingId.trim()) return null;

  const priceCents = getRevenuePackageDefinition(upgradeToFullPackageKey)?.priceCents ?? null;
  const priceLine =
    priceCents != null
      ? `$${(priceCents / 100).toFixed(0)}${lang === "es" ? "/mes" : "/mo"}`
      : null;

  async function start() {
    setError(null);
    setBusy(true);
    const result = await redirectBusinessSimpleToFullUpgradeCheckout({
      category,
      listingId,
      leonixAdId,
      lang,
      returnPath,
    });
    if (!result.ok) {
      setError(result.userMessage);
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-[#C9B46A]/50 bg-[#FFF6E7] p-3 sm:p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">
        {businessUpgradeCtaLabel(lang)}
      </p>
      <p className="mt-1 text-xs text-[#5C5346]">{businessUpgradeHint(lang)}</p>
      {error ? <p className="mt-2 text-xs text-red-800">{error}</p> : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void start()}
        className="mt-3 inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#C9B46A]/60 bg-white px-4 py-2 text-sm font-semibold text-[#6E5418] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy
          ? businessUpgradeBusyLabel(lang)
          : priceLine
            ? `${businessUpgradeCtaLabel(lang)} · ${priceLine}`
            : businessUpgradeCtaLabel(lang)}
      </button>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  autosDealerInventoryAddTenSlotsCta,
  autosDealerInventoryAddVehicleCta,
  autosDealerInventoryValueBoost,
  autosDealerInventoryValueBullets,
  autosDealerInventoryValueDetail,
  autosDealerInventoryValueLead,
  autosDealerInventoryValueTitle,
} from "@/app/lib/clasificados/autos/autosDealerInventoryValueCopy";
import {
  autosDealerInventoryUpgradeContactHref,
  autosDealerInventoryUpgradeCtaLabel,
} from "@/app/lib/clasificados/autos/autosDealerInventoryCopy";
import type { AutosDealerInventoryCount } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import { summarizeDealerInventory, STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import { AutosNegociosInventoryValueDrawerTrigger } from "@/app/clasificados/autos/dashboard/AutosNegociosInventoryValueDrawerTrigger";

export function AutosNegociosInventoryValueModule({
  lang,
  parentListingId,
  dealerInventoryGroupId,
  atLimit = false,
  showAddCta = true,
  dealerInventoryCounts = null,
}: {
  lang: AutosNegociosLang;
  parentListingId?: string | null;
  dealerInventoryGroupId?: string | null;
  atLimit?: boolean;
  showAddCta?: boolean;
  dealerInventoryCounts?: AutosDealerInventoryCount | null;
}) {
  const bullets = autosDealerInventoryValueBullets(lang);
  const [fetchedCounts, setFetchedCounts] = useState<AutosDealerInventoryCount | null>(dealerInventoryCounts);

  const loadCounts = useCallback(async () => {
    if (dealerInventoryCounts) {
      setFetchedCounts(dealerInventoryCounts);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setFetchedCounts(summarizeDealerInventory(0, STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT));
      return;
    }
    const r = await fetch("/api/clasificados/autos/listings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = (await r.json()) as { ok?: boolean; dealerInventory?: AutosDealerInventoryCount };
    if (r.ok && j.ok && j.dealerInventory) {
      setFetchedCounts(j.dealerInventory);
    } else {
      setFetchedCounts(summarizeDealerInventory(0, STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT));
    }
  }, [dealerInventoryCounts]);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  const counts = fetchedCounts ?? summarizeDealerInventory(0, STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT);
  const limitReached = atLimit || !counts.canAddActiveVehicle;

  const addCtx = useMemo(() => {
    if (!parentListingId?.trim()) return null;
    return {
      parentListingId: parentListingId.trim(),
      returnToListingId: parentListingId.trim(),
      dealerInventoryGroupId: dealerInventoryGroupId ?? null,
    };
  }, [parentListingId, dealerInventoryGroupId]);

  return (
    <section className="mt-6 rounded-2xl border border-[color:var(--lx-gold-border)]/50 bg-gradient-to-br from-[color:var(--lx-section)] to-[#FFFCF7] p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.12)]">
      <h3 className="text-base font-extrabold tracking-tight text-[color:var(--lx-text)]">
        {autosDealerInventoryValueTitle(lang)}
      </h3>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-[color:var(--lx-text)]">
        {autosDealerInventoryValueLead(lang)}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{autosDealerInventoryValueDetail(lang)}</p>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{autosDealerInventoryValueBoost(lang)}</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {bullets.map((line) => (
          <li key={line} className="flex gap-2 text-xs font-medium text-[color:var(--lx-text-2)]">
            <span className="mt-0.5 text-[color:var(--lx-gold)]" aria-hidden>
              ✓
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {addCtx && showAddCta ? (
          <AutosNegociosInventoryValueDrawerTrigger
            lang={lang}
            addCtx={addCtx}
            counts={counts}
            label={autosDealerInventoryAddVehicleCta(lang)}
          />
        ) : null}
        {limitReached ? (
          <>
            <a
              href={autosDealerInventoryUpgradeContactHref(lang)}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-5 text-sm font-bold text-[color:var(--lx-text)]"
            >
              {autosDealerInventoryUpgradeCtaLabel(lang)}
            </a>
            <a
              href={autosDealerInventoryUpgradeContactHref(lang)}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-5 text-sm font-bold text-[color:var(--lx-text)]"
            >
              {autosDealerInventoryAddTenSlotsCta(lang)}
            </a>
          </>
        ) : null}
      </div>
    </section>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  autosDealerInventoryAddTenSlotsCta,
  autosDealerInventoryAddVehicleCta,
  autosDealerInventoryValueAfterPublishLine,
  autosDealerInventoryValueBoost,
  autosDealerInventoryValueBullets,
  autosDealerInventoryValueDetail,
  autosDealerInventoryValueLead,
  autosDealerInventoryValueMainVehicleLine,
  autosDealerInventoryValueTitle,
} from "@/app/lib/clasificados/autos/autosDealerInventoryValueCopy";
import type { AutosDealerInventoryCount } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import { summarizeDealerInventory, STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import { AutosNegociosInventoryValueDrawerTrigger } from "@/app/clasificados/autos/dashboard/AutosNegociosInventoryValueDrawerTrigger";
import { AutosNegociosInventoryBoostTrigger } from "./AutosNegociosInventoryBoostTrigger";
import { AutosNegociosPrePublishInventoryTrigger } from "./AutosNegociosPrePublishInventoryTrigger";
import type { AutosInventoryBoostEditorContext } from "./AutosNegociosInventoryBoostPanel";

const INVENTORY_BOOST_APPROACHING_SLOTS = 2;

export function AutosNegociosInventoryValueModule({
  lang,
  parentListingId,
  dealerInventoryGroupId,
  atLimit = false,
  showAddCta = true,
  prePublishMode = false,
  dealerInventoryCounts = null,
  flushDraft,
  boostEditorContext,
}: {
  lang: AutosNegociosLang;
  parentListingId?: string | null;
  dealerInventoryGroupId?: string | null;
  atLimit?: boolean;
  showAddCta?: boolean;
  /** Paso 7 before main listing exists — show inventory card + safe pre-publish drawer. */
  prePublishMode?: boolean;
  dealerInventoryCounts?: AutosDealerInventoryCount | null;
  flushDraft?: () => Promise<void>;
  boostEditorContext?: AutosInventoryBoostEditorContext;
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
  const showBoostCta =
    prePublishMode || limitReached || counts.remainingSlots <= INVENTORY_BOOST_APPROACHING_SLOTS;

  const addCtx = useMemo(() => {
    if (!parentListingId?.trim()) return null;
    return {
      parentListingId: parentListingId.trim(),
      returnToListingId: parentListingId.trim(),
      dealerInventoryGroupId: dealerInventoryGroupId ?? null,
    };
  }, [parentListingId, dealerInventoryGroupId]);

  const boostContext: AutosInventoryBoostEditorContext = boostEditorContext ?? {
    editorPath: typeof window !== "undefined" ? window.location.pathname : "",
    editorSearch: typeof window !== "undefined" ? window.location.search : "",
  };

  return (
    <section className="mt-6 rounded-2xl border border-[color:var(--lx-gold-border)]/50 bg-gradient-to-br from-[color:var(--lx-section)] to-[#FFFCF7] p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.12)]">
      <h3 className="text-base font-extrabold tracking-tight text-[color:var(--lx-text)]">
        {autosDealerInventoryValueTitle(lang)}
      </h3>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-[color:var(--lx-text)]">
        {autosDealerInventoryValueLead(lang)}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
        {autosDealerInventoryValueMainVehicleLine(lang)}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{autosDealerInventoryValueDetail(lang)}</p>
      <p className="mt-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
        {autosDealerInventoryValueAfterPublishLine(lang)}
      </p>
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
        {showAddCta ? (
          addCtx && counts.canAddActiveVehicle ? (
            <AutosNegociosInventoryValueDrawerTrigger
              lang={lang}
              addCtx={addCtx}
              counts={counts}
              label={autosDealerInventoryAddVehicleCta(lang)}
              flushDraft={flushDraft}
              boostEditorContext={boostContext}
            />
          ) : prePublishMode ? (
            <AutosNegociosPrePublishInventoryTrigger
              lang={lang}
              label={autosDealerInventoryAddVehicleCta(lang)}
            />
          ) : null
        ) : null}
        {showBoostCta ? (
          <AutosNegociosInventoryBoostTrigger
            lang={lang}
            label={autosDealerInventoryAddTenSlotsCta(lang)}
            flushDraft={flushDraft}
            editorContext={boostContext}
            variant={limitReached ? "primary" : "secondary"}
          />
        ) : null}
      </div>
    </section>
  );
}

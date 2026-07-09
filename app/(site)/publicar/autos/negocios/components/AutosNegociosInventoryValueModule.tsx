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
import { AutosNegociosAddInventoryTrigger } from "./AutosNegociosAddInventoryTrigger";
import { AutosNegociosInventoryBoostPanel } from "./AutosNegociosInventoryBoostPanel";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
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
  additionalInventoryCount = 0,
  additionalVehicles = [],
  parentListing,
  copy,
  onSaveAdditionalVehicle,
  onAtLimitOpenBoost,
  inventoryDrawerProps,
  postPublishDashboardMode = false,
  inventoryPackActive = false,
  inventoryEntitlementPending = false,
  leonixAdId = null,
  onStartInventoryCheckout,
}: {
  lang: AutosNegociosLang;
  parentListingId?: string | null;
  dealerInventoryGroupId?: string | null;
  atLimit?: boolean;
  showAddCta?: boolean;
  /** Paso 7 before main listing exists — show inventory card + safe pre-publish drawer. */
  prePublishMode?: boolean;
  /** Dashboard edit of published dealer parent — entitlement gates child inventory. */
  postPublishDashboardMode?: boolean;
  inventoryPackActive?: boolean;
  inventoryEntitlementPending?: boolean;
  leonixAdId?: string | null;
  onStartInventoryCheckout?: () => void;
  dealerInventoryCounts?: AutosDealerInventoryCount | null;
  flushDraft?: () => Promise<void>;
  boostEditorContext?: AutosInventoryBoostEditorContext;
  additionalInventoryCount?: number;
  additionalVehicles?: AutosAdditionalInventoryVehicleDraft[];
  parentListing?: AutoDealerListing;
  copy?: AutosNegociosCopy;
  onSaveAdditionalVehicle?: (vehicle: AutosAdditionalInventoryVehicleDraft) => boolean;
  onAtLimitOpenBoost?: () => void;
  inventoryDrawerProps?: {
    drawerOpen: boolean;
    drawerEditingId: string | null;
    onDrawerOpenChange: (open: boolean, editingId?: string | null) => void;
    inProgressDraft: AutosAdditionalInventoryVehicleDraft | null;
    onInProgressChange: (draft: AutosAdditionalInventoryVehicleDraft | null) => void;
    onEditParentDealerStep?: () => void;
  };
}) {
  const [boostOpen, setBoostOpen] = useState(false);
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
    !postPublishDashboardMode &&
    (prePublishMode || limitReached || counts.remainingSlots <= INVENTORY_BOOST_APPROACHING_SLOTS);
  const canManageChildInventory =
    !postPublishDashboardMode || inventoryPackActive || prePublishMode;
  const showInactiveAddonCard =
    postPublishDashboardMode && !inventoryPackActive && !prePublishMode;

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
        {showInactiveAddonCard ? (
          <div className="w-full rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            <p>
              {inventoryEntitlementPending
                ? lang === "es"
                  ? "Estamos confirmando tu pago del inventario. Actualiza en unos segundos si acabas de pagar."
                  : "We are confirming your inventory payment. Refresh in a few seconds if you just paid."
                : lang === "es"
                  ? "Activa el paquete de inventario para agregar vehículos adicionales al inventario del dealer."
                  : "Activate the inventory pack to add additional vehicles to your dealer inventory."}
            </p>
            {!inventoryEntitlementPending && onStartInventoryCheckout ? (
              <button
                type="button"
                className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#2A2620] px-4 text-sm font-bold text-[#FAF7F2]"
                onClick={onStartInventoryCheckout}
              >
                {autosDealerInventoryAddTenSlotsCta(lang)}
              </button>
            ) : null}
          </div>
        ) : null}
        {showAddCta && canManageChildInventory ? (
          addCtx && counts.canAddActiveVehicle ? (
            <AutosNegociosInventoryValueDrawerTrigger
              lang={lang}
              addCtx={addCtx}
              counts={counts}
              label={autosDealerInventoryAddVehicleCta(lang)}
              flushDraft={flushDraft}
              boostEditorContext={boostContext}
            />
          ) : prePublishMode && onSaveAdditionalVehicle && copy && parentListing ? (
            <AutosNegociosAddInventoryTrigger
              lang={lang}
              copy={copy}
              label={autosDealerInventoryAddVehicleCta(lang)}
              additionalCount={additionalInventoryCount}
              additionalVehicles={additionalVehicles}
              parentListing={parentListing}
              onSave={onSaveAdditionalVehicle}
              flushDraft={flushDraft}
              onAtLimit={() => {
                setBoostOpen(true);
                onAtLimitOpenBoost?.();
              }}
              {...inventoryDrawerProps}
            />
          ) : null
        ) : null}
        {showBoostCta ? (
          <>
            <button
              type="button"
              className={
                limitReached
                  ? "inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#2A2620] px-5 text-sm font-bold text-[#FAF7F2] shadow-md transition hover:bg-[#1E1810]"
                  : "inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-5 text-sm font-bold text-[color:var(--lx-text)]"
              }
              onClick={() => setBoostOpen(true)}
            >
              {autosDealerInventoryAddTenSlotsCta(lang)}
            </button>
            <AutosNegociosInventoryBoostPanel
              open={boostOpen}
              onClose={() => setBoostOpen(false)}
              lang={lang}
              flushDraft={flushDraft}
              editorContext={boostContext}
              parentListingId={parentListingId}
              leonixAdId={leonixAdId}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}

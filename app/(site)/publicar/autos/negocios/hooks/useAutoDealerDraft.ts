"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AutoDealerListing, DealerHoursEntry } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import {
  clearAutosNegociosDraft,
  loadAutosNegociosDraftResolved,
  saveAutosNegociosDraftResolved,
  type AutosNegociosDraftV1,
} from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftStorage";
import {
  autosNegociosDraftNamespaceFromUserId,
  LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY,
  migrateLegacyAutosNegociosDraftJsonToNamespace,
  resolveAutosNegociosDraftNamespace,
} from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftNamespace";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { buildVehicleTitle } from "../lib/autoDealerTitle";
import { createEmptyListing, normalizeLoadedListing } from "@/app/clasificados/autos/negocios/lib/autoDealerDraftDefaults";
import { safeNormalizeAutosDraftListing } from "@/app/clasificados/autos/shared/lib/safeNormalizeAutosDraftListing";
import {
  AUTOS_NEGOCIOS_EDITOR_SESSION_KEY,
  shouldResetAutosDraftForFreshEditorTab,
} from "@/app/clasificados/autos/shared/lib/autosEditorTabSession";
import {
  clearAutosDraftNamespaceHint,
  rememberAutosDraftNamespaceHint,
} from "@/app/clasificados/autos/shared/lib/autosDraftPreviewNamespaceHint";

function applyAutoTitle(listing: AutoDealerListing, override: boolean): AutoDealerListing {
  if (override) return listing;
  const t = buildVehicleTitle(listing.year, listing.make, listing.model, listing.trim);
  return { ...listing, vehicleTitle: t || undefined };
}

export function useAutoDealerDraft() {
  const [hydrated, setHydrated] = useState(false);
  const [vehicleTitleOverride, setVehicleTitleOverride] = useState(false);
  const [listing, setListing] = useState<AutoDealerListing>(() => createEmptyListing());
  const overrideRef = useRef(vehicleTitleOverride);
  overrideRef.current = vehicleTitleOverride;

  const namespaceRef = useRef<string | null>(null);
  const listingRef = useRef(listing);
  useLayoutEffect(() => {
    listingRef.current = listing;
  }, [listing]);

  const hydrateFromNamespace = useCallback(async (namespace: string) => {
    migrateLegacyAutosNegociosDraftJsonToNamespace(namespace);
    const d = await loadAutosNegociosDraftResolved(namespace);
    if (d) {
      setVehicleTitleOverride(d.vehicleTitleOverride);
      setListing(safeNormalizeAutosDraftListing(d.listing, "negocios"));
    } else {
      setVehicleTitleOverride(false);
      setListing(createEmptyListing());
    }
  }, []);

  const persist = useCallback(async (next: AutoDealerListing, override: boolean) => {
    const ns = namespaceRef.current;
    if (!ns) return;
    const normalized = normalizeLoadedListing(next);
    const payload: AutosNegociosDraftV1 = { v: 1, vehicleTitleOverride: override, listing: normalized };
    await saveAutosNegociosDraftResolved(ns, payload);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    const bootstrap = async () => {
      const ns = await resolveAutosNegociosDraftNamespace();
      if (cancelled) return;
      namespaceRef.current = ns;

      if (shouldResetAutosDraftForFreshEditorTab(AUTOS_NEGOCIOS_EDITOR_SESSION_KEY)) {
        try {
          window.localStorage.removeItem(LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY);
        } catch {
          /* ignore */
        }
        clearAutosDraftNamespaceHint("negocios");
        await clearAutosNegociosDraft(ns);
      }

      migrateLegacyAutosNegociosDraftJsonToNamespace(ns);
      await hydrateFromNamespace(ns);
      if (!cancelled) setHydrated(true);
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION") return;
      const nextNs = session?.user?.id
        ? autosNegociosDraftNamespaceFromUserId(session.user.id)
        : autosNegociosDraftNamespaceFromUserId(null);
      if (namespaceRef.current === nextNs) return;
      namespaceRef.current = nextNs;
      migrateLegacyAutosNegociosDraftJsonToNamespace(nextNs);
      await hydrateFromNamespace(nextNs);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [hydrateFromNamespace]);

  const setListingPatch = useCallback(
    (patch: Partial<AutoDealerListing>) => {
      setListing((prev) => {
        const merged: AutoDealerListing = { ...prev, ...patch };
        if (patch.dealerSocials !== undefined) {
          merged.dealerSocials = { ...prev.dealerSocials, ...patch.dealerSocials };
        }
        const next = applyAutoTitle(merged, overrideRef.current);
        void persist(next, overrideRef.current);
        return normalizeLoadedListing(next);
      });
    },
    [persist],
  );

  const replaceListing = useCallback(
    (next: AutoDealerListing) => {
      const withTitle = applyAutoTitle(next, overrideRef.current);
      const normalized = normalizeLoadedListing(withTitle);
      setListing(normalized);
      void persist(normalized, overrideRef.current);
    },
    [persist],
  );

  const setVehicleTitleOverrideState = useCallback(
    (v: boolean) => {
      setVehicleTitleOverride(v);
      setListing((prev) => {
        const next = applyAutoTitle(prev, v);
        void persist(next, v);
        return normalizeLoadedListing(next);
      });
    },
    [persist],
  );

  const updateDealerHourRow = useCallback(
    (rowId: string, patch: Partial<DealerHoursEntry>) => {
      setListing((prev) => {
        const rows = [...(prev.dealerHours ?? [])];
        const i = rows.findIndex((r) => r.rowId === rowId);
        if (i < 0) return prev;
        rows[i] = { ...rows[i]!, ...patch };
        const next = applyAutoTitle({ ...prev, dealerHours: rows }, overrideRef.current);
        void persist(next, overrideRef.current);
        return normalizeLoadedListing(next);
      });
    },
    [persist],
  );

  const removeDealerHourRow = useCallback(
    (rowId: string) => {
      setListing((prev) => {
        const before = prev.dealerHours ?? [];
        const rows = before.filter((r) => r.rowId !== rowId);
        if (rows.length === before.length) return prev;
        const next = applyAutoTitle({ ...prev, dealerHours: rows }, overrideRef.current);
        void persist(next, overrideRef.current);
        return normalizeLoadedListing(next);
      });
    },
    [persist],
  );

  const resetDraft = useCallback(async () => {
    const ns = namespaceRef.current;
    const empty = createEmptyListing();
    overrideRef.current = false;
    setVehicleTitleOverride(false);
    setListing(empty);
    clearAutosDraftNamespaceHint("negocios");
    try {
      window.sessionStorage.removeItem(AUTOS_NEGOCIOS_EDITOR_SESSION_KEY);
    } catch {
      /* ignore */
    }
    if (ns) {
      await clearAutosNegociosDraft(ns);
    }
  }, []);

  /** Flush latest listing to localStorage + IndexedDB before navigating away (matches Privado). */
  const flushDraft = useCallback(async () => {
    const ns = namespaceRef.current;
    if (!ns) return;
    rememberAutosDraftNamespaceHint("negocios", ns);
    const merged = normalizeLoadedListing(listingRef.current);
    const withTitle = applyAutoTitle(merged, overrideRef.current);
    const normalized = normalizeLoadedListing(withTitle);
    await saveAutosNegociosDraftResolved(ns, {
      v: 1,
      vehicleTitleOverride: overrideRef.current,
      listing: normalized,
    });
  }, []);

  return {
    hydrated,
    vehicleTitleOverride,
    setVehicleTitleOverrideState,
    listing,
    setListingPatch,
    replaceListing,
    resetDraft,
    flushDraft,
    updateDealerHourRow,
    removeDealerHourRow,
  };
}

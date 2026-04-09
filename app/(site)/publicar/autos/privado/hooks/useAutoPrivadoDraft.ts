"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import {
  clearAutosPrivadoDraft,
  loadAutosPrivadoDraftResolved,
  saveAutosPrivadoDraftResolved,
  type AutosPrivadoDraftV1,
} from "@/app/clasificados/autos/privado/lib/autosPrivadoDraftStorage";
import {
  autosPrivadoDraftNamespaceFromUserId,
  resolveAutosPrivadoDraftNamespace,
} from "@/app/clasificados/autos/privado/lib/autosPrivadoDraftNamespace";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { buildVehicleTitle } from "@/app/publicar/autos/negocios/lib/autoDealerTitle";
import { createEmptyListing, normalizeLoadedListing } from "@/app/clasificados/autos/negocios/lib/autoDealerDraftDefaults";
import { safeNormalizeAutosDraftListing } from "@/app/clasificados/autos/shared/lib/safeNormalizeAutosDraftListing";
import {
  AUTOS_PRIVADO_EDITOR_SESSION_KEY,
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

export function useAutoPrivadoDraft() {
  const [hydrated, setHydrated] = useState(false);
  const [vehicleTitleOverride, setVehicleTitleOverride] = useState(false);
  const [listing, setListing] = useState<AutoDealerListing>(() => ({
    ...createEmptyListing(),
    autosLane: "privado",
  }));
  const overrideRef = useRef(vehicleTitleOverride);
  overrideRef.current = vehicleTitleOverride;

  const namespaceRef = useRef<string | null>(null);
  const listingRef = useRef(listing);
  useLayoutEffect(() => {
    listingRef.current = listing;
  }, [listing]);

  const hydrateFromNamespace = useCallback(async (namespace: string) => {
    const d = await loadAutosPrivadoDraftResolved(namespace);
    if (d) {
      setVehicleTitleOverride(d.vehicleTitleOverride);
      setListing(safeNormalizeAutosDraftListing({ ...d.listing, autosLane: "privado" }, "privado"));
    } else {
      setVehicleTitleOverride(false);
      setListing({ ...createEmptyListing(), autosLane: "privado" });
    }
  }, []);

  const persist = useCallback(async (next: AutoDealerListing, override: boolean) => {
    const ns = namespaceRef.current;
    if (!ns) return;
    const normalized = normalizeLoadedListing({ ...next, autosLane: "privado" });
    const payload: AutosPrivadoDraftV1 = { v: 1, vehicleTitleOverride: override, listing: normalized };
    await saveAutosPrivadoDraftResolved(ns, payload);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    const bootstrap = async () => {
      const ns = await resolveAutosPrivadoDraftNamespace();
      if (cancelled) return;
      namespaceRef.current = ns;
      if (shouldResetAutosDraftForFreshEditorTab(AUTOS_PRIVADO_EDITOR_SESSION_KEY)) {
        clearAutosDraftNamespaceHint("privado");
        await clearAutosPrivadoDraft(ns);
      }
      await hydrateFromNamespace(ns);
      if (!cancelled) setHydrated(true);
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION") return;
      const nextNs = session?.user?.id
        ? autosPrivadoDraftNamespaceFromUserId(session.user.id)
        : autosPrivadoDraftNamespaceFromUserId(null);
      if (namespaceRef.current === nextNs) return;
      namespaceRef.current = nextNs;
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
        const merged: AutoDealerListing = { ...prev, ...patch, autosLane: "privado" };
        if (patch.dealerSocials !== undefined) {
          merged.dealerSocials = { ...prev.dealerSocials, ...patch.dealerSocials };
        }
        const withTitle = applyAutoTitle(merged, overrideRef.current);
        void persist(withTitle, overrideRef.current);
        return normalizeLoadedListing(withTitle);
      });
    },
    [persist],
  );

  const setVehicleTitleOverrideState = useCallback(
    (v: boolean) => {
      overrideRef.current = v;
      setVehicleTitleOverride(v);
      setListing((prev) => {
        const next = normalizeLoadedListing(applyAutoTitle({ ...prev, autosLane: "privado" }, v));
        void persist(next, v);
        return next;
      });
    },
    [persist],
  );

  const resetDraft = useCallback(async () => {
    const ns = namespaceRef.current;
    if (ns) await clearAutosPrivadoDraft(ns);
    setVehicleTitleOverride(false);
    overrideRef.current = false;
    const empty = { ...createEmptyListing(), autosLane: "privado" as const };
    listingRef.current = empty;
    setListing(empty);
  }, []);

  /** Await before navigating to preview so IDB + localStorage reflect the latest media. */
  const flushDraft = useCallback(async () => {
    const ns = namespaceRef.current;
    if (!ns) return;
    rememberAutosDraftNamespaceHint("privado", ns);
    const merged = normalizeLoadedListing({ ...listingRef.current, autosLane: "privado" });
    const withTitle = applyAutoTitle(merged, overrideRef.current);
    const normalized = normalizeLoadedListing(withTitle);
    await saveAutosPrivadoDraftResolved(ns, {
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
    resetDraft,
    flushDraft,
  };
}

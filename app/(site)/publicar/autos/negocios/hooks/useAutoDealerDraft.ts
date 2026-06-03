"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { AutoDealerListing, DealerHoursEntry } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import {
  clearAutosNegociosDraft,
  loadAutosNegociosDraftResolved,
  saveAutosNegociosDraftResolved,
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
import { clearAutosDraftNamespaceHint, rememberAutosDraftNamespaceHint } from "@/app/clasificados/autos/shared/lib/autosDraftPreviewNamespaceHint";
import {
  AUTOS_NEGOCIOS_EDITOR_SESSION_KEY,
  shouldResetAutosDraftForFreshEditorTab,
} from "@/app/clasificados/autos/shared/lib/autosEditorTabSession";
import { useAutosDraftPersistEffects } from "@/app/lib/clasificados/autos/useAutosDraftPersistEffects";
import {
  prefillDealerListingForInventoryAdd,
  resolveAutosInventoryAddContextForEditor,
  writeInventoryAddContextToSession,
} from "@/app/lib/clasificados/autos/autosDealerInventoryAddFlow";
import {
  clampAutosEditorMaxReached,
  clampAutosEditorStep,
  AUTOS_PUBLISH_FINAL_STEP_INDEX,
} from "@/app/lib/clasificados/autos/autosEditorDraftStep";
import type { AutosNegociosDraftV1 } from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftStorage";

function applyAutoTitle(listing: AutoDealerListing, override: boolean): AutoDealerListing {
  if (override) return listing;
  const t = buildVehicleTitle(listing.year, listing.make, listing.model, listing.trim);
  return { ...listing, vehicleTitle: t || undefined };
}

function isAutosConfirmRoute(pathname: string | null): boolean {
  return Boolean(pathname && pathname.startsWith("/publicar/autos") && pathname.includes("/confirm"));
}

function resumeQueryFlag(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("resume") === "1";
}

function inventoryAddFromLocation(): ReturnType<typeof resolveAutosInventoryAddContextForEditor> {
  if (typeof window === "undefined") return { inventoryModeAdd: false, context: null };
  return resolveAutosInventoryAddContextForEditor(new URLSearchParams(window.location.search));
}

export function useAutoDealerDraft() {
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [vehicleTitleOverride, setVehicleTitleOverride] = useState(false);
  const [listing, setListing] = useState<AutoDealerListing>(() => createEmptyListing());
  const overrideRef = useRef(vehicleTitleOverride);
  overrideRef.current = vehicleTitleOverride;

  const namespaceRef = useRef<string | null>(null);
  const listingRef = useRef(listing);
  const editorStepRef = useRef(0);
  const editorMaxReachedRef = useRef(0);
  const [editorStep, setEditorStep] = useState(0);
  const [editorMaxReached, setEditorMaxReached] = useState(0);

  useLayoutEffect(() => {
    listingRef.current = listing;
  }, [listing]);

  const applyEditorProgress = useCallback((step: number, maxReached: number) => {
    const s = clampAutosEditorStep(step);
    const m = clampAutosEditorMaxReached(maxReached, s);
    editorStepRef.current = s;
    editorMaxReachedRef.current = m;
    setEditorStep(s);
    setEditorMaxReached(m);
  }, []);

  const applyDraftPayload = useCallback(
    (d: AutosNegociosDraftV1) => {
      setVehicleTitleOverride(d.vehicleTitleOverride);
      setListing(safeNormalizeAutosDraftListing(d.listing, "negocios"));
      applyEditorProgress(d.editorStep ?? 0, d.editorMaxReached ?? d.editorStep ?? 0);
    },
    [applyEditorProgress],
  );

  const hydrateFromNamespace = useCallback(async (namespace: string) => {
    migrateLegacyAutosNegociosDraftJsonToNamespace(namespace);
    const d = await loadAutosNegociosDraftResolved(namespace);
    if (d) {
      applyDraftPayload(d);
    } else {
      setVehicleTitleOverride(false);
      setListing(createEmptyListing());
      applyEditorProgress(0, 0);
    }
  }, [applyDraftPayload, applyEditorProgress]);

  const emptyListing = useCallback(() => {
    setVehicleTitleOverride(false);
    setListing(createEmptyListing());
    applyEditorProgress(0, 0);
  }, [applyEditorProgress]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    const bootstrap = async () => {
      const ns = await resolveAutosNegociosDraftNamespace();
      if (cancelled) return;
      namespaceRef.current = ns;

      migrateLegacyAutosNegociosDraftJsonToNamespace(ns);

      const confirmRoute = isAutosConfirmRoute(pathname);
      const resume = resumeQueryFlag();
      const freshTab = shouldResetAutosDraftForFreshEditorTab(AUTOS_NEGOCIOS_EDITOR_SESSION_KEY);
      const inventoryAdd = inventoryAddFromLocation();

      /** Preview return or publish confirm — always restore persisted draft. */
      if (confirmRoute || resume) {
        await hydrateFromNamespace(ns);
        if (resume) {
          const d = await loadAutosNegociosDraftResolved(ns);
          if (d && d.editorStep === undefined) {
            applyEditorProgress(AUTOS_PUBLISH_FINAL_STEP_INDEX, AUTOS_PUBLISH_FINAL_STEP_INDEX);
          }
        }
        if (!cancelled) setHydrated(true);
        return;
      }

      /** Inventory child vehicle: keep saved draft; prefill dealer from parent only when no draft yet. */
      if (inventoryAdd.inventoryModeAdd && inventoryAdd.context) {
        writeInventoryAddContextToSession(inventoryAdd.context);
        const existing = await loadAutosNegociosDraftResolved(ns);
        if (existing) {
          applyDraftPayload(existing);
          if (!cancelled) setHydrated(true);
          return;
        }

        if (freshTab) {
          try {
            window.localStorage.removeItem(LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY);
          } catch {
            /* ignore */
          }
          clearAutosDraftNamespaceHint("negocios");
          await clearAutosNegociosDraft(ns);
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (token) {
          const r = await fetch(
            `/api/clasificados/autos/listings/${encodeURIComponent(inventoryAdd.context.parentListingId)}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (r.ok) {
            const j = (await r.json()) as { listing?: AutoDealerListing };
            if (j.listing) {
              setVehicleTitleOverride(false);
              setListing(safeNormalizeAutosDraftListing(prefillDealerListingForInventoryAdd(j.listing), "negocios"));
              if (!cancelled) setHydrated(true);
              return;
            }
          }
        }
        emptyListing();
        if (!cancelled) setHydrated(true);
        return;
      }

      /** First editor mount in this browser tab — start a clean Negocios draft. */
      if (freshTab) {
        try {
          window.localStorage.removeItem(LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY);
        } catch {
          /* ignore */
        }
        clearAutosDraftNamespaceHint("negocios");
        await clearAutosNegociosDraft(ns);
        emptyListing();
        if (!cancelled) setHydrated(true);
        return;
      }

      /** Same-tab remount (e.g. back from preview) — restore without wiping. */
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
      clearAutosDraftNamespaceHint("negocios");
      try {
        window.localStorage.removeItem(LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY);
      } catch {
        /* ignore */
      }
      await clearAutosNegociosDraft(nextNs);
      emptyListing();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [pathname, hydrateFromNamespace, emptyListing, applyDraftPayload, applyEditorProgress]);

  const setListingPatch = useCallback(
    (patch: Partial<AutoDealerListing>) => {
      setListing((prev) => {
        const merged: AutoDealerListing = { ...prev, ...patch };
        if (patch.dealerSocials !== undefined) {
          merged.dealerSocials = { ...prev.dealerSocials, ...patch.dealerSocials };
        }
        const next = applyAutoTitle(merged, overrideRef.current);
        return normalizeLoadedListing(next, { liveDraft: true });
      });
    },
    [],
  );

  const replaceListing = useCallback((next: AutoDealerListing) => {
    const withTitle = applyAutoTitle(next, overrideRef.current);
    const normalized = normalizeLoadedListing(withTitle);
    setListing(normalized);
  }, []);

  const setVehicleTitleOverrideState = useCallback((v: boolean) => {
    overrideRef.current = v;
    setVehicleTitleOverride(v);
    setListing((prev) => {
      const next = applyAutoTitle(prev, v);
      return normalizeLoadedListing(next, { liveDraft: true });
    });
  }, []);

  const updateDealerHourRow = useCallback((rowId: string, patch: Partial<DealerHoursEntry>) => {
    setListing((prev) => {
      const rows = [...(prev.dealerHours ?? [])];
      const i = rows.findIndex((r) => r.rowId === rowId);
      if (i < 0) return prev;
      rows[i] = { ...rows[i]!, ...patch };
      const next = applyAutoTitle({ ...prev, dealerHours: rows }, overrideRef.current);
      return normalizeLoadedListing(next, { liveDraft: true });
    });
  }, []);

  const removeDealerHourRow = useCallback((rowId: string) => {
    setListing((prev) => {
      const before = prev.dealerHours ?? [];
      const rows = before.filter((r) => r.rowId !== rowId);
      if (rows.length === before.length) return prev;
      const next = applyAutoTitle({ ...prev, dealerHours: rows }, overrideRef.current);
      return normalizeLoadedListing(next, { liveDraft: true });
    });
  }, []);

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

  const flushDraft = useCallback(async (opts?: { editorStep?: number; editorMaxReached?: number }) => {
    const ns = namespaceRef.current;
    if (!ns) return;
    rememberAutosDraftNamespaceHint("negocios", ns);
    const merged = normalizeLoadedListing(listingRef.current);
    const withTitle = applyAutoTitle(merged, overrideRef.current);
    const normalized = normalizeLoadedListing(withTitle);
    const step =
      opts?.editorStep !== undefined ? clampAutosEditorStep(opts.editorStep) : editorStepRef.current;
    const max =
      opts?.editorMaxReached !== undefined
        ? clampAutosEditorMaxReached(opts.editorMaxReached, step)
        : editorMaxReachedRef.current;
    editorStepRef.current = step;
    editorMaxReachedRef.current = max;
    await saveAutosNegociosDraftResolved(ns, {
      v: 1,
      vehicleTitleOverride: overrideRef.current,
      listing: normalized,
      editorStep: step,
      editorMaxReached: max,
    });
  }, []);

  useAutosDraftPersistEffects(hydrated, flushDraft, [listing, vehicleTitleOverride, editorStep, editorMaxReached]);

  const inventoryAdd = inventoryAddFromLocation();

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
    inventoryAddMode: inventoryAdd.inventoryModeAdd,
    inventoryAddContext: inventoryAdd.context,
    editorStep,
    editorMaxReached,
    setEditorProgress: applyEditorProgress,
  };
}

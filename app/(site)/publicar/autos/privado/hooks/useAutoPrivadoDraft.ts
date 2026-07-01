"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import {
  clearAutosPrivadoDraft,
  loadAutosPrivadoDraftResolved,
  saveAutosPrivadoDraftResolved,
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
  markAutosEditorSessionActive,
  shouldResetAutosDraftForFreshEditorTab,
} from "@/app/clasificados/autos/shared/lib/autosEditorTabSession";
import { useAutosDraftPersistEffects } from "@/app/lib/clasificados/autos/useAutosDraftPersistEffects";
import { clearAutosDraftNamespaceHint, rememberAutosDraftNamespaceHint } from "@/app/clasificados/autos/shared/lib/autosDraftPreviewNamespaceHint";
import {
  clampAutosEditorMaxReached,
  clampAutosEditorStep,
  AUTOS_PUBLISH_FINAL_STEP_INDEX,
} from "@/app/lib/clasificados/autos/autosEditorDraftStep";
import type { AutosPrivadoDraftV1 } from "@/app/clasificados/autos/privado/lib/autosPrivadoDraftStorage";

/** Privado: canonical public title always follows structured year / make / model / trim. */
function applyPrivadoCanonicalTitle(listing: AutoDealerListing): AutoDealerListing {
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

export function useAutoPrivadoDraft() {
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [restoredFromSession, setRestoredFromSession] = useState(false);
  const [listing, setListing] = useState<AutoDealerListing>(() => ({
    ...createEmptyListing(),
    autosLane: "privado",
  }));

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
    (d: AutosPrivadoDraftV1) => {
      setListing(safeNormalizeAutosDraftListing({ ...d.listing, autosLane: "privado" }, "privado"));
      applyEditorProgress(d.editorStep ?? 0, d.editorMaxReached ?? d.editorStep ?? 0);
      setRestoredFromSession(true);
    },
    [applyEditorProgress],
  );

  const hydrateFromNamespace = useCallback(async (namespace: string) => {
    const d = await loadAutosPrivadoDraftResolved(namespace);
    if (d) {
      applyDraftPayload(d);
    } else {
      setListing({ ...createEmptyListing(), autosLane: "privado" });
      applyEditorProgress(0, 0);
      setRestoredFromSession(false);
    }
  }, [applyDraftPayload, applyEditorProgress]);

  const emptyPrivado = useCallback(() => {
    setListing({ ...createEmptyListing(), autosLane: "privado" });
    applyEditorProgress(0, 0);
    setRestoredFromSession(false);
  }, [applyEditorProgress]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    const bootstrap = async () => {
      const ns = await resolveAutosPrivadoDraftNamespace();
      if (cancelled) return;
      namespaceRef.current = ns;

      markAutosEditorSessionActive(AUTOS_PRIVADO_EDITOR_SESSION_KEY);
      void shouldResetAutosDraftForFreshEditorTab(AUTOS_PRIVADO_EDITOR_SESSION_KEY);

      const confirmRoute = isAutosConfirmRoute(pathname);
      const resume = resumeQueryFlag();

      if (confirmRoute || resume) {
        await hydrateFromNamespace(ns);
        if (resume) {
          const d = await loadAutosPrivadoDraftResolved(ns);
          if (d && d.editorStep === undefined) {
            applyEditorProgress(AUTOS_PUBLISH_FINAL_STEP_INDEX, AUTOS_PUBLISH_FINAL_STEP_INDEX);
          }
        }
        if (!cancelled) setHydrated(true);
        return;
      }

      await hydrateFromNamespace(ns);
      if (!cancelled) setHydrated(true);
    };

    void bootstrap().catch(() => {
      if (cancelled) return;
      emptyPrivado();
      setHydrated(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION") return;
      const nextNs = session?.user?.id
        ? autosPrivadoDraftNamespaceFromUserId(session.user.id)
        : autosPrivadoDraftNamespaceFromUserId(null);
      if (namespaceRef.current === nextNs) return;
      namespaceRef.current = nextNs;
      clearAutosDraftNamespaceHint("privado");
      await clearAutosPrivadoDraft(nextNs);
      emptyPrivado();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [pathname, hydrateFromNamespace, emptyPrivado, applyEditorProgress]);

  const setListingPatch = useCallback((patch: Partial<AutoDealerListing>) => {
    setListing((prev) => {
      const merged: AutoDealerListing = { ...prev, ...patch, autosLane: "privado" };
      if (patch.dealerSocials !== undefined) {
        merged.dealerSocials = { ...prev.dealerSocials, ...patch.dealerSocials };
      }
      const withTitle = applyPrivadoCanonicalTitle(merged);
      return normalizeLoadedListing(withTitle, { liveDraft: true });
    });
  }, []);

  const resetDraft = useCallback(async () => {
    const ns = namespaceRef.current;
    clearAutosDraftNamespaceHint("privado");
    try {
      window.sessionStorage.removeItem(AUTOS_PRIVADO_EDITOR_SESSION_KEY);
    } catch {
      /* ignore */
    }
    if (ns) await clearAutosPrivadoDraft(ns);
    const empty = { ...createEmptyListing(), autosLane: "privado" as const };
    listingRef.current = empty;
    setListing(empty);
    applyEditorProgress(0, 0);
    setRestoredFromSession(false);
  }, [applyEditorProgress]);

  const flushDraft = useCallback(async (opts?: {
    editorStep?: number;
    editorMaxReached?: number;
    listing?: AutoDealerListing;
  }) => {
    const ns = namespaceRef.current;
    if (!ns) return;
    rememberAutosDraftNamespaceHint("privado", ns);
    if (opts?.listing) {
      listingRef.current = normalizeLoadedListing({ ...opts.listing, autosLane: "privado" });
      setListing(listingRef.current);
    }
    const merged = normalizeLoadedListing({ ...listingRef.current, autosLane: "privado" });
    const withTitle = applyPrivadoCanonicalTitle(merged);
    const normalized = normalizeLoadedListing(withTitle);
    const step =
      opts?.editorStep !== undefined ? clampAutosEditorStep(opts.editorStep) : editorStepRef.current;
    const max =
      opts?.editorMaxReached !== undefined
        ? clampAutosEditorMaxReached(opts.editorMaxReached, step)
        : editorMaxReachedRef.current;
    editorStepRef.current = step;
    editorMaxReachedRef.current = max;
    await saveAutosPrivadoDraftResolved(ns, {
      v: 1,
      vehicleTitleOverride: false,
      listing: normalized,
      editorStep: step,
      editorMaxReached: max,
    });
  }, []);

  useAutosDraftPersistEffects(hydrated, flushDraft, [listing, editorStep, editorMaxReached]);

  return {
    hydrated,
    restoredFromSession,
    listing,
    setListingPatch,
    resetDraft,
    flushDraft,
    editorStep,
    editorMaxReached,
    setEditorProgress: applyEditorProgress,
  };
}

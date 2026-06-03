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
  shouldResetAutosDraftForFreshEditorTab,
} from "@/app/clasificados/autos/shared/lib/autosEditorTabSession";
import { useAutosDraftPersistEffects } from "@/app/lib/clasificados/autos/useAutosDraftPersistEffects";
import { clearAutosDraftNamespaceHint, rememberAutosDraftNamespaceHint } from "@/app/clasificados/autos/shared/lib/autosDraftPreviewNamespaceHint";

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
  const [listing, setListing] = useState<AutoDealerListing>(() => ({
    ...createEmptyListing(),
    autosLane: "privado",
  }));

  const namespaceRef = useRef<string | null>(null);
  const listingRef = useRef(listing);
  useLayoutEffect(() => {
    listingRef.current = listing;
  }, [listing]);

  const hydrateFromNamespace = useCallback(async (namespace: string) => {
    const d = await loadAutosPrivadoDraftResolved(namespace);
    if (d) {
      setListing(safeNormalizeAutosDraftListing({ ...d.listing, autosLane: "privado" }, "privado"));
    } else {
      setListing({ ...createEmptyListing(), autosLane: "privado" });
    }
  }, []);

  const emptyPrivado = useCallback(() => {
    setListing({ ...createEmptyListing(), autosLane: "privado" });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    const bootstrap = async () => {
      const ns = await resolveAutosPrivadoDraftNamespace();
      if (cancelled) return;
      namespaceRef.current = ns;

      const confirmRoute = isAutosConfirmRoute(pathname);
      const resume = resumeQueryFlag();

      if (confirmRoute || resume) {
        await hydrateFromNamespace(ns);
        if (!cancelled) setHydrated(true);
        return;
      }

      const freshTab = shouldResetAutosDraftForFreshEditorTab(AUTOS_PRIVADO_EDITOR_SESSION_KEY);

      if (freshTab) {
        clearAutosDraftNamespaceHint("privado");
        await clearAutosPrivadoDraft(ns);
        emptyPrivado();
        if (!cancelled) setHydrated(true);
        return;
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
      clearAutosDraftNamespaceHint("privado");
      await clearAutosPrivadoDraft(nextNs);
      emptyPrivado();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [pathname, hydrateFromNamespace, emptyPrivado]);

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
  }, []);

  const flushDraft = useCallback(async () => {
    const ns = namespaceRef.current;
    if (!ns) return;
    rememberAutosDraftNamespaceHint("privado", ns);
    const merged = normalizeLoadedListing({ ...listingRef.current, autosLane: "privado" });
    const withTitle = applyPrivadoCanonicalTitle(merged);
    const normalized = normalizeLoadedListing(withTitle);
    await saveAutosPrivadoDraftResolved(ns, {
      v: 1,
      vehicleTitleOverride: false,
      listing: normalized,
    });
  }, []);

  useAutosDraftPersistEffects(hydrated, flushDraft, [listing]);

  return {
    hydrated,
    listing,
    setListingPatch,
    resetDraft,
    flushDraft,
  };
}

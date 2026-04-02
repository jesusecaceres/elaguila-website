"use client";

import { useCallback, useEffect, useState } from "react";
import { AutoDealerPreviewPage } from "../components/AutoDealerPreviewPage";
import { AutosNegociosPreviewEmptyState } from "../components/AutosNegociosPreviewEmptyState";
import { AUTOS_NEGOCIOS_DRAFT_KEY, loadAutosNegociosDraft } from "../lib/autosNegociosDraftStorage";
import { mockAutoDealerListing } from "../mock/mockAutoDealerListing";
import type { AutoDealerListing } from "../types/autoDealerListing";
import { normalizeLoadedListing } from "../lib/autoDealerDraftDefaults";
import { isMeaningfulAutoDealerDraft } from "../lib/isMeaningfulAutoDealerDraft";

const EDIT_HREF = "/publicar/autos/negocios";

type AutosNegociosPreviewMode = "empty" | "draft" | "mock";

function isDemoQuery(): boolean {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(window.location.search);
  const v = q.get("demo");
  return v === "1" || v === "true";
}

function resolvePreviewState(): {
  mode: AutosNegociosPreviewMode;
  listing: AutoDealerListing;
} {
  const demo = isDemoQuery();
  if (demo) {
    const base = mockAutoDealerListing;
    const relatedDealerListings =
      base.relatedDealerListings?.length ? base.relatedDealerListings : (mockAutoDealerListing.relatedDealerListings ?? []);
    return {
      mode: "mock",
      listing: { ...base, relatedDealerListings },
    };
  }

  const d = loadAutosNegociosDraft();
  const normalized = normalizeLoadedListing(d?.listing);
  if (isMeaningfulAutoDealerDraft(normalized)) {
    return { mode: "draft", listing: normalized };
  }

  return { mode: "empty", listing: normalized };
}

export function AutosNegociosPreviewClient() {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<AutosNegociosPreviewMode>("empty");
  const [listing, setListing] = useState<AutoDealerListing>(() => normalizeLoadedListing(undefined));

  const refresh = useCallback(() => {
    const next = resolvePreviewState();
    setMode(next.mode);
    setListing(next.listing);
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === AUTOS_NEGOCIOS_DRAFT_KEY || e.key === null) refresh();
    }
    function onFocus() {
      refresh();
    }
    function onPopState() {
      refresh();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("popstate", onPopState);
    };
  }, [refresh]);

  if (!ready) {
    return <div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />;
  }

  if (mode === "empty") {
    return <AutosNegociosPreviewEmptyState />;
  }

  return <AutoDealerPreviewPage data={listing} editBackHref={EDIT_HREF} />;
}

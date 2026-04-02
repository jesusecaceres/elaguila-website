"use client";

import { useCallback, useEffect, useState } from "react";
import { AutoDealerPreviewPage } from "../components/AutoDealerPreviewPage";
import { AutosNegociosPreviewEmptyState } from "../components/AutosNegociosPreviewEmptyState";
import { AUTOS_NEGOCIOS_DRAFT_KEY, loadAutosNegociosDraftResolved } from "../lib/autosNegociosDraftStorage";
import { mockAutoDealerListing } from "../mock/mockAutoDealerListing";
import type { AutoDealerListing } from "../types/autoDealerListing";
import { normalizeLoadedListing } from "../lib/autoDealerDraftDefaults";
import { isMeaningfulAutoDealerDraft } from "../lib/isMeaningfulAutoDealerDraft";
import { AutosNegociosPreviewLocaleProvider, useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";
import { withLangParam } from "../lib/autosNegociosLang";

const EDIT_BASE = "/publicar/autos/negocios";

type AutosNegociosPreviewMode = "empty" | "draft" | "mock";

function isDemoQuery(): boolean {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(window.location.search);
  const v = q.get("demo");
  return v === "1" || v === "true";
}

async function resolvePreviewState(): Promise<{
  mode: AutosNegociosPreviewMode;
  listing: AutoDealerListing;
}> {
  const demo = isDemoQuery();
  if (demo) {
    const base = mockAutoDealerListing;
    const relatedDealerListings =
      base.relatedDealerListings?.length ? base.relatedDealerListings : (mockAutoDealerListing.relatedDealerListings ?? []);
    return {
      mode: "mock",
      listing: normalizeLoadedListing({ ...base, relatedDealerListings }),
    };
  }

  const d = await loadAutosNegociosDraftResolved();
  const normalized = normalizeLoadedListing(d?.listing);
  if (isMeaningfulAutoDealerDraft(normalized)) {
    return { mode: "draft", listing: normalized };
  }

  return { mode: "empty", listing: normalized };
}

function AutosNegociosPreviewInner({
  ready,
  mode,
  listing,
}: {
  ready: boolean;
  mode: AutosNegociosPreviewMode;
  listing: AutoDealerListing;
}) {
  const { lang } = useAutosNegociosPreviewCopy();
  const editBackHref = withLangParam(EDIT_BASE, lang);

  if (!ready) {
    return <div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />;
  }

  if (mode === "empty") {
    return <AutosNegociosPreviewEmptyState />;
  }

  return <AutoDealerPreviewPage data={listing} editBackHref={editBackHref} />;
}

export function AutosNegociosPreviewClient() {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<AutosNegociosPreviewMode>("empty");
  const [listing, setListing] = useState<AutoDealerListing>(() => normalizeLoadedListing(undefined));

  const refresh = useCallback(async () => {
    const next = await resolvePreviewState();
    setMode(next.mode);
    setListing(next.listing);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refresh();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === AUTOS_NEGOCIOS_DRAFT_KEY || e.key === null) void refresh();
    }
    function onFocus() {
      void refresh();
    }
    function onPopState() {
      void refresh();
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

  return (
    <AutosNegociosPreviewLocaleProvider>
      <AutosNegociosPreviewInner ready={ready} mode={mode} listing={listing} />
    </AutosNegociosPreviewLocaleProvider>
  );
}

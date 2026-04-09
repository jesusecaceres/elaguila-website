"use client";

import { useCallback, useEffect, useState } from "react";
import { AutoPrivadoPreviewPage } from "../components/AutoPrivadoPreviewPage";
import { AutosPrivadoPreviewEmptyState } from "../components/AutosPrivadoPreviewEmptyState";
import { AutosPrivadoPreviewErrorBoundary } from "./AutosPrivadoPreviewErrorBoundary";
import { loadAutosPrivadoDraftResolved, safeNormalizePrivadoListing } from "../lib/autosPrivadoDraftStorage";
import { resolveAutosPrivadoDraftNamespace, storageEventAffectsAutosPrivadoDraft } from "../lib/autosPrivadoDraftNamespace";
import { mockAutosPrivadoListing } from "../mock/mockAutosPrivadoListing";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { isMeaningfulAutoDealerDraft } from "@/app/clasificados/autos/negocios/lib/isMeaningfulAutoDealerDraft";
import { AutosPrivadoPreviewLocaleProvider, useAutosPrivadoPreviewCopy } from "../lib/AutosPrivadoPreviewLocaleContext";
import { withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

const EDIT_BASE = "/publicar/autos/privado";

type AutosPrivadoPreviewMode = "empty" | "draft" | "mock";

function isDemoQuery(): boolean {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(window.location.search);
  const v = q.get("demo");
  return v === "1" || v === "true";
}

function listingIsMeaningfulDraft(listing: AutoDealerListing): boolean {
  try {
    return isMeaningfulAutoDealerDraft(listing);
  } catch {
    return false;
  }
}

async function resolvePreviewState(): Promise<{
  mode: AutosPrivadoPreviewMode;
  listing: AutoDealerListing;
}> {
  try {
    const demo = isDemoQuery();
    if (demo) {
      return {
        mode: "mock",
        listing: safeNormalizePrivadoListing({ ...mockAutosPrivadoListing, autosLane: "privado" }),
      };
    }

    const namespace = await resolveAutosPrivadoDraftNamespace();
    const d = await loadAutosPrivadoDraftResolved(namespace);
    const normalized = safeNormalizePrivadoListing({ ...d?.listing, autosLane: "privado" });
    if (listingIsMeaningfulDraft(normalized)) {
      return { mode: "draft", listing: normalized };
    }

    return { mode: "empty", listing: normalized };
  } catch {
    return { mode: "empty", listing: safeNormalizePrivadoListing(undefined) };
  }
}

function AutosPrivadoPreviewInner({
  ready,
  mode,
  listing,
}: {
  ready: boolean;
  mode: AutosPrivadoPreviewMode;
  listing: AutoDealerListing;
}) {
  const { lang } = useAutosPrivadoPreviewCopy();
  const editBackHref = withLangParam(EDIT_BASE, lang);

  if (!ready) {
    return <div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />;
  }

  if (mode === "empty") {
    return <AutosPrivadoPreviewEmptyState />;
  }

  return (
    <AutosPrivadoPreviewErrorBoundary>
      <AutoPrivadoPreviewPage data={listing} editBackHref={editBackHref} />
    </AutosPrivadoPreviewErrorBoundary>
  );
}

export function AutosPrivadoPreviewClient() {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<AutosPrivadoPreviewMode>("empty");
  const [listing, setListing] = useState<AutoDealerListing>(() => safeNormalizePrivadoListing(undefined));
  const [recoverHint, setRecoverHint] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await resolvePreviewState();
      setRecoverHint(null);
      setMode(next.mode);
      setListing(next.listing);
    } catch {
      setMode("empty");
      setListing(safeNormalizePrivadoListing(undefined));
      if (process.env.NODE_ENV === "development") {
        setRecoverHint("Preview fell back to empty state after an unexpected error");
      }
    }
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
      if (storageEventAffectsAutosPrivadoDraft(e.key)) void refresh();
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
    <AutosPrivadoPreviewLocaleProvider>
      {process.env.NODE_ENV === "development" && recoverHint ? (
        <p
          className="mx-auto max-w-3xl px-4 pt-2 text-xs text-amber-900/90 dark:text-amber-100/90"
          role="note"
        >
          {recoverHint}
        </p>
      ) : null}
      <AutosPrivadoPreviewInner ready={ready} mode={mode} listing={listing} />
    </AutosPrivadoPreviewLocaleProvider>
  );
}

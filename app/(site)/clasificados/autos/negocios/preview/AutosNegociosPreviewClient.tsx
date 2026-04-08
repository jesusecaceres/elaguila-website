"use client";

import { useCallback, useEffect, useState } from "react";
import { AutoDealerPreviewPage } from "../components/AutoDealerPreviewPage";
import { AutosNegociosPreviewEmptyState } from "../components/AutosNegociosPreviewEmptyState";
import { loadAutosNegociosDraftResolved } from "../lib/autosNegociosDraftStorage";
import {
  migrateLegacyAutosNegociosDraftJsonToNamespace,
  resolveAutosNegociosDraftNamespace,
  storageEventAffectsAutosNegociosDraft,
} from "../lib/autosNegociosDraftNamespace";
import { mockAutoDealerListing } from "../mock/mockAutoDealerListing";
import type { AutoDealerListing } from "../types/autoDealerListing";
import { isMeaningfulAutoDealerDraft } from "../lib/isMeaningfulAutoDealerDraft";
import { AutosNegociosPreviewLocaleProvider, useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";
import { withLangParam } from "../lib/autosNegociosLang";
import { safeNormalizeAutosDraftListing } from "@/app/clasificados/autos/shared/lib/safeNormalizeAutosDraftListing";

const EDIT_BASE = "/publicar/autos/negocios";

type AutosNegociosPreviewMode = "empty" | "draft" | "mock";

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
  mode: AutosNegociosPreviewMode;
  listing: AutoDealerListing;
}> {
  try {
    const demo = isDemoQuery();
    if (demo) {
      const base = mockAutoDealerListing;
      const relatedDealerListings =
        base.relatedDealerListings?.length ? base.relatedDealerListings : (mockAutoDealerListing.relatedDealerListings ?? []);
      return {
        mode: "mock",
        listing: safeNormalizeAutosDraftListing({ ...base, relatedDealerListings }, "negocios"),
      };
    }

    const namespace = await resolveAutosNegociosDraftNamespace();
    migrateLegacyAutosNegociosDraftJsonToNamespace(namespace);
    const d = await loadAutosNegociosDraftResolved(namespace);
    const normalized = safeNormalizeAutosDraftListing(d?.listing, "negocios");
    if (listingIsMeaningfulDraft(normalized)) {
      return { mode: "draft", listing: normalized };
    }

    return { mode: "empty", listing: normalized };
  } catch {
    return { mode: "empty", listing: safeNormalizeAutosDraftListing(undefined, "negocios") };
  }
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
  const [listing, setListing] = useState<AutoDealerListing>(() => safeNormalizeAutosDraftListing(undefined, "negocios"));
  const [recoverHint, setRecoverHint] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await resolvePreviewState();
      setRecoverHint(null);
      setMode(next.mode);
      setListing(next.listing);
    } catch {
      setMode("empty");
      setListing(safeNormalizeAutosDraftListing(undefined, "negocios"));
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
      if (storageEventAffectsAutosNegociosDraft(e.key)) void refresh();
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
      {process.env.NODE_ENV === "development" && recoverHint ? (
        <p className="mx-auto max-w-3xl px-4 pt-2 text-xs text-amber-900/90 dark:text-amber-100/90" role="note">
          {recoverHint}
        </p>
      ) : null}
      <AutosNegociosPreviewInner ready={ready} mode={mode} listing={listing} />
    </AutosNegociosPreviewLocaleProvider>
  );
}

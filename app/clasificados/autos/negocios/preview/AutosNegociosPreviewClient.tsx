"use client";

import { useEffect, useState } from "react";
import { AutoDealerPreviewPage } from "../components/AutoDealerPreviewPage";
import { loadAutosNegociosDraft } from "../lib/autosNegociosDraftStorage";
import { mockAutoDealerListing } from "../mock/mockAutoDealerListing";
import type { AutoDealerListing } from "../types/autoDealerListing";
import { normalizeLoadedListing } from "../lib/autoDealerDraftDefaults";

const EDIT_HREF = "/publicar/autos/negocios";

export function AutosNegociosPreviewClient() {
  const [listing, setListing] = useState<AutoDealerListing | null>(null);
  const [previewMode, setPreviewMode] = useState<"mock" | "draft">("mock");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const d = loadAutosNegociosDraft();
    if (d) {
      setPreviewMode("draft");
      setListing(normalizeLoadedListing(d.listing));
    } else {
      setPreviewMode("mock");
      setListing(null);
    }
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />;
  }

  const base = listing ?? mockAutoDealerListing;
  const relatedDealerListings =
    previewMode === "mock" && !(base.relatedDealerListings?.length)
      ? (mockAutoDealerListing.relatedDealerListings ?? [])
      : (base.relatedDealerListings ?? []);

  const data: AutoDealerListing = { ...base, relatedDealerListings };

  return <AutoDealerPreviewPage data={data} editBackHref={EDIT_HREF} />;
}

"use client";

import { useEffect, useState } from "react";
import { AutoDealerPreviewPage } from "../components/AutoDealerPreviewPage";
import { loadAutosNegociosDraft } from "../lib/autosNegociosDraftStorage";
import { mockAutoDealerListing } from "../mock/mockAutoDealerListing";
import type { AutoDealerListing } from "../types/autoDealerListing";
import { normalizeLoadedListing } from "../lib/autoDealerDraftDefaults";

function mergeRelatedFromMock(listing: AutoDealerListing): AutoDealerListing {
  const rel =
    (listing.relatedDealerListings?.length ?? 0) > 0
      ? listing.relatedDealerListings!
      : (mockAutoDealerListing.relatedDealerListings ?? []);
  return { ...listing, relatedDealerListings: rel };
}

export function AutosNegociosPreviewClient() {
  const [listing, setListing] = useState<AutoDealerListing | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const d = loadAutosNegociosDraft();
    if (d) {
      setListing(mergeRelatedFromMock(normalizeLoadedListing(d.listing)));
    } else {
      setListing(null);
    }
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />;
  }

  const data = listing ?? mockAutoDealerListing;
  return <AutoDealerPreviewPage data={data} />;
}

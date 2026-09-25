"use client";

import { useMemo } from "react";

import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { normalizeLoadedListing } from "@/app/clasificados/autos/negocios/lib/autoDealerDraftDefaults";
import { withNormalizedVehicleIdentityForDisplay } from "@/app/lib/clasificados/autos/autosListingDisplayIdentity";
import { AutosNegociosDealershipPreviewPage } from "@/app/clasificados/autos/negocios/preview/dealershipPreview/AutosNegociosDealershipPreviewPage";
import { AutosNegociosPreviewLocaleProvider } from "@/app/clasificados/autos/negocios/lib/AutosNegociosPreviewLocaleContext";
import { normalizeAutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { AutosListingTranslationLayer } from "@/app/clasificados/autos/vehiculo/[id]/AutosListingTranslationLayer";

/**
 * PROSPECT PREVIEW — Autos Dealer, rendered with the REAL public components.
 *
 * This mirrors `AutosLiveVehicleClient`'s dealer lane exactly: the same `normalizeLoadedListing` +
 * `withNormalizedVehicleIdentityForDisplay` pipeline, the same `AutosListingTranslationLayer`
 * (the real Translate Ad control, category "autos"), the same `AutosNegociosPreviewLocaleProvider`
 * wrapping and the same `AutosNegociosDealershipPreviewPage` in `publicPlaybackOnly` mode (public
 * look and durable-media playback).
 *
 * What is deliberately absent, because a prospect has no account and this is a private,
 * not-yet-published ad:
 *   - `publicAnalytics` is NOT passed. Every Like / Save / Share / contact-click recorder in the
 *     dealer page is gated on it, so nothing is ever recorded or persisted.
 *   - no `AutosVehicleProfileViewAnalytics` view beacon, no owner inventory bar, no report form;
 *   - no live analytics snapshot and no related/portfolio inventory (those come from the published
 *     pool, which this private ad is not in).
 */
export function ProspectAutosDealerRealPreview({
  listing,
  lang,
  authoredLang,
  listingKey,
}: {
  listing: Record<string, unknown>;
  lang: "es" | "en";
  /** The seller's authored language (`autos_classifieds_listings.lang`) — the Translate Ad source. */
  authoredLang: "es" | "en" | null;
  listingKey: string;
}) {
  const data = useMemo<AutoDealerListing>(() => {
    const normalized = withNormalizedVehicleIdentityForDisplay(
      normalizeLoadedListing({ ...(listing as Partial<AutoDealerListing>), autosLane: "negocios" }),
    );
    return {
      ...normalized,
      listingAnalytics: undefined,
      relatedDealerListings: undefined,
      relatedDealerInventoryHref: null,
      relatedDealerInventoryHasMore: false,
    };
  }, [listing]);

  return (
    <AutosNegociosPreviewLocaleProvider lang={lang} manageDocumentTitle={false}>
      <AutosListingTranslationLayer listing={data} siteLocale={lang} listingLang={authoredLang} listingKey={listingKey}>
        {(displayListing, translateControl, adDisplayLang) => (
          <AutosNegociosPreviewLocaleProvider lang={normalizeAutosNegociosLang(adDisplayLang)} manageDocumentTitle={false}>
            <AutosNegociosDealershipPreviewPage
              data={displayListing}
              editBackHref={undefined}
              publicPlaybackOnly
              translateControl={translateControl}
            />
          </AutosNegociosPreviewLocaleProvider>
        )}
      </AutosListingTranslationLayer>
    </AutosNegociosPreviewLocaleProvider>
  );
}

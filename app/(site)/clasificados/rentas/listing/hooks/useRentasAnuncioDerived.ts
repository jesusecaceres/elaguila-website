"use client";

import { useMemo } from "react";
import { inferRentasPlanTierFromListing, type RentasPlanTier } from "../../shared/utils/rentasPlanTier";
import type {
  RentasAnuncioFactPair,
  RentasAnuncioLang,
  RentasAnuncioListingLike,
  RentasNegocioLiveDisplay,
  RentasSameCompanySampleItem,
} from "../types/rentasAnuncioLiveTypes";
import {
  buildRentasAmenities,
  buildRentasMetaFromText,
  buildRentasNegocioLiveDisplay,
  buildRentasRentalFacts,
  filterRentasSameCompanySampleListings,
  parseRentasBusinessMetaForLive,
} from "../utils/rentasAnuncioLiveDerived";

export type RentasAnuncioDerived = {
  rentasMeta: { facts: RentasAnuncioFactPair[] } | null;
  rentasRentalFacts: RentasAnuncioFactPair[];
  rentasAmenities: RentasAnuncioFactPair[];
  rentasBusinessMeta: Record<string, string> | null;
  rentasNegocioDisplay: RentasNegocioLiveDisplay | null;
  rentasSameCompanyListings: RentasSameCompanySampleItem[];
  rentasPlanTier: RentasPlanTier | null;
};

export function useRentasAnuncioDerived(options: {
  listing: RentasAnuncioListingLike | null | undefined;
  lang: RentasAnuncioLang;
  isLiveDbListing: boolean;
  sampleListings: readonly RentasSameCompanySampleItem[];
}): RentasAnuncioDerived {
  const { listing, lang, isLiveDbListing, sampleListings } = options;
  const active = listing?.category === "rentas";

  const rentasBusinessMeta = useMemo(
    () => (active && listing ? parseRentasBusinessMetaForLive(listing) : null),
    [active, listing]
  );

  const rentasMeta = useMemo(
    () => (active && listing ? buildRentasMetaFromText(listing, lang) : null),
    [active, listing, lang]
  );

  const rentasRentalFacts = useMemo(
    () => (active && listing ? buildRentasRentalFacts(listing, lang, rentasMeta) : []),
    [active, listing, lang, rentasMeta]
  );

  const rentasAmenities = useMemo(() => (active && listing ? buildRentasAmenities(listing) : []), [active, listing]);

  const rentasNegocioDisplay = useMemo(
    () => (active && listing ? buildRentasNegocioLiveDisplay(listing, rentasBusinessMeta, lang) : null),
    [active, listing, rentasBusinessMeta, lang]
  );

  const rentasSameCompanyListings = useMemo(
    () =>
      active && listing
        ? filterRentasSameCompanySampleListings(listing, isLiveDbListing, rentasBusinessMeta, sampleListings)
        : [],
    [active, listing, isLiveDbListing, rentasBusinessMeta, sampleListings]
  );

  const rentasPlanTier = useMemo(
    () => (listing && listing.category === "rentas" ? inferRentasPlanTierFromListing(listing) : null),
    [listing]
  );

  return {
    rentasMeta,
    rentasRentalFacts,
    rentasAmenities,
    rentasBusinessMeta,
    rentasNegocioDisplay,
    rentasSameCompanyListings,
    rentasPlanTier,
  };
}

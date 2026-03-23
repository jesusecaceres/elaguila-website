"use client";

import { useMemo } from "react";
import type {
  BrAnuncioLang,
  BrAnuncioListingLike,
  BrNegocioLiveDisplay,
  BrSameCompanySampleItem,
} from "../types/brAnuncioLiveTypes";
import {
  brBaseAddressFromListing,
  brBaseFeatureTagsFromListing,
  brBaseZoneFromListing,
  buildBienesRaicesLiveFacts,
  buildBrNegocioLiveDisplay,
  filterBienesRaicesSameCompanySampleListings,
  isBienesRaicesNegocioLive,
  isBienesRaicesPrivadoLive,
  parseBienesRaicesBusinessMeta,
  resolveBrLiveVirtualTourUrl,
} from "../utils/brAnuncioLiveDerived";

export type BienesRaicesAnuncioDerived = {
  bienesRaicesBusinessMeta: Record<string, string> | null;
  brNegocioDisplay: BrNegocioLiveDisplay | null;
  bienesRaicesSameCompanyListings: BrSameCompanySampleItem[];
  bienesRaicesFacts: Array<{ label: string; value: string }>;
  brVirtualTourUrl: string | null;
  isBienesRaicesNegocio: boolean;
  isBienesRaicesPrivado: boolean;
  brBaseAddress: string;
  brBaseZone: string;
  brBaseFeatureTags: string[];
};

export function useBienesRaicesAnuncioDerived(options: {
  listing: BrAnuncioListingLike | null | undefined;
  lang: BrAnuncioLang;
  isLiveDbListing: boolean;
  sampleListings: readonly BrSameCompanySampleItem[];
}): BienesRaicesAnuncioDerived {
  const { listing, lang, isLiveDbListing, sampleListings } = options;
  const active = listing?.category === "bienes-raices";

  const bienesRaicesBusinessMeta = useMemo(
    () => (active ? parseBienesRaicesBusinessMeta(listing) : null),
    [active, listing]
  );

  const brNegocioDisplay = useMemo(
    () => (active ? buildBrNegocioLiveDisplay(listing, bienesRaicesBusinessMeta, lang) : null),
    [active, listing, bienesRaicesBusinessMeta, lang]
  );

  const bienesRaicesSameCompanyListings = useMemo(
    () =>
      active
        ? filterBienesRaicesSameCompanySampleListings(
            listing,
            isLiveDbListing,
            bienesRaicesBusinessMeta,
            sampleListings
          )
        : [],
    [active, listing, isLiveDbListing, bienesRaicesBusinessMeta, sampleListings]
  );

  const bienesRaicesFacts = useMemo(
    () => (active ? buildBienesRaicesLiveFacts(listing) : []),
    [active, listing]
  );

  const brVirtualTourUrl = useMemo(
    () => (active ? resolveBrLiveVirtualTourUrl(listing, brNegocioDisplay?.virtualTourUrl ?? null) : null),
    [active, listing, brNegocioDisplay?.virtualTourUrl]
  );

  const isBienesRaicesNegocio = useMemo(
    () => (active ? isBienesRaicesNegocioLive(listing) : false),
    [active, listing]
  );

  const isBienesRaicesPrivado = useMemo(
    () => (active ? isBienesRaicesPrivadoLive(listing) : false),
    [active, listing]
  );

  const brBaseAddress = useMemo(() => (active ? brBaseAddressFromListing(listing) : ""), [active, listing]);

  const brBaseZone = useMemo(() => (active ? brBaseZoneFromListing(listing) : ""), [active, listing]);

  const brBaseFeatureTags = useMemo(
    () => (active ? brBaseFeatureTagsFromListing(listing) : []),
    [active, listing]
  );

  return {
    bienesRaicesBusinessMeta,
    brNegocioDisplay,
    bienesRaicesSameCompanyListings,
    bienesRaicesFacts,
    brVirtualTourUrl,
    isBienesRaicesNegocio,
    isBienesRaicesPrivado,
    brBaseAddress,
    brBaseZone,
    brBaseFeatureTags,
  };
}

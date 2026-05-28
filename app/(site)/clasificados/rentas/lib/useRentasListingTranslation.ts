"use client";

import { useCallback, useMemo, useState } from "react";

import type { AdTranslationResult, ContentLocale, Locale } from "@/app/lib/translation/types";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import {
  applyRentasTranslation,
  buildRentasTranslatableContent,
  shouldOfferRentasTranslateAd,
} from "@/app/clasificados/rentas/lib/rentasTranslateAd";

export function useRentasListingTranslation(
  listing: RentasPublicListing,
  siteLocale: Locale,
  listingKey: string,
) {
  const [showTranslated, setShowTranslated] = useState(false);
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);

  const sourceLocale: ContentLocale = "unknown";
  const translatableContent = useMemo(
    () => buildRentasTranslatableContent(listing, siteLocale),
    [listing, siteLocale],
  );

  const offerTranslate = useMemo(
    () => Boolean(listingKey.trim() && shouldOfferRentasTranslateAd(siteLocale, translatableContent)),
    [listingKey, siteLocale, translatableContent],
  );

  const displayListing = useMemo(() => {
    if (!showTranslated || !translation?.translated) return listing;
    return applyRentasTranslation(listing, siteLocale, translation.translated);
  }, [listing, showTranslated, translation, siteLocale]);

  const onTranslated = useCallback((result: AdTranslationResult) => {
    setTranslation(result);
    setShowTranslated(true);
  }, []);

  const onShowOriginal = useCallback(() => {
    setShowTranslated(false);
  }, []);

  return {
    displayListing,
    translatableContent,
    offerTranslate,
    sourceLocale,
    onTranslated,
    onShowOriginal,
  };
}

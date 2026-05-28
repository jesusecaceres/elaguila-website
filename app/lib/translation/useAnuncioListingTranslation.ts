"use client";

import { useCallback, useMemo, useState } from "react";

import type { AdTranslationResult, ContentLocale, Locale } from "@/app/lib/translation/types";
import {
  applyAnuncioTranslation,
  buildAnuncioTranslatableContent,
  shouldOfferAnuncioTranslateAd,
  type AnuncioListingTranslatable,
} from "@/app/lib/translation/anuncioTranslateAd";

export function useAnuncioListingTranslation(
  listing: AnuncioListingTranslatable | null | undefined,
  siteLocale: Locale,
  listingKey: string,
) {
  const [showTranslated, setShowTranslated] = useState(false);
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);

  const sourceLocale: ContentLocale = "unknown";
  const translatableContent = useMemo(
    () => (listing ? buildAnuncioTranslatableContent(listing, siteLocale) : {}),
    [listing, siteLocale],
  );

  const offerTranslate = useMemo(
    () => Boolean(listingKey.trim() && listing && shouldOfferAnuncioTranslateAd(siteLocale, translatableContent)),
    [listing, listingKey, siteLocale, translatableContent],
  );

  const displayListing = useMemo(() => {
    if (!listing || !showTranslated || !translation?.translated) return listing ?? null;
    return applyAnuncioTranslation(listing, siteLocale, translation.translated);
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

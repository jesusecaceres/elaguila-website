"use client";

import { useCallback, useMemo, useState } from "react";

import type { AdTranslationResult, ContentLocale, Locale } from "@/app/lib/translation/types";
import type { RestaurantDetailShellData } from "@/app/clasificados/restaurantes/shell/restaurantDetailShellTypes";
import {
  applyRestaurantesTranslation,
  buildRestaurantesTranslatableContent,
  shouldOfferRestaurantesTranslateAd,
} from "@/app/clasificados/restaurantes/lib/restaurantesTranslateAd";

export function useRestauranteShellTranslation(
  data: RestaurantDetailShellData,
  siteLocale: Locale,
  listingKey: string,
) {
  const [showTranslated, setShowTranslated] = useState(false);
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);

  const sourceLocale: ContentLocale = "unknown";
  const translatableContent = useMemo(() => buildRestaurantesTranslatableContent(data), [data]);

  const offerTranslate = useMemo(
    () => Boolean(listingKey.trim() && shouldOfferRestaurantesTranslateAd(siteLocale, translatableContent)),
    [listingKey, siteLocale, translatableContent],
  );

  const displayData = useMemo(() => {
    if (!showTranslated || !translation?.translated) return data;
    return applyRestaurantesTranslation(data, translation.translated);
  }, [data, showTranslated, translation]);

  const onTranslated = useCallback((result: AdTranslationResult) => {
    setTranslation(result);
    setShowTranslated(true);
  }, []);

  const onShowOriginal = useCallback(() => {
    setShowTranslated(false);
  }, []);

  return {
    displayData,
    translatableContent,
    offerTranslate,
    sourceLocale,
    onTranslated,
    onShowOriginal,
  };
}

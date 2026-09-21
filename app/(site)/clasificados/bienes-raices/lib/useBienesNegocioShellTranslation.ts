"use client";

import { useCallback, useMemo, useState } from "react";
import type { AdTranslationResult, ContentLocale, Locale } from "@/app/lib/translation/types";
import type { AgenteIndividualResidencialFormState } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";
import {
  applyBienesNegocioTranslation,
  buildBienesNegocioTranslatableContent,
  shouldOfferBienesNegocioTranslateAd,
} from "./bienesNegocioTranslateAd";

export function useBienesNegocioShellTranslation(
  data: AgenteIndividualResidencialFormState,
  siteLocale: Locale,
  listingKey: string,
) {
  const [showTranslated, setShowTranslated] = useState(false);
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);

  const sourceLocale: ContentLocale = "unknown";
  const translatableContent = useMemo(() => buildBienesNegocioTranslatableContent(data), [data]);

  const offerTranslate = useMemo(
    () => Boolean(listingKey.trim() && shouldOfferBienesNegocioTranslateAd(siteLocale, translatableContent)),
    [listingKey, siteLocale, translatableContent],
  );

  const displayData = useMemo(() => {
    if (!showTranslated || !translation?.translated) return data;
    return applyBienesNegocioTranslation(data, translation.translated);
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

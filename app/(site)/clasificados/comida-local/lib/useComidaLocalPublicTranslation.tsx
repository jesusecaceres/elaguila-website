"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { shouldOfferTranslateAd } from "@/app/lib/translation/helpers";
import type { AdTranslationResult, ContentLocale, Locale } from "@/app/lib/translation/types";
import type { ComidaLocalPublicListingDetailVm } from "@/app/lib/clasificados/comida-local/comidaLocalPublicTypes";
import {
  applyComidaLocalTranslation,
  buildComidaLocalTranslatableContent,
  hasComidaLocalTranslatableProse,
  requestComidaLocalAdTranslation,
} from "@/app/lib/clasificados/comida-local/comidaLocalTranslateAd";

/** No DB `original_language` column on comida_local listings yet — same limitation every other
 * currently-wired category has (Servicios/Rentas/Restaurantes/etc.). */
function inferComidaLocalOriginalLocale(): ContentLocale {
  return "unknown";
}

export function useComidaLocalPublicTranslation(
  vm: ComidaLocalPublicListingDetailVm,
  lang: Locale,
  listingKey: string,
): { displayVm: ComidaLocalPublicListingDetailVm; translateControl: ReactNode } {
  const [showTranslated, setShowTranslated] = useState(false);
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);

  const originalLocale = useMemo(() => inferComidaLocalOriginalLocale(), []);
  const translatableContent = useMemo(() => buildComidaLocalTranslatableContent(vm), [vm]);

  const offerTranslate = useMemo(() => {
    if (!hasComidaLocalTranslatableProse(translatableContent)) return false;
    if (shouldOfferTranslateAd({ siteLocale: lang, originalLocale })) return true;
    return originalLocale === "unknown";
  }, [lang, originalLocale, translatableContent]);

  const displayVm = useMemo(() => {
    if (!showTranslated || !translation?.translated) return vm;
    return applyComidaLocalTranslation(vm, translation.translated);
  }, [vm, showTranslated, translation]);

  const onTranslated = useCallback((result: AdTranslationResult) => {
    setTranslation(result);
    setShowTranslated(true);
  }, []);

  const onShowOriginal = useCallback(() => {
    setShowTranslated(false);
  }, []);

  const translateControl = offerTranslate ? (
    <div className="flex justify-start" data-comida-local-translate-ad="1">
      <TranslateAdControl
        siteLocale={lang}
        originalLocale={originalLocale}
        category="comida-local"
        listingKey={listingKey}
        version="comida-local-b04-v1"
        translatableContent={translatableContent}
        onTranslated={onTranslated}
        onShowOriginal={onShowOriginal}
        requestTranslation={requestComidaLocalAdTranslation}
        className="w-full sm:w-auto"
      />
    </div>
  ) : null;

  return { displayVm, translateControl };
}

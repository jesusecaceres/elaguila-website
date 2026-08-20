"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { shouldOfferTranslateAd } from "@/app/lib/translation/helpers";
import type { AdTranslationResult, ContentLocale } from "@/app/lib/translation/types";
import type { OfertaLocalPublicOfferDetail } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import {
  applyOfertasLocalesTranslation,
  buildOfertasLocalesTranslatableContent,
  hasOfertasLocalesTranslatableProse,
  requestOfertasLocalesAdTranslation,
} from "@/app/lib/ofertas-locales/ofertasLocalesTranslateAd";

/** No DB `original_language` column on ofertas_locales offers yet — same limitation every other
 * currently-wired category has. */
function inferOfertasLocalesOriginalLocale(): ContentLocale {
  return "unknown";
}

export function useOfertasLocalesPublicTranslation(
  offer: OfertaLocalPublicOfferDetail,
  lang: OfertasLocalesAppLang,
  listingKey: string,
): { displayOffer: OfertaLocalPublicOfferDetail; translateControl: ReactNode } {
  const [showTranslated, setShowTranslated] = useState(false);
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);

  const originalLocale = useMemo(() => inferOfertasLocalesOriginalLocale(), []);
  const translatableContent = useMemo(() => buildOfertasLocalesTranslatableContent(offer), [offer]);

  const offerTranslate = useMemo(() => {
    if (!hasOfertasLocalesTranslatableProse(translatableContent)) return false;
    if (shouldOfferTranslateAd({ siteLocale: lang, originalLocale })) return true;
    return originalLocale === "unknown";
  }, [lang, originalLocale, translatableContent]);

  const displayOffer = useMemo(() => {
    if (!showTranslated || !translation?.translated) return offer;
    return applyOfertasLocalesTranslation(offer, translation.translated);
  }, [offer, showTranslated, translation]);

  const onTranslated = useCallback((result: AdTranslationResult) => {
    setTranslation(result);
    setShowTranslated(true);
  }, []);

  const onShowOriginal = useCallback(() => {
    setShowTranslated(false);
  }, []);

  const translateControl = offerTranslate ? (
    <div className="flex justify-start" data-ofertas-locales-translate-ad="1">
      <TranslateAdControl
        siteLocale={lang}
        originalLocale={originalLocale}
        category="ofertas-locales"
        listingKey={listingKey}
        version="ofertas-locales-b04-v1"
        translatableContent={translatableContent}
        onTranslated={onTranslated}
        onShowOriginal={onShowOriginal}
        requestTranslation={requestOfertasLocalesAdTranslation}
        className="w-full sm:w-auto"
      />
    </div>
  ) : null;

  return { displayOffer, translateControl };
}

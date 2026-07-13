"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { shouldOfferTranslateAd } from "@/app/lib/translation/helpers";
import type { AdTranslationResult, ContentLocale } from "@/app/lib/translation/types";
import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import {
  applyServiciosTranslation,
  buildServiciosTranslatableContent,
  hasServiciosTranslatableProse,
  requestServiciosAdTranslation,
} from "../lib/serviciosTranslateAd";

export type ServiciosPublicTranslationState = {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  listingKey: string;
};

/** No DB `original_language` yet — listings default to unknown until publish pipeline stores locale. */
function inferServiciosOriginalLocale(_profile: ServiciosProfileResolved): ContentLocale {
  return "unknown";
}

/**
 * Servicios pilot (T4): session + server cache via TranslateAdControl; overlay only — source profile unchanged.
 */
export function useServiciosPublicTranslation({
  profile,
  lang,
  listingKey,
}: ServiciosPublicTranslationState): {
  displayProfile: ServiciosProfileResolved;
  translateControl: ReactNode;
} {
  const [showTranslated, setShowTranslated] = useState(false);
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);

  const originalLocale = useMemo(() => inferServiciosOriginalLocale(profile), [profile]);
  const translatableContent = useMemo(() => buildServiciosTranslatableContent(profile), [profile]);

  const offerTranslate = useMemo(() => {
    if (!hasServiciosTranslatableProse(translatableContent)) return false;
    if (shouldOfferTranslateAd({ siteLocale: lang, originalLocale })) return true;
    return originalLocale === "unknown";
  }, [lang, originalLocale, translatableContent]);

  const displayProfile = useMemo(() => {
    if (!showTranslated || !translation?.translated) return profile;
    return applyServiciosTranslation(profile, translation.translated);
  }, [profile, showTranslated, translation]);

  const onTranslated = useCallback((result: AdTranslationResult) => {
    setTranslation(result);
    setShowTranslated(true);
  }, []);

  const onShowOriginal = useCallback(() => {
    setShowTranslated(false);
  }, []);

  const translateControl = offerTranslate ? (
    <div className="flex justify-start" data-servicios-translate-ad="1">
      <TranslateAdControl
        siteLocale={lang}
        originalLocale={originalLocale}
        category="servicios"
        listingKey={listingKey}
        version="servicios-t4-v2"
        translatableContent={translatableContent}
        onTranslated={onTranslated}
        onShowOriginal={onShowOriginal}
        requestTranslation={requestServiciosAdTranslation}
        className="w-full sm:w-auto"
      />
    </div>
  ) : null;

  return { displayProfile, translateControl };
}

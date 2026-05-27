"use client";

import { useCallback, useMemo, useState } from "react";

import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import type { AdTranslationResult } from "@/app/lib/translation/types";
import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import {
  applyServiciosTranslation,
  buildServiciosTranslatableContent,
  hasServiciosTranslatableProse,
  requestServiciosAdTranslation,
} from "../lib/serviciosTranslateAd";

export type ServiciosPublicTranslationLayerProps = {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  listingKey: string;
  children: (
    displayProfile: ServiciosProfileResolved,
    translateControl: React.ReactNode,
  ) => React.ReactNode;
};

/**
 * Servicios pilot: session-only ad translation overlay.
 * `originalLocale` is unknown until listing language is stored — CTA still shows when prose exists.
 */
export function ServiciosPublicTranslationLayer({
  profile,
  lang,
  listingKey,
  children,
}: ServiciosPublicTranslationLayerProps) {
  const [showTranslated, setShowTranslated] = useState(false);
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);

  const translatableContent = useMemo(() => buildServiciosTranslatableContent(profile), [profile]);

  const offerTranslate = useMemo(
    () => (lang === "es" || lang === "en") && hasServiciosTranslatableProse(translatableContent),
    [lang, translatableContent],
  );

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
        originalLocale="unknown"
        category="servicios"
        listingKey={listingKey}
        version="servicios-t4-v1"
        translatableContent={translatableContent}
        onTranslated={onTranslated}
        onShowOriginal={onShowOriginal}
        requestTranslation={requestServiciosAdTranslation}
        className="w-full sm:w-auto"
      />
    </div>
  ) : null;

  return <>{children(displayProfile, translateControl)}</>;
}

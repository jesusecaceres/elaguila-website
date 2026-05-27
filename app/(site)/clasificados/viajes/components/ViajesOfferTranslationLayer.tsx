"use client";

import { useCallback, useMemo, useState } from "react";

import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { requestAdTranslation } from "@/app/lib/translation/requestAdTranslation";
import type { AdTranslationResult, Locale } from "@/app/lib/translation/types";
import type { ViajesOfferDetailModel } from "../data/viajesOfferDetailSampleData";
import {
  applyViajesTranslation,
  buildViajesTranslatableContent,
  normalizeViajesListingLang,
  shouldOfferViajesTranslateAd,
} from "../lib/viajesTranslateAd";

export type ViajesOfferTranslationLayerProps = {
  offer: ViajesOfferDetailModel;
  siteLocale: Locale;
  listingLang?: string | null;
  listingKey: string;
  children: (displayOffer: ViajesOfferDetailModel, translateControl: React.ReactNode) => React.ReactNode;
};

export function ViajesOfferTranslationLayer({
  offer,
  siteLocale,
  listingLang,
  listingKey,
  children,
}: ViajesOfferTranslationLayerProps) {
  const [showTranslated, setShowTranslated] = useState(false);
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);

  const sourceLocale = useMemo(() => normalizeViajesListingLang(listingLang), [listingLang]);
  const translatableContent = useMemo(() => buildViajesTranslatableContent(offer), [offer]);

  const offerTranslate = useMemo(
    () => shouldOfferViajesTranslateAd(siteLocale, sourceLocale, translatableContent),
    [siteLocale, sourceLocale, translatableContent],
  );

  const displayOffer = useMemo(() => {
    if (!showTranslated || !translation?.translated) return offer;
    return applyViajesTranslation(offer, translation.translated);
  }, [offer, showTranslated, translation]);

  const onTranslated = useCallback((result: AdTranslationResult) => {
    setTranslation(result);
    setShowTranslated(true);
  }, []);

  const onShowOriginal = useCallback(() => {
    setShowTranslated(false);
  }, []);

  const translateControl = offerTranslate ? (
    <div className="flex justify-start" data-viajes-translate-ad="1">
      <TranslateAdControl
        siteLocale={siteLocale}
        originalLocale={sourceLocale}
        category="viajes"
        listingKey={listingKey}
        version="viajes-t6-v1"
        translatableContent={translatableContent}
        onTranslated={onTranslated}
        onShowOriginal={onShowOriginal}
        requestTranslation={requestAdTranslation}
        className="w-full sm:w-auto"
      />
    </div>
  ) : null;

  return <>{children(displayOffer, translateControl)}</>;
}

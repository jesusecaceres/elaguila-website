"use client";

import { useCallback, useMemo, useState } from "react";

import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { requestAdTranslation } from "@/app/lib/translation/requestAdTranslation";
import type { AdTranslationResult, Locale } from "@/app/lib/translation/types";
import type { AutoDealerListing } from "../../negocios/types/autoDealerListing";
import {
  applyAutosTranslation,
  buildAutosTranslatableContent,
  normalizeAutosListingLang,
  shouldOfferAutosTranslateAd,
} from "../../lib/autosTranslateAd";

export type AutosListingTranslationLayerProps = {
  listing: AutoDealerListing;
  siteLocale: Locale;
  listingLang?: string | null;
  listingKey: string;
  children: (displayListing: AutoDealerListing, translateControl: React.ReactNode) => React.ReactNode;
};

export function AutosListingTranslationLayer({
  listing,
  siteLocale,
  listingLang,
  listingKey,
  children,
}: AutosListingTranslationLayerProps) {
  const [showTranslated, setShowTranslated] = useState(false);
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);

  const sourceLocale = useMemo(() => normalizeAutosListingLang(listingLang), [listingLang]);
  const translatableContent = useMemo(() => buildAutosTranslatableContent(listing), [listing]);

  const offerTranslate = useMemo(
    () => shouldOfferAutosTranslateAd(siteLocale, sourceLocale, translatableContent),
    [siteLocale, sourceLocale, translatableContent],
  );

  const displayListing = useMemo(() => {
    if (!showTranslated || !translation?.translated) return listing;
    return applyAutosTranslation(listing, translation.translated);
  }, [listing, showTranslated, translation]);

  const onTranslated = useCallback((result: AdTranslationResult) => {
    setTranslation(result);
    setShowTranslated(true);
  }, []);

  const onShowOriginal = useCallback(() => {
    setShowTranslated(false);
  }, []);

  const translateControl = offerTranslate ? (
    <div
      className="mx-auto flex max-w-[1280px] justify-start px-[max(1rem,env(safe-area-inset-left))] pt-3 pr-[max(1rem,env(safe-area-inset-right))]"
      data-autos-translate-ad="1"
    >
      <TranslateAdControl
        siteLocale={siteLocale}
        originalLocale={sourceLocale}
        category="autos"
        listingKey={listingKey}
        version="autos-t5-v1"
        translatableContent={translatableContent}
        onTranslated={onTranslated}
        onShowOriginal={onShowOriginal}
        requestTranslation={requestAdTranslation}
        className="w-full sm:w-auto"
      />
    </div>
  ) : null;

  return <>{children(displayListing, translateControl)}</>;
}

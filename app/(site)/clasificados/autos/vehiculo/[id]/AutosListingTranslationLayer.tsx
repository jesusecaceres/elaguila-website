"use client";

import { useCallback, useMemo, useState } from "react";

import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { requestAdTranslation } from "@/app/lib/translation/requestAdTranslation";
import type { AdTranslationResult, ContentLocale, Locale } from "@/app/lib/translation/types";
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
  /**
   * `adDisplayLang` (3rd render-prop arg) is the effective language of the COMPLETE ad-local
   * experience — distinct from `siteLocale` (global Leonix nav/chrome, unaffected by this).
   * ORIGINAL state: the ad's own real authored language when known (an English-authored ad
   * stays English-chrome even on a Spanish-site visit, until translated — never a fabricated
   * mixed state of English prose inside Spanish-labeled sections). TRANSLATED state: the actual
   * target the buyer just translated into. Callers must re-provide their locale context with
   * this value for every ad-local descendant (gallery, Business Hub, finance, hours, specs,
   * description, equipment, trust/map, related inventory, bottom nav) — see Servicios'
   * equivalent `displayLang` doctrine.
   */
  children: (
    displayListing: AutoDealerListing,
    translateControl: React.ReactNode,
    adDisplayLang: Locale,
  ) => React.ReactNode;
};

/**
 * Pure computation extracted for verifier execution (Gate 13). See the `children` doc comment
 * above for the full contract. `translation` only needs the two locale fields, not the whole
 * `AdTranslationResult` shape, so a verifier can construct a minimal fixture.
 */
export function computeAutosAdDisplayLang(params: {
  showTranslated: boolean;
  translation: Pick<AdTranslationResult, "targetLocale" | "effectiveTargetLocale"> | null;
  sourceLocale: ContentLocale;
  siteLocale: Locale;
}): Locale {
  if (params.showTranslated && params.translation) {
    return params.translation.effectiveTargetLocale ?? params.translation.targetLocale;
  }
  return params.sourceLocale === "es" || params.sourceLocale === "en" ? params.sourceLocale : params.siteLocale;
}

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

  const adDisplayLang: Locale = useMemo(
    () => computeAutosAdDisplayLang({ showTranslated, translation, sourceLocale, siteLocale }),
    [showTranslated, translation, sourceLocale, siteLocale],
  );

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
        // v1 -> v2: buildAutosTranslatableContent gained serviceLabel (finance advisor title) /
        // highlights (finance notes). v2 -> v3 (2026-09-16): gained customServiceText (dealer
        // custom-link labels) / shareText (special-hours label+note). v3 -> v4 (2026-09-16):
        // gained locationNote (the dealer address's trailing human note, e.g. "showroom con 18
        // plazas de estacionamiento para clientes" — the address identity prefix itself is never
        // sent). v4 -> v5 (2026-09-17): gained financeTeaser (the free-typed monthly-estimate
        // sentence, e.g. "Desde $689/mes a 60 meses..." — previously never translated, so it
        // stayed in the dealer's authored language even after Translate). Each bump forces a
        // fresh request so a stale cached response can never silently present as a
        // now-more-complete translation; does not affect any other category's cache.
        version="autos-t6-v5"
        translatableContent={translatableContent}
        onTranslated={onTranslated}
        onShowOriginal={onShowOriginal}
        requestTranslation={requestAdTranslation}
        className="w-full sm:w-auto"
      />
    </div>
  ) : null;

  return <>{children(displayListing, translateControl, adDisplayLang)}</>;
}

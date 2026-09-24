"use client";

import { useCallback, useMemo, useState } from "react";
import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { requestAdTranslation } from "@/app/lib/translation/requestAdTranslation";
import type { AdTranslationResult, TranslatableAdFields } from "@/app/lib/translation/types";
import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import type { RentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import { RentasResultCard } from "./RentasResultCard";

export function RentasTranslatedResultCard({
  listing,
  copy,
  lang,
}: {
  listing: RentasPublicListing;
  copy: RentasLandingCopy;
  lang: RentasLandingLang;
}) {
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);

  const title = listing.title.trim();
  const translatableContent = useMemo<TranslatableAdFields>(
    () => (title ? { title } : {}),
    [title],
  );

  const onTranslated = useCallback((result: AdTranslationResult) => {
    setTranslation(result);
    setShowTranslated(true);
  }, []);

  const onShowOriginal = useCallback(() => {
    setShowTranslated(false);
  }, []);

  const translatedTitle =
    showTranslated && translation?.translated.title?.trim()
      ? translation.translated.title.trim()
      : listing.title;

  const displayListing: RentasPublicListing =
    translatedTitle !== listing.title ? { ...listing, title: translatedTitle } : listing;

  return (
    <div className="relative min-w-0">
      {title ? (
        <div className="absolute right-2 top-2 z-10" data-rentas-results-translate-ad="1">
          <TranslateAdControl
            siteLocale={lang}
            originalLocale="unknown"
            category="rentas"
            listingKey={listing.leonixAdId?.trim() || listing.id}
            version="rentas-results-card-v1"
            translatableContent={translatableContent}
            onTranslated={onTranslated}
            onShowOriginal={onShowOriginal}
            requestTranslation={requestAdTranslation}
          />
        </div>
      ) : null}
      <RentasResultCard listing={displayListing} copy={copy} lang={lang} />
    </div>
  );
}

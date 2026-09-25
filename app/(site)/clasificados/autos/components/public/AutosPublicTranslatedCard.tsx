"use client";

import { useCallback, useMemo, useState } from "react";
import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { requestAdTranslation } from "@/app/lib/translation/requestAdTranslation";
import type { AdTranslationResult, TranslatableAdFields } from "@/app/lib/translation/types";
import type { AutosPublicListing } from "../../data/autosPublicSampleTypes";
import type { AutosPublicBlueprintCopy, AutosPublicLang } from "../../lib/autosPublicBlueprintCopy";
import { AutosPublicStandardCard } from "./AutosPublicStandardCard";

/**
 * Results-only translation utility.
 *
 * Autos card identity/specs are structured taxonomy and already localize deterministically.
 * We offer Translate Ad only when the public card contains owner-authored prose (today:
 * monthlyEstimate / finance teaser), keeping the core card outside the ad-local translation
 * context required by the Autos bilingual architecture verifier.
 */
export function AutosPublicTranslatedCard({
  listing,
  copy,
  lang,
}: {
  listing: AutosPublicListing;
  copy: AutosPublicBlueprintCopy;
  lang: AutosPublicLang;
}) {
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);

  const financeTeaser = listing.monthlyEstimate?.trim() ?? "";
  const translatableContent = useMemo<TranslatableAdFields>(
    () => (financeTeaser ? { financeTeaser } : {}),
    [financeTeaser],
  );

  const onTranslated = useCallback((result: AdTranslationResult) => {
    setTranslation(result);
    setShowTranslated(true);
  }, []);

  const onShowOriginal = useCallback(() => {
    setShowTranslated(false);
  }, []);

  const translatedFinanceTeaser =
    showTranslated && translation?.translated.financeTeaser?.trim()
      ? translation.translated.financeTeaser.trim()
      : listing.monthlyEstimate;

  const displayListing: AutosPublicListing =
    translatedFinanceTeaser && translatedFinanceTeaser !== listing.monthlyEstimate
      ? { ...listing, monthlyEstimate: translatedFinanceTeaser }
      : listing;

  // PRODUCTION LAYOUT PARITY. The results grid (AutosPublicResultsShell) stretches each grid item to the
  // row height, so the card root itself must BE the grid item. A card with no owner-authored teaser has
  // nothing to translate, so it renders exactly as before (no wrapper element at all). A card that does
  // carry a teaser gets the translate utility above it in a full-height column whose card slot grows,
  // so equal-height rows are preserved there too.
  if (!financeTeaser) {
    return <AutosPublicStandardCard listing={displayListing} copy={copy} lang={lang} />;
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      {financeTeaser ? (
        <div className="mb-2 flex justify-end" data-autos-results-translate-utility="1">
          <TranslateAdControl
            siteLocale={lang}
            originalLocale="unknown"
            category="autos"
            listingKey={listing.id}
            version="autos-results-card-v1"
            translatableContent={translatableContent}
            onTranslated={onTranslated}
            onShowOriginal={onShowOriginal}
            requestTranslation={requestAdTranslation}
          />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col [&>a]:flex-1">
        <AutosPublicStandardCard listing={displayListing} copy={copy} lang={lang} />
      </div>
    </div>
  );
}

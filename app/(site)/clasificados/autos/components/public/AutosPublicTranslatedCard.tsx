"use client";

import { useCallback, useMemo, useState } from "react";
import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { requestAdTranslation } from "@/app/lib/translation/requestAdTranslation";
import type { AdTranslationResult } from "@/app/lib/translation/types";
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
  const translatableContent = useMemo(
    () => ({ financeTeaser: financeTeaser || undefined }),
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

  const displayListing =
    translatedFinanceTeaser === listing.monthlyEstimate
      ? listing
      : { ...listing, monthlyEstimate: translatedFinanceTeaser };

  return (
    <div className="min-w-0">
      {financeTeaser ? (
        <div className="mb-2 flex justify-end" data-autos-results-translate-utility="1">
          <TranslateAdControl
            siteLocale={lang}
            originalLocale={listing.sourceLang ?? "unknown"}
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
      <AutosPublicStandardCard listing={displayListing} copy={copy} lang={lang} />
    </div>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";
import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { requestAdTranslation } from "@/app/lib/translation/requestAdTranslation";
import type { AdTranslationResult, TranslatableAdFields } from "@/app/lib/translation/types";
import type { ViajesUi } from "../data/viajesUiCopy";
import type { ViajesBusinessResult } from "../data/viajesResultsSampleData";
import { ViajesResultsBusinessCard } from "./ViajesResultsBusinessCard";

export function ViajesTranslatedBusinessCard({
  row,
  ui,
}: {
  row: ViajesBusinessResult;
  ui: ViajesUi;
}) {
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);

  const title = row.offerTitle.trim();
  const included = row.includedSummary.trim();
  const ctaHint = row.ctaHint?.trim() ?? "";

  const translatableContent = useMemo<TranslatableAdFields>(
    () => ({
      title: title || undefined,
      description: included || undefined,
      notes: ctaHint || undefined,
    }),
    [title, included, ctaHint],
  );

  const onTranslated = useCallback((result: AdTranslationResult) => {
    setTranslation(result);
    setShowTranslated(true);
  }, []);

  const onShowOriginal = useCallback(() => {
    setShowTranslated(false);
  }, []);

  const displayRow: ViajesBusinessResult =
    showTranslated && translation?.translated
      ? {
          ...row,
          offerTitle: translation.translated.title?.trim() || row.offerTitle,
          includedSummary: translation.translated.description?.trim() || row.includedSummary,
          ctaHint: translation.translated.notes?.trim() || row.ctaHint,
        }
      : row;

  return (
    <div className="min-w-0">
      {title || included || ctaHint ? (
        <div className="mb-2 flex justify-end" data-viajes-results-translate-ad="1">
          <TranslateAdControl
            siteLocale={ui.lang}
            originalLocale="unknown"
            category="viajes"
            listingKey={row.id}
            version="viajes-results-business-v1"
            translatableContent={translatableContent}
            onTranslated={onTranslated}
            onShowOriginal={onShowOriginal}
            requestTranslation={requestAdTranslation}
          />
        </div>
      ) : null}
      <ViajesResultsBusinessCard row={displayRow} ui={ui} />
    </div>
  );
}

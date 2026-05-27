"use client";

import { useCallback, useMemo, useState } from "react";

import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { requestAdTranslation } from "@/app/lib/translation/requestAdTranslation";
import type { AdTranslationResult, Locale } from "@/app/lib/translation/types";
import type { EmpleosJobRecord } from "../data/empleosJobTypes";
import {
  applyEmpleosTranslation,
  buildEmpleosTranslatableContent,
  normalizeEmpleosListingLang,
  shouldOfferEmpleosTranslateAd,
} from "../lib/empleosTranslateAd";

export type EmpleosJobTranslationLayerProps = {
  job: EmpleosJobRecord;
  siteLocale: Locale;
  listingLang?: string | null;
  listingKey: string;
  children: (displayJob: EmpleosJobRecord, translateControl: React.ReactNode) => React.ReactNode;
};

export function EmpleosJobTranslationLayer({
  job,
  siteLocale,
  listingLang,
  listingKey,
  children,
}: EmpleosJobTranslationLayerProps) {
  const [showTranslated, setShowTranslated] = useState(false);
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);

  const sourceLocale = useMemo(() => normalizeEmpleosListingLang(listingLang), [listingLang]);
  const translatableContent = useMemo(() => buildEmpleosTranslatableContent(job), [job]);

  const offerTranslate = useMemo(
    () => shouldOfferEmpleosTranslateAd(siteLocale, sourceLocale, translatableContent),
    [siteLocale, sourceLocale, translatableContent],
  );

  const displayJob = useMemo(() => {
    if (!showTranslated || !translation?.translated) return job;
    return applyEmpleosTranslation(job, translation.translated);
  }, [job, showTranslated, translation]);

  const onTranslated = useCallback((result: AdTranslationResult) => {
    setTranslation(result);
    setShowTranslated(true);
  }, []);

  const onShowOriginal = useCallback(() => {
    setShowTranslated(false);
  }, []);

  const translateControl = offerTranslate ? (
    <div className="flex justify-start" data-empleos-translate-ad="1">
      <TranslateAdControl
        siteLocale={siteLocale}
        originalLocale={sourceLocale}
        category="empleos"
        listingKey={listingKey}
        version="empleos-t5-v1"
        translatableContent={translatableContent}
        onTranslated={onTranslated}
        onShowOriginal={onShowOriginal}
        requestTranslation={requestAdTranslation}
        className="w-full sm:w-auto"
      />
    </div>
  ) : null;

  return <>{children(displayJob, translateControl)}</>;
}

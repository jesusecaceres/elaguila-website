"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { requestAdTranslation } from "@/app/lib/translation/requestAdTranslation";
import type { AdTranslationResult } from "@/app/lib/translation/types";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";

export function useBienesRaicesCardTranslation(input: {
  listingId: string;
  title: string;
  lang?: Lang;
}): { displayTitle: string; translateControl: ReactNode } {
  const lang = input.lang === "en" ? "en" : "es";
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);

  const translatableContent = useMemo(
    () => ({ title: input.title.trim() || undefined }),
    [input.title],
  );

  const onTranslated = useCallback((result: AdTranslationResult) => {
    setTranslation(result);
    setShowTranslated(true);
  }, []);

  const onShowOriginal = useCallback(() => {
    setShowTranslated(false);
  }, []);

  const displayTitle =
    showTranslated && translation?.translated.title?.trim()
      ? translation.translated.title.trim()
      : input.title;

  const translateControl = input.title.trim() ? (
    <TranslateAdControl
      siteLocale={lang}
      originalLocale="unknown"
      category="bienes-raices"
      listingKey={input.listingId}
      version="bienes-raices-card-v1"
      translatableContent={translatableContent}
      onTranslated={onTranslated}
      onShowOriginal={onShowOriginal}
      requestTranslation={requestAdTranslation}
      className="shrink-0"
    />
  ) : null;

  return { displayTitle, translateControl };
}

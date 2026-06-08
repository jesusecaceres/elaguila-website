"use client";

import { useCallback, useMemo, useState } from "react";

import type { AdTranslationResult, ContentLocale, Locale } from "@/app/lib/translation/types";
import type { TranslateAdProviderFn } from "@/app/lib/translation/provider";
import {
  buildTranslateCacheKey,
  getCachedAdTranslation,
  maskTranslatableFields,
  pickTranslatableAdFields,
  setCachedAdTranslation,
  unmaskTranslatableFields,
} from "@/app/lib/translation/helpers";

export type TranslateAdControlLabels = {
  translateAd: string;
  showOriginal: string;
  translating: string;
  error: string;
  unavailable: string;
};

const DEFAULT_LABELS: Partial<Record<Locale, TranslateAdControlLabels>> = {
  es: {
    translateAd: "Traducir anuncio",
    showOriginal: "Ver original",
    translating: "Traduciendo…",
    error: "Traducción no disponible. Inténtalo de nuevo.",
    unavailable: "Traducción no disponible.",
  },
  en: {
    translateAd: "Translate ad",
    showOriginal: "Show original",
    translating: "Translating…",
    error: "Translation unavailable. Try again.",
    unavailable: "Translation unavailable.",
  },
};

export type TranslateAdControlProps = {
  siteLocale: Locale;
  originalLocale?: ContentLocale;
  category: string;
  listingKey: string;
  /** Bump when masking rules change — avoids stale session cache */
  version?: string;
  translatableContent: unknown;
  onTranslated: (result: AdTranslationResult) => void;
  onShowOriginal: () => void;
  requestTranslation?: TranslateAdProviderFn;
  disabled?: boolean;
  className?: string;
  labels?: Partial<TranslateAdControlLabels>;
};

type ViewMode = "original" | "translated";

/**
 * User-triggered control for optional ad prose translation (foundation only — no default API).
 */
export function TranslateAdControl({
  siteLocale,
  originalLocale = "unknown",
  category,
  listingKey,
  version,
  translatableContent,
  onTranslated,
  onShowOriginal,
  requestTranslation,
  disabled = false,
  className = "",
  labels: labelsOverride,
}: TranslateAdControlProps) {
  const labels = useMemo((): TranslateAdControlLabels => {
    const base = DEFAULT_LABELS[siteLocale] ?? DEFAULT_LABELS.en ?? DEFAULT_LABELS.es!;
    return { ...base, ...labelsOverride };
  }, [siteLocale, labelsOverride]);

  const [viewMode, setViewMode] = useState<ViewMode>("original");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = useMemo(
    () =>
      buildTranslateCacheKey({
        category,
        listingKey,
        sourceLocale: originalLocale,
        targetLocale: siteLocale,
        version,
      }),
    [category, listingKey, originalLocale, siteLocale, version],
  );

  const runTranslate = useCallback(async () => {
    setError(null);
    const picked = pickTranslatableAdFields(translatableContent);
    if (Object.keys(picked).length === 0) {
      setError(labels.unavailable);
      return;
    }

    const cached = getCachedAdTranslation(cacheKey);
    if (cached?.translated && cached.targetLocale === siteLocale) {
      onTranslated({
        ...cached,
        fromCache: true,
      });
      setViewMode("translated");
      return;
    }

    if (!requestTranslation) {
      setError(labels.unavailable);
      return;
    }

    setBusy(true);
    try {
      const { fields: maskedFields, fieldMaps } = maskTranslatableFields(picked);

      const rawResult = await requestTranslation({
        maskedFields,
        category,
        listingKey,
        sourceLocale: originalLocale,
        targetLocale: siteLocale,
      });

      const restoredTranslated = unmaskTranslatableFields(rawResult.translated, fieldMaps);

      const result: AdTranslationResult = {
        ...rawResult,
        translated: restoredTranslated,
        fromCache: false,
      };

      setCachedAdTranslation(cacheKey, result);
      onTranslated(result);
      setViewMode("translated");
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }, [
    translatableContent,
    cacheKey,
    siteLocale,
    originalLocale,
    category,
    listingKey,
    labels.error,
    labels.unavailable,
    onTranslated,
    requestTranslation,
  ]);

  const showOriginal = useCallback(() => {
    setError(null);
    setViewMode("original");
    onShowOriginal();
  }, [onShowOriginal]);

  const onPrimaryClick = () => {
    if (disabled || busy) return;
    if (viewMode === "translated") {
      showOriginal();
      return;
    }
    void runTranslate();
  };

  const primaryLabel =
    busy ? labels.translating : viewMode === "translated" ? labels.showOriginal : labels.translateAd;

  const ariaBusy = busy;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <button
        type="button"
        onClick={onPrimaryClick}
        disabled={disabled || busy}
        aria-busy={ariaBusy}
        className={`
          inline-flex w-fit max-w-full items-center justify-center rounded-full px-4 py-2 text-sm font-medium
          bg-white text-[#1A1A1A] border border-[#D4A574]
          hover:bg-[#FFFAF0] transition-all duration-200
          disabled:opacity-60 disabled:cursor-not-allowed
        `}
      >
        {primaryLabel}
      </button>
      {error ? (
        <p className="text-sm text-red-700" role="status">
          {error}
        </p>
      ) : null}
    </div>
  );
}

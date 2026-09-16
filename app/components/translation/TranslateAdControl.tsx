"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiGlobe } from "react-icons/fi";

import type { AdTranslationResult, ContentLocale, Locale } from "@/app/lib/translation/types";
import type { TranslateAdProviderFn } from "@/app/lib/translation/provider";
import {
  buildTranslateCacheKey,
  clearCachedAdTranslation,
  getCachedAdTranslation,
  maskTranslatableFields,
  pickTranslatableAdFields,
  setCachedAdTranslation,
  unmaskTranslatableFields,
} from "@/app/lib/translation/helpers";
import type { TranslatableAdFields } from "@/app/lib/translation/types";
import { buildDetectionSample, planUnknownSourceTranslation } from "@/app/lib/translation/unknownSourcePolicy";
import { guessContentLocaleHeuristically } from "@/app/lib/translation/localLanguageGuess";

/**
 * True when every translated field is byte-identical (after trim) to the source it was built
 * from — i.e. the provider echoed the content back because it was already in the target language.
 * Exported for verifiers.
 */
export function isNoOpTranslation(source: TranslatableAdFields, translated: TranslatableAdFields): boolean {
  const keys = Object.keys(translated) as Array<keyof TranslatableAdFields>;
  if (keys.length === 0) return true;
  return keys.every((key) => (translated[key] ?? "").trim() === (source[key] ?? "").trim());
}

export type TranslateAdControlLabels = {
  translateAd: string;
  showOriginal: string;
  translating: string;
  error: string;
  unavailable: string;
};

/**
 * Global translate-control label repair (2026-09-16) — owner-found defect: "Traducir anuncio" /
 * "Ver original" name neither the destination nor the source language, so a viewer who cannot
 * read the source language has no way to discover what the control actually does. The control's
 * whole purpose is to help exactly that viewer.
 *
 * Doctrine: SOURCE CONTENT LANGUAGE and VIEWER UI LANGUAGE are separate. The action always
 * translates INTO `siteLocale` (never the reverse), so the "Translate" label can always safely
 * name the destination language — it's simply the site's own current locale, no lookup needed.
 * "View original" additionally names the actual source language when it's known
 * (`originalLocale !== "unknown"`), resolved via resolveOriginalLanguageName below — never
 * fabricated when unknown.
 */
const DEFAULT_LABELS: Partial<Record<Locale, TranslateAdControlLabels>> = {
  es: {
    translateAd: "Traducir al español",
    showOriginal: "Ver original",
    translating: "Traduciendo…",
    error: "Traducción no disponible. Inténtalo de nuevo.",
    unavailable: "Traducción no disponible.",
  },
  en: {
    translateAd: "Translate to English",
    showOriginal: "View original",
    translating: "Translating…",
    error: "Translation unavailable. Try again.",
    unavailable: "Translation unavailable.",
  },
};

/**
 * `Intl.DisplayNames` is the browser's own CLDR language-name database (already correctly cased
 * per locale convention — English capitalizes language names, Spanish doesn't), so this never
 * hand-maintains a translation table and never needs updating as new locales are added to the
 * catalog. Returns null — never a fabricated or best-guess name — whenever the lookup fails for
 * any reason (unsupported runtime, unrecognized code).
 */
function languageDisplayName(locale: ContentLocale, inLocale: Locale): string | null {
  if (locale === "unknown") return null;
  try {
    const displayNames = new Intl.DisplayNames([inLocale], { type: "language" });
    const name = displayNames.of(locale);
    return name && name.trim() && name !== locale ? name : null;
  } catch {
    return null;
  }
}

/**
 * The source content's language, localized into the viewer's own site locale — e.g. "Spanish" for
 * an English-UI viewer, "inglés" for a Spanish-UI viewer. Returns null — never a fabricated or
 * best-guess name — whenever the source locale is genuinely unknown or equals `siteLocale` (would
 * read as a redundant "(Spanish)" while already on the Spanish site).
 */
export function resolveOriginalLanguageName(originalLocale: ContentLocale, siteLocale: Locale): string | null {
  if (originalLocale === "unknown" || originalLocale === siteLocale) return null;
  return languageDisplayName(originalLocale, siteLocale);
}

const TRANSLATE_VERB: Partial<Record<Locale, string>> = {
  es: "Traducir al",
  en: "Translate to",
};

/** "Traducir al inglés" / "Translate to Spanish" — names the ACTUAL destination, not just siteLocale. */
function buildTranslateToLabel(uiLocale: Locale, targetLocale: Locale): string | null {
  const verb = TRANSLATE_VERB[uiLocale];
  if (!verb) return null;
  const name = languageDisplayName(targetLocale, uiLocale);
  return name ? `${verb} ${name}` : null;
}

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
  const isUnknownSource = originalLocale === "unknown";

  const [viewMode, setViewMode] = useState<ViewMode>("original");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Real, server-proven metadata from the last completed translation (this session), either from
  // a live click or a prior sessionStorage cache hit for the same cache key — never a network call
  // by itself. Known-source categories (Autos, etc.) never populate `detectedSourceLocale` /
  // `effectiveTargetLocale` server-side, so this only changes behavior for unknown-source (Servicios).
  const [lastKnownResult, setLastKnownResult] = useState<AdTranslationResult | null>(null);

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

  // Pure local sessionStorage read (no network) — deferred to an effect so server/client first
  // paint match (sessionStorage is client-only); refreshes whenever the request shape changes.
  useEffect(() => {
    setLastKnownResult(getCachedAdTranslation(cacheKey));
  }, [cacheKey]);

  // Best-effort, zero-network PREDICTION of the effective target for unknown-source content,
  // reusing the SAME locked retargeting policy the server applies (`planUnknownSourceTranslation`)
  // — never a separately hand-written guess. Only the content-language GUESS feeding it is new;
  // the server's own real detection remains authoritative at click time and may differ, in which
  // case the real result (captured below) immediately corrects the label.
  const predictedEffectiveTargetLocale = useMemo((): Locale => {
    if (!isUnknownSource) return siteLocale;
    const sample = buildDetectionSample(pickTranslatableAdFields(translatableContent));
    const guess = guessContentLocaleHeuristically(sample);
    return planUnknownSourceTranslation(siteLocale, guess).targetLocale;
  }, [isUnknownSource, siteLocale, translatableContent]);

  // Known-source categories (Autos, etc.) always translate into siteLocale — unchanged. Unknown-
  // source (Servicios) prefers REAL data (a completed translation this session, live or cached)
  // over the heuristic prediction.
  const effectiveTargetLocale = useMemo((): Locale => {
    if (!isUnknownSource) return siteLocale;
    return lastKnownResult?.effectiveTargetLocale ?? lastKnownResult?.targetLocale ?? predictedEffectiveTargetLocale;
  }, [isUnknownSource, siteLocale, lastKnownResult, predictedEffectiveTargetLocale]);

  // The REAL detected source language once known (never a guess) — falls back to the static prop
  // (unchanged for known-source categories, where the server never sets `detectedSourceLocale`).
  const effectiveOriginalLocale = useMemo(
    (): ContentLocale => lastKnownResult?.detectedSourceLocale ?? originalLocale,
    [lastKnownResult, originalLocale],
  );

  const labels = useMemo((): TranslateAdControlLabels => {
    const base = DEFAULT_LABELS[siteLocale] ?? DEFAULT_LABELS.en ?? DEFAULT_LABELS.es!;
    const translateAdLabel = buildTranslateToLabel(siteLocale, effectiveTargetLocale) ?? base.translateAd;
    // Suppressed only when the original equals what's CURRENTLY on screen (redundant otherwise) —
    // for known-source, effectiveTargetLocale === siteLocale always, so this is byte-identical to
    // the prior `resolveOriginalLanguageName(originalLocale, siteLocale)` behavior.
    const originalName =
      effectiveOriginalLocale === "unknown" || effectiveOriginalLocale === effectiveTargetLocale
        ? null
        : languageDisplayName(effectiveOriginalLocale, siteLocale);
    const contextual: TranslateAdControlLabels = {
      ...base,
      translateAd: translateAdLabel,
      showOriginal: originalName ? `${base.showOriginal} (${originalName})` : base.showOriginal,
    };
    return { ...contextual, ...labelsOverride };
  }, [siteLocale, effectiveTargetLocale, effectiveOriginalLocale, labelsOverride]);

  const runTranslate = useCallback(async () => {
    setError(null);
    const picked = pickTranslatableAdFields(translatableContent);
    if (Object.keys(picked).length === 0) {
      setError(labels.unavailable);
      return;
    }

    // Servicios Live Launch Perfection ⚠️33 (2026-09-14) — a cached result whose text is identical
    // to the source is an ECHO (content already in the requested language), not a translation.
    // Replaying it would flip the control to "Ver original" with nothing changed and no request.
    const cached = getCachedAdTranslation(cacheKey);
    if (cached?.translated && cached.targetLocale === siteLocale) {
      if (isNoOpTranslation(picked, cached.translated)) {
        clearCachedAdTranslation(cacheKey);
        setLastKnownResult(null);
      } else {
        onTranslated({
          ...cached,
          fromCache: true,
        });
        setLastKnownResult(cached);
        setViewMode("translated");
        return;
      }
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

      // ⚠️33 — never present an echo as a translation, and never cache it.
      if (isNoOpTranslation(picked, restoredTranslated)) {
        setError(labels.unavailable);
        return;
      }

      setCachedAdTranslation(cacheKey, result);
      onTranslated(result);
      setLastKnownResult(result);
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
          inline-flex w-fit max-w-full items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium
          bg-white text-[#1A1A1A] border border-[#D4A574]
          hover:bg-[#FFFAF0] transition-all duration-200
          disabled:opacity-60 disabled:cursor-not-allowed
        `}
      >
        <FiGlobe className="h-4 w-4 shrink-0" aria-hidden />
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

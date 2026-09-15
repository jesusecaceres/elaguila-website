"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { shouldOfferTranslateAd } from "@/app/lib/translation/helpers";
import type { AdTranslationResult, ContentLocale } from "@/app/lib/translation/types";
import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import {
  applyServiciosTranslation,
  buildServiciosTranslatableContent,
  hasServiciosTranslatableProse,
  requestServiciosAdTranslation,
} from "../lib/serviciosTranslateAd";

export type ServiciosPublicTranslationState = {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  listingKey: string;
};

/** No DB `original_language` yet — listings default to unknown until publish pipeline stores locale. */
function inferServiciosOriginalLocale(_profile: ServiciosProfileResolved): ContentLocale {
  return "unknown";
}

/**
 * Servicios pilot (T4): session + server cache via TranslateAdControl; overlay only — source profile unchanged.
 */
export function useServiciosPublicTranslation({
  profile,
  lang,
  listingKey,
}: ServiciosPublicTranslationState): {
  displayProfile: ServiciosProfileResolved;
  translateControl: ReactNode;
  /**
   * ⚠️37 / Owner QA 914 — the locale of the COMPLETE AD-LOCAL EXPERIENCE currently displayed: the
   * effective translation target while translated, the page locale otherwise. Every listing-local
   * section (headings, catalog labels, generated summary, contact/media/quote-modal chrome) now
   * follows this, not `lang` — only GLOBAL site chrome outside the listing (site nav, the Translate
   * Ad control itself) stays on `lang` so a viewer can always find their way back to the original.
   */
  displayLang: ServiciosLang;
} {
  const [showTranslated, setShowTranslated] = useState(false);
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);

  const originalLocale = useMemo(() => inferServiciosOriginalLocale(profile), [profile]);
  const translatableContent = useMemo(() => buildServiciosTranslatableContent(profile), [profile]);

  const offerTranslate = useMemo(() => {
    if (!hasServiciosTranslatableProse(translatableContent)) return false;
    if (shouldOfferTranslateAd({ siteLocale: lang, originalLocale })) return true;
    return originalLocale === "unknown";
  }, [lang, originalLocale, translatableContent]);

  const translatedLang = useMemo<ServiciosLang>(() => {
    const effective = translation?.effectiveTargetLocale ?? translation?.targetLocale;
    return effective === "en" ? "en" : effective === "es" ? "es" : lang;
  }, [translation, lang]);

  const displayProfile = useMemo(() => {
    if (!showTranslated || !translation?.translated) return profile;
    return applyServiciosTranslation(profile, translation.translated, translatedLang);
  }, [profile, showTranslated, translation, translatedLang]);

  const displayLang: ServiciosLang = showTranslated && translation?.translated ? translatedLang : lang;

  const onTranslated = useCallback((result: AdTranslationResult) => {
    setTranslation(result);
    setShowTranslated(true);
  }, []);

  const onShowOriginal = useCallback(() => {
    setShowTranslated(false);
  }, []);

  const translateControl = offerTranslate ? (
    <div className="flex justify-start" data-servicios-translate-ad="1">
      <TranslateAdControl
        siteLocale={lang}
        originalLocale={originalLocale}
        category="servicios"
        listingKey={listingKey}
        // Owner QA 914 (2026-09-14): bumped v3 → v4. Owner QA proved a live listing was replaying
        // a GARBLED translated body/highlights response (the tab-marker tokens "qf 1"/"tr 4"/"cp 0"
        // rendered as visible text inside a quick-fact/highlight chip) — the exact shape produced by
        // the pre-a9e8044a tab-and-newline body protocol, whose HTML-record replacement changed the
        // WIRE FORMAT of that response without changing this version string, so a session that
        // cached the broken reply under v3 kept replaying it forever. v4 forces a fresh fetch from
        // the fixed engine (proven correct live: reproduced the exact 5-, and separately 10-,
        // record body/highlights payload against production and got well-formed output both times).
        // Same reasoning as the ⚠️33 v1→v2 and v2→v3 bumps before it.
        version="servicios-t4-v4"
        translatableContent={translatableContent}
        onTranslated={onTranslated}
        onShowOriginal={onShowOriginal}
        requestTranslation={requestServiciosAdTranslation}
        className="w-full sm:w-auto"
      />
    </div>
  ) : null;

  return { displayProfile, translateControl, displayLang };
}

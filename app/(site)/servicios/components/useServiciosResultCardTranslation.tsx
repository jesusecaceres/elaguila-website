"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import type { AdTranslationResult } from "@/app/lib/translation/types";
import { oppositeActiveTranslateLocale } from "@/app/lib/translation/unknownSourcePolicy";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import {
  applyServiciosCardTranslation,
  buildServiciosCardTranslatableContent,
  hasServiciosTranslatableProse,
  requestServiciosAdTranslation,
  type ServiciosCardTranslatableInput,
} from "../lib/serviciosTranslateAd";

const TRANSLATE_VERB: Record<ServiciosLang, string> = { es: "Traducir al", en: "Translate to" };
const SHOW_ORIGINAL_VERB: Record<ServiciosLang, string> = { es: "Ver original", en: "View original" };

function languageName(locale: ServiciosLang, inLocale: ServiciosLang): string {
  try {
    const name = new Intl.DisplayNames([inLocale], { type: "language" }).of(locale);
    return name && name.trim() ? name : locale;
  } catch {
    return locale;
  }
}

/**
 * Zero-network toggle for cards whose only translatable surface is CANONICAL Leonix preset
 * content (category/service/trust/quick-fact labels) — these always have real ES/EN catalog
 * labels, so there is nothing to send to a translation provider; clicking this just flips which
 * catalog label the caller renders (`displayLang`). Same label doctrine as the real
 * TranslateAdControl (verb + destination language name; "Ver original (X)" once toggled), built
 * locally since there is no request/response cycle to drive it.
 */
function ServiciosCanonicalOnlyTranslateToggle({
  lang,
  showTranslated,
  onToggle,
}: {
  lang: ServiciosLang;
  showTranslated: boolean;
  onToggle: () => void;
}) {
  // `oppositeActiveTranslateLocale` is typed for the full Translate Ad target catalog, but always
  // returns "es"|"en" when given "es"|"en" (Servicios' only two active site locales).
  const target = oppositeActiveTranslateLocale(lang) as ServiciosLang;
  const label = showTranslated
    ? `${SHOW_ORIGINAL_VERB[lang]} (${languageName(lang, lang)})`
    : `${TRANSLATE_VERB[lang]} ${languageName(target, lang)}`;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex w-fit max-w-full shrink-0 items-center justify-center gap-1.5 rounded-full border border-[#D4A574] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] transition-all duration-200 hover:bg-[#FFFAF0]"
    >
      {label}
    </button>
  );
}

/**
 * Servicios Results-Card Translate — coherent full-card language repair (2026-09-17).
 *
 * Owner runtime QA proved a card could end up MIXED-LANGUAGE after translating: only the
 * owner-authored chips flipped language (the old contract), while CANONICAL Leonix preset chips
 * (already relabeled to `lang` at render time via `relabelServiciosCanonicalPresets`) never
 * budged. Root cause: this hook only ever exposed an owner-text overlay (`chipOverrides`), never
 * a unified DISPLAY LANGUAGE the caller could re-relabel canonical content against.
 *
 * Fix: expose `displayLang` — `lang` when not translated; when translated, the REAL
 * `effectiveTargetLocale` from the server (when owner-authored text was actually sent, 100%
 * accurate) or the deterministic `oppositeActiveTranslateLocale(lang)` (when the card has ONLY
 * canonical content — no provider call needed, canonical labels are a fixed ES/EN dictionary).
 * The caller re-derives EVERY visible chip/category from `displayLang` via the existing, reused
 * `relabelServiciosCanonicalPresets` overlay — never a duplicate catalog.
 *
 * Also: Translate is no longer hidden just because `ownerAuthoredChips` is empty — a card built
 * entirely from canonical presets still has a real language to switch, so it still offers a
 * (zero-network) toggle. Translate is hidden only when the card has NEITHER canonical content nor
 * owner-authored prose to switch.
 */
export function useServiciosResultCardTranslation({
  categoryLine,
  ownerAuthoredChips,
  hasCanonicalDisplayContent,
  lang,
  listingKey,
  enabled,
}: {
  /** Owner-authored "otro" category text only — never a catalog preset label. */
  categoryLine?: string;
  /** The exact, already-displayed, owner-authored chip strings on this card. */
  ownerAuthoredChips: string[];
  /** True when the card shows at least one canonical (catalog) chip or category line — these
   * always have real ES/EN labels, so Translate stays offered even with zero owner-authored text. */
  hasCanonicalDisplayContent: boolean;
  lang: ServiciosLang;
  listingKey: string;
  enabled: boolean;
}): {
  translateControl: ReactNode;
  /** `lang` (not translated) or the real/derived effective target once translated — feed this
   * back into `relabelServiciosCanonicalPresets(profile, displayLang)` to keep canonical chips in
   * lock-step with the owner-authored overlay below. */
  displayLang: ServiciosLang;
  displayCategoryLine: string | undefined;
  chipOverrides: Map<string, string>;
} {
  const input = useMemo<ServiciosCardTranslatableInput>(
    () => ({ categoryLine, ownerAuthoredChips }),
    [categoryLine, ownerAuthoredChips],
  );

  const translatableContent = useMemo(() => buildServiciosCardTranslatableContent(input), [input]);
  const hasOwnerAuthoredContent = hasServiciosTranslatableProse(translatableContent);
  const offerTranslate = enabled && (hasOwnerAuthoredContent || hasCanonicalDisplayContent);

  const [showTranslated, setShowTranslated] = useState(false);
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);

  const onTranslated = useCallback((result: AdTranslationResult) => {
    setTranslation(result);
    setShowTranslated(true);
  }, []);

  const onShowOriginal = useCallback(() => {
    setShowTranslated(false);
  }, []);

  const toggleCanonicalOnly = useCallback(() => {
    setShowTranslated((v) => !v);
  }, []);

  const displayLang = useMemo((): ServiciosLang => {
    if (!showTranslated) return lang;
    if (hasOwnerAuthoredContent) {
      const effective = translation?.effectiveTargetLocale ?? translation?.targetLocale;
      return effective === "en" ? "en" : effective === "es" ? "es" : lang;
    }
    return oppositeActiveTranslateLocale(lang) as ServiciosLang;
  }, [showTranslated, hasOwnerAuthoredContent, translation, lang]);

  const applied = useMemo(() => {
    if (!showTranslated || !hasOwnerAuthoredContent || !translation?.translated) return null;
    return applyServiciosCardTranslation(translation.translated, input);
  }, [showTranslated, hasOwnerAuthoredContent, translation, input]);

  const translateControl = !offerTranslate ? null : hasOwnerAuthoredContent ? (
    <TranslateAdControl
      siteLocale={lang}
      originalLocale="unknown"
      category="servicios"
      // Distinct namespace from the full-profile page's own listingKey usage — belt-and-suspenders
      // alongside the distinct `version` below, so a card-scoped cache entry (fewer fields) can
      // never be read back by the full-profile page expecting the complete translation bundle.
      listingKey={`card:${listingKey}`}
      // Distinct from the detail page's translation version string — different field subset, must
      // never share a sessionStorage cache entry with the full-profile translation.
      version="servicios-card-t1-v1"
      translatableContent={translatableContent}
      onTranslated={onTranslated}
      onShowOriginal={onShowOriginal}
      requestTranslation={requestServiciosAdTranslation}
      className="shrink-0"
    />
  ) : (
    <ServiciosCanonicalOnlyTranslateToggle lang={lang} showTranslated={showTranslated} onToggle={toggleCanonicalOnly} />
  );

  return {
    translateControl,
    displayLang,
    displayCategoryLine: applied?.categoryLine,
    chipOverrides: applied?.chipsByOriginal ?? new Map<string, string>(),
  };
}

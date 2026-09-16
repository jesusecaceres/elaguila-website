"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import type { AdTranslationResult } from "@/app/lib/translation/types";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import {
  applyServiciosCardTranslation,
  buildServiciosCardTranslatableContent,
  hasServiciosTranslatableProse,
  requestServiciosAdTranslation,
  type ServiciosCardTranslatableInput,
} from "../lib/serviciosTranslateAd";

/**
 * Servicios Final UI Truth Closeout (2026-09-16) — compact, results-card-scoped Translate control.
 * Shared by both card templates (trade + professional) so the "show only when there is genuine
 * visible authored content" rule and the card-scoped cache namespace live in exactly one place.
 *
 * `enabled` lets a caller suppress the control entirely (e.g. the professional card's compact
 * sidebar-rail density, which this pass does not touch) without duplicating the gating logic.
 */
export function useServiciosResultCardTranslation({
  categoryLine,
  ownerAuthoredChips,
  lang,
  listingKey,
  enabled,
}: {
  /** Owner-authored "otro" category text only — never a catalog preset label. */
  categoryLine?: string;
  /** The exact, already-displayed, owner-authored chip strings on this card. */
  ownerAuthoredChips: string[];
  lang: ServiciosLang;
  listingKey: string;
  enabled: boolean;
}): {
  translateControl: ReactNode;
  displayCategoryLine: string | undefined;
  chipOverrides: Map<string, string>;
} {
  const input = useMemo<ServiciosCardTranslatableInput>(
    () => ({ categoryLine, ownerAuthoredChips }),
    [categoryLine, ownerAuthoredChips],
  );

  const translatableContent = useMemo(() => buildServiciosCardTranslatableContent(input), [input]);
  const offerTranslate = enabled && hasServiciosTranslatableProse(translatableContent);

  const [showTranslated, setShowTranslated] = useState(false);
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);

  const onTranslated = useCallback((result: AdTranslationResult) => {
    setTranslation(result);
    setShowTranslated(true);
  }, []);

  const onShowOriginal = useCallback(() => {
    setShowTranslated(false);
  }, []);

  const applied = useMemo(() => {
    if (!showTranslated || !translation?.translated) return null;
    return applyServiciosCardTranslation(translation.translated, input);
  }, [showTranslated, translation, input]);

  const translateControl = offerTranslate ? (
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
  ) : null;

  return {
    translateControl,
    displayCategoryLine: applied?.categoryLine,
    chipOverrides: applied?.chipsByOriginal ?? new Map<string, string>(),
  };
}

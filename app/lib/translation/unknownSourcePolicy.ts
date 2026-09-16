/**
 * Servicios Live Launch Perfection ⚠️16 (2026-09-13) — the LOCKED Translate Ad contract for ads
 * whose source locale is `unknown` (Servicios stores no `original_language` yet).
 *
 *   1. The provider/server detects the content language.
 *   2. Detected ≠ requested site target → translate normally into the requested target.
 *   3. Detected = requested site target → the effective target becomes the opposite active
 *      Servicios language (ES → EN, EN → ES). Spanish owner content → English on demand, English
 *      owner content → Spanish on demand — never an untranslated echo behind a "Ver original".
 *   4. Detection failure (`unknown`) keeps the pre-policy behaviour (auto-detect at the provider,
 *      requested target) so nothing regresses when detection is unavailable.
 *
 * Known-source requests never enter this policy; the route only consults it for `"unknown"`.
 * Pure and side-effect free so it is executable in verifiers without a provider.
 */
import type { ContentLocale, Locale, TranslatableAdFieldKey, TranslatableAdFields } from "@/app/lib/translation/types";

export type UnknownSourceTranslationPlan = {
  /** Source handed to the provider/cache — the detected locale, or `unknown` when undetermined. */
  sourceLocale: ContentLocale;
  /** Target handed to the provider/cache — the EFFECTIVE translation direction. */
  targetLocale: Locale;
  detectedSourceLocale: ContentLocale;
  /** True when the content already matched the requested target and was redirected to the opposite language. */
  retargeted: boolean;
};

/** ES ↔ EN. Any other active site locale that already matches its content falls back to Spanish, Leonix's primary language. */
export function oppositeActiveTranslateLocale(locale: Locale): Locale {
  return locale === "es" ? "en" : "es";
}

export function planUnknownSourceTranslation(
  requestedTarget: Locale,
  detected: ContentLocale,
): UnknownSourceTranslationPlan {
  if (detected === "unknown") {
    return { sourceLocale: "unknown", targetLocale: requestedTarget, detectedSourceLocale: "unknown", retargeted: false };
  }
  if (detected !== requestedTarget) {
    return { sourceLocale: detected, targetLocale: requestedTarget, detectedSourceLocale: detected, retargeted: false };
  }
  return {
    sourceLocale: detected,
    targetLocale: oppositeActiveTranslateLocale(requestedTarget),
    detectedSourceLocale: detected,
    retargeted: true,
  };
}

/** Longest-prose-first order so the sample is dominated by the owner's own writing. */
const DETECTION_FIELD_ORDER: readonly TranslatableAdFieldKey[] = [
  "description",
  "body",
  "details",
  "highlights",
  "customServiceText",
  "title",
  "shareText",
  "serviceLabel",
  "locationNote",
];

const MASK_PLACEHOLDER_RE = /__LEONIX_MASK_\d+__/g;

/** Masked prose sample for detection — placeholders removed so they cannot skew the guess. */
export function buildDetectionSample(fields: TranslatableAdFields, maxChars = 1500): string {
  const parts: string[] = [];
  for (const key of DETECTION_FIELD_ORDER) {
    const value = fields[key];
    if (typeof value !== "string") continue;
    const cleaned = value.replace(MASK_PLACEHOLDER_RE, " ").replace(/\s+/g, " ").trim();
    if (cleaned) parts.push(cleaned);
  }
  return parts.join("\n").slice(0, maxChars);
}

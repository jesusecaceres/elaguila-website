import type { RecursosLang } from "./types";
import type { SpanishStatus } from "./intake/server/resourceSpanishStatusDb";

/**
 * Bilingual doctrine — SUPERSEDES the ES-2G comment this replaced, kept here for history rather
 * than deleted:
 *
 *   "Locked V1 bilingual doctrine: no machine-generated resource translations, ever." — written
 *   when no persistent human-review gate existed for any resource field. It no longer reflects
 *   the real constraint.
 *
 *   ES-2G/ES-5 doctrine (the placeholder that named this gate before it existed): "Machine
 *   translation is NEVER auto-applied or auto-published to a live *_es column. Every translated
 *   field flows through the existing public.resource_change_proposals / Cambios review queue and
 *   requires individual human acceptance... Presence of `shortDescriptionEs` (or any other *_es
 *   field) text does NOT by itself mean Spanish is approved for public trust — that is gated by
 *   `community_resources.spanish_status`... enforced starting at the public-rendering layer in
 *   Gate ES-8."
 *
 * Gate ES-8 (current, Coach-approved) — this IS that enforcement point:
 *   PERMANENT PUBLIC TRUST RULE: Spanish text may exist in the database, but it is publicly
 *   trusted ONLY when spanish_status says it is approved. Presence of `*_es` text alone never
 *   qualifies — trust is `spanish_status ∈ {'official_spanish', 'verified_translation'}`, full
 *   stop. `resolveBilingualField()` below is the ONE place this check happens; every public
 *   surface (detail page, cards, JSON-LD) must call it rather than reimplementing the ternary.
 *
 * Applies to translatable presentation fields only (shortDescription/details/eligibility/
 * hoursNote) — never to structured facts (phone/address/is24Hours/etc.), which are
 * language-neutral and read from the record as-is regardless of spanish_status.
 */

const TRUSTED_SPANISH_STATUSES: ReadonlySet<SpanishStatus> = new Set(["official_spanish", "verified_translation"]);

/** The one place "is this Spanish approved for public trust" is decided — never reimplemented elsewhere. */
export function isTrustedSpanishStatus(status: SpanishStatus | null | undefined): boolean {
  return status != null && TRUSTED_SPANISH_STATUSES.has(status);
}

export type BilingualFieldResolution = {
  /** The text to display, or "" if both languages are blank — callers render nothing on empty. */
  value: string;
  /** Which language the returned value is actually written in. */
  displayLang: RecursosLang;
  /** True only when lang="es" was requested but untrusted/missing Spanish forced an English value instead — drives the "(EN)" marker. */
  isFallback: boolean;
};

/**
 * Canonical bilingual field resolver (ES-8B). Rules:
 *   lang="en": use EN; if EN is blank, silently show ES instead (unchanged V1 behavior) —
 *     never marked as a fallback, since an English viewer seeing untranslated Spanish source
 *     text isn't the "(EN) fallback" concept this gate is about.
 *   lang="es" AND spanish_status is trusted AND the ES value is non-empty: use ES.
 *   lang="es" otherwise (untrusted status, or ES blank even if status is trusted): use EN,
 *     isFallback=true.
 *   Both blank: value="".
 */
export function resolveBilingualField(input: {
  esValue: string | null | undefined;
  enValue: string | null | undefined;
  lang: RecursosLang;
  spanishStatus: SpanishStatus | null | undefined;
}): BilingualFieldResolution {
  const es = input.esValue?.trim() || "";
  const en = input.enValue?.trim() || "";

  if (input.lang === "en") {
    if (en) return { value: en, displayLang: "en", isFallback: false };
    if (es) return { value: es, displayLang: "es", isFallback: false };
    return { value: "", displayLang: "en", isFallback: false };
  }

  // lang === "es"
  if (isTrustedSpanishStatus(input.spanishStatus) && es) {
    return { value: es, displayLang: "es", isFallback: false };
  }
  if (en) return { value: en, displayLang: "en", isFallback: true };
  return { value: "", displayLang: "en", isFallback: false };
}

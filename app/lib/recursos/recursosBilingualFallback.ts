import type { PublicResourceRecord, RecursosLang } from "./types";

/**
 * Bilingual doctrine — SUPERSEDES the original V1 rule below, kept here for history rather than
 * deleted:
 *
 *   "Locked V1 bilingual doctrine: no machine-generated resource translations, ever." — this was
 *   written when NO persistent human-review gate existed for any resource field, so "never" was
 *   the only safe rule at the time. It no longer reflects the real constraint.
 *
 * Recursos Verified Spanish Bridge doctrine (current, Coach-approved):
 *   - AI may prepare a faithful translation ONLY from already-verified resource facts, never
 *     from raw/unverified source text.
 *   - Translation never establishes factual truth — it is presentation only.
 *   - Machine translation is NEVER auto-applied or auto-published to a live *_es column.
 *   - Every translated field flows through the existing public.resource_change_proposals /
 *     Cambios review queue and requires individual human acceptance — the same accept-gate
 *     every other field type already goes through, not a new or weaker one.
 *   - Presence of `shortDescriptionEs` (or any other *_es field) text does NOT by itself mean
 *     Spanish is approved for public trust — that is gated by `community_resources.spanish_status`
 *     (trusted: 'official_spanish' | 'verified_translation'; not yet trusted: everything else),
 *     enforced starting at the public-rendering layer in Gate ES-8. This file's runtime fallback
 *     behavior below is unchanged by that gate boundary — see the function itself.
 *
 * Until Gate ES-8 lands, this function's actual runtime behavior is unchanged: it shows the
 * verified English text with an honest "(EN)" indicator whenever `shortDescriptionEs` is blank,
 * instead of a blank field or a silent, unverified translation. Never applies to structured facts
 * (phone/address/eligibility-thresholds/hours-data) — those always come from the record as-is, in
 * whichever language they were actually verified in.
 */
export function resolveResourceDescription(
  resource: Pick<PublicResourceRecord, "shortDescriptionEs" | "shortDescriptionEn">,
  lang: RecursosLang,
): { text: string; isEnglishFallback: boolean } {
  if (lang === "en") {
    return { text: resource.shortDescriptionEn?.trim() || resource.shortDescriptionEs?.trim() || "", isEnglishFallback: false };
  }
  const es = resource.shortDescriptionEs?.trim();
  if (es) return { text: es, isEnglishFallback: false };
  const en = resource.shortDescriptionEn?.trim();
  return { text: en ?? "", isEnglishFallback: Boolean(en) };
}

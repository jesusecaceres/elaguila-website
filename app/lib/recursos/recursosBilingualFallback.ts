import type { PublicResourceRecord, RecursosLang } from "./types";

/**
 * Locked V1 bilingual doctrine: no machine-generated resource translations, ever. When a
 * Spanish description doesn't exist for a resource (true for all records researched so far —
 * Build 03A intentionally left `shortDescriptionEs` blank rather than auto-translate), show the
 * verified English text with an honest "(EN)" indicator instead of a blank field or a silent,
 * unverified translation. Never applies to structured facts (phone/address/eligibility/hours) —
 * those always come from the record as-is, in whichever language they were actually verified in.
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

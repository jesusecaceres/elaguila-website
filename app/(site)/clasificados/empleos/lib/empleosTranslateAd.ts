import {
  normalizeLocale,
  pickTranslatableAdFields,
  shouldOfferTranslateAd,
} from "@/app/lib/translation/helpers";
import type { ContentLocale, Locale, TranslatableAdFields } from "@/app/lib/translation/types";
import type { EmpleosJobRecord } from "../data/empleosJobTypes";

function encodeLines(items: readonly string[]): string | undefined {
  const lines = items.map((s) => s.trim()).filter(Boolean);
  return lines.length ? lines.join("\n") : undefined;
}

function decodeLines(encoded: string, original: readonly string[]): string[] {
  const lines = encoded.split("\n");
  if (!original.length) return lines.map((l) => l.trim()).filter(Boolean);
  return original.map((item, index) => {
    const next = lines[index]?.trim();
    return next || item;
  });
}

export function normalizeEmpleosListingLang(raw: string | null | undefined): ContentLocale {
  return normalizeLocale(raw) ?? "unknown";
}

/** User-authored job prose only — employer name, pay, location, and contact stay out. */
export function buildEmpleosTranslatableContent(job: EmpleosJobRecord): TranslatableAdFields {
  const summary = job.summary?.trim();
  const description = job.description?.trim();

  return {
    title: job.title?.trim() || undefined,
    description: description || undefined,
    body: summary && summary !== description ? summary : undefined,
    details: encodeLines(job.requirements),
    highlights: encodeLines(job.benefits),
    customServiceText: job.scheduleLabel?.trim() || undefined,
    serviceLabel: job.categoryCustomLabel?.trim() || undefined,
    shareText: job.industryFocus?.trim() || undefined,
  };
}

export function hasEmpleosTranslatableProse(content: unknown): boolean {
  return Object.keys(pickTranslatableAdFields(content)).length > 0;
}

export function shouldOfferEmpleosTranslateAd(
  siteLocale: Locale,
  listingLang: ContentLocale,
  translatableContent: unknown,
): boolean {
  if (!hasEmpleosTranslatableProse(translatableContent)) return false;
  if (listingLang === "es" || listingLang === "en") {
    return shouldOfferTranslateAd({ siteLocale, originalLocale: listingLang });
  }
  return siteLocale === "es" || siteLocale === "en";
}

export function applyEmpleosTranslation(
  job: EmpleosJobRecord,
  translated: Partial<TranslatableAdFields>,
): EmpleosJobRecord {
  let next: EmpleosJobRecord = job;

  if (translated.title?.trim()) {
    next = { ...next, title: translated.title.trim() };
  }
  if (translated.description?.trim()) {
    next = { ...next, description: translated.description.trim() };
  }
  if (translated.body?.trim()) {
    next = { ...next, summary: translated.body.trim() };
  }
  if (translated.details?.trim()) {
    next = { ...next, requirements: decodeLines(translated.details, next.requirements) };
  }
  if (translated.highlights?.trim()) {
    next = { ...next, benefits: decodeLines(translated.highlights, next.benefits) };
  }
  if (translated.customServiceText?.trim()) {
    next = { ...next, scheduleLabel: translated.customServiceText.trim() };
  }
  if (translated.serviceLabel?.trim()) {
    next = { ...next, categoryCustomLabel: translated.serviceLabel.trim() };
  }
  if (translated.shareText?.trim()) {
    next = { ...next, industryFocus: translated.shareText.trim() };
  }

  return next;
}

import { pickTranslatableAdFields } from "@/app/lib/translation/helpers";
import type { TranslatableAdFields } from "@/app/lib/translation/types";
import type { ServiciosProfileResolved } from "../types/serviciosBusinessProfile";

/** Encodes service cards for the `details` translatable field (index + title + secondary line). */
const SERVICE_LINE_RE = /^(\d+)\t([^\t]*)\t(.*)$/;

function encodeServicesForTranslation(
  services: ServiciosProfileResolved["services"],
): string | undefined {
  if (!services.length) return undefined;
  const lines = services
    .map((s, i) => {
      const title = s.title.trim();
      const secondary = s.secondaryLine.trim();
      if (!title && !secondary) return null;
      return `${i}\t${title}\t${secondary}`;
    })
    .filter((line): line is string => Boolean(line));
  return lines.length ? lines.join("\n") : undefined;
}

function decodeServicesFromTranslation(
  encoded: string,
  original: ServiciosProfileResolved["services"],
): ServiciosProfileResolved["services"] {
  const byIndex = new Map<number, { title: string; secondaryLine: string }>();
  for (const line of encoded.split("\n")) {
    const trimmed = line.trimEnd();
    if (!trimmed) continue;
    const match = SERVICE_LINE_RE.exec(trimmed);
    if (!match) continue;
    const index = Number(match[1]);
    if (!Number.isFinite(index) || index < 0) continue;
    byIndex.set(index, { title: match[2], secondaryLine: match[3] });
  }
  return original.map((service, index) => {
    const translated = byIndex.get(index);
    if (!translated) return service;
    return {
      ...service,
      title: translated.title.trim() || service.title,
      secondaryLine: translated.secondaryLine.trim() || service.secondaryLine,
    };
  });
}

/**
 * ⚠️16 (2026-09-13): only OWNER-AUTHORED highlights are sent (`bh_custom_*`); preset chips
 * (`bh_preset_*`) are pre-localized Leonix copy and never enter Translate Ad. Lines are indexed so
 * the filtered set maps back onto the original positions.
 */
const CUSTOM_HIGHLIGHT_ID_PREFIX = "bh_custom_";
const HIGHLIGHT_LINE_RE = /^(\d+)[\t ]+(.*)$/;

export function isOwnerAuthoredHighlight(item: ServiciosProfileResolved["highlights"][number]): boolean {
  return item.id.startsWith(CUSTOM_HIGHLIGHT_ID_PREFIX);
}

function encodeHighlightsForTranslation(
  highlights: ServiciosProfileResolved["highlights"],
): string | undefined {
  const lines = highlights
    .map((h, i) => (isOwnerAuthoredHighlight(h) && h.label.trim() ? `${i}\t${h.label.trim()}` : null))
    .filter((line): line is string => Boolean(line));
  return lines.length ? lines.join("\n") : undefined;
}

function decodeHighlightsFromTranslation(
  encoded: string,
  original: ServiciosProfileResolved["highlights"],
): ServiciosProfileResolved["highlights"] {
  const byIndex = new Map<number, string>();
  for (const line of encoded.split("\n")) {
    const match = HIGHLIGHT_LINE_RE.exec(line.trimEnd());
    if (!match) continue;
    const index = Number(match[1]);
    const label = match[2].trim();
    if (Number.isFinite(index) && index >= 0 && label) byIndex.set(index, label);
  }
  return original.map((item, index) => {
    const label = byIndex.get(index);
    return label && isOwnerAuthoredHighlight(item) ? { ...item, label } : item;
  });
}

/* ==============================================================================================
 * Servicios Live Launch Perfection ⚠️16 (2026-09-13) — owner-authored extras ride in the `body`
 * field as tagged lines (same tab/newline protocol the services encoding already uses):
 *   qf <i> <label>            custom Quick Facts only (`kind === "custom"`; presets are pre-localized)
 *   tr <i> <label>            custom "Por qué elegirnos" reason only (`id === "custom_reason"`)
 *   cp <i> <title> <desc>     coupon title / description (owner-authored)
 *   pr <i> <headline>         promotions after the first (the first stays in `shareText`)
 * Preset chips, Leonix chrome, prices, codes, dates and contact data are never sent.
 * ============================================================================================ */
const CUSTOM_QUICK_FACT_KIND = "custom";
const CUSTOM_REASON_ID = "custom_reason";
const OWNER_EXTRA_LINE_RE = /^(qf|tr|cp|pr)[\t ]+(\d+)[\t ]+([^\t]*)(?:\t(.*))?$/;

export function isOwnerAuthoredQuickFact(fact: ServiciosProfileResolved["quickFacts"][number]): boolean {
  return fact.kind === CUSTOM_QUICK_FACT_KIND;
}

export function isOwnerAuthoredTrustItem(item: ServiciosProfileResolved["trust"][number]): boolean {
  return item.id === CUSTOM_REASON_ID;
}

function encodeOwnerExtrasForTranslation(profile: ServiciosProfileResolved): string | undefined {
  const lines: string[] = [];
  profile.quickFacts.forEach((fact, i) => {
    const label = fact.label.trim();
    if (isOwnerAuthoredQuickFact(fact) && label) lines.push(`qf\t${i}\t${label}`);
  });
  profile.trust.forEach((item, i) => {
    const label = item.label.trim();
    if (isOwnerAuthoredTrustItem(item) && label) lines.push(`tr\t${i}\t${label}`);
  });
  profile.coupons.forEach((coupon, i) => {
    const title = coupon.title.trim();
    const description = coupon.description?.trim() ?? "";
    if (title || description) lines.push(`cp\t${i}\t${title}\t${description}`);
  });
  profile.promotions.forEach((promo, i) => {
    if (i === 0) return;
    const headline = promo.headline.trim();
    if (headline) lines.push(`pr\t${i}\t${headline}`);
  });
  return lines.length ? lines.join("\n") : undefined;
}

function decodeOwnerExtrasFromTranslation(
  encoded: string,
  profile: ServiciosProfileResolved,
): ServiciosProfileResolved {
  const quickFacts = new Map<number, string>();
  const trust = new Map<number, string>();
  const coupons = new Map<number, { title: string; description: string }>();
  const promotions = new Map<number, string>();
  for (const line of encoded.split("\n")) {
    const match = OWNER_EXTRA_LINE_RE.exec(line.trimEnd());
    if (!match) continue;
    const index = Number(match[2]);
    if (!Number.isFinite(index) || index < 0) continue;
    const primary = match[3].trim();
    const secondary = (match[4] ?? "").trim();
    if (match[1] === "qf") quickFacts.set(index, primary);
    else if (match[1] === "tr") trust.set(index, primary);
    else if (match[1] === "cp") coupons.set(index, { title: primary, description: secondary });
    else if (match[1] === "pr") promotions.set(index, primary);
  }
  let next = profile;
  if (quickFacts.size) {
    next = {
      ...next,
      quickFacts: next.quickFacts.map((fact, i) => {
        const label = quickFacts.get(i);
        return label && isOwnerAuthoredQuickFact(fact) ? { ...fact, label } : fact;
      }),
    };
  }
  if (trust.size) {
    next = {
      ...next,
      trust: next.trust.map((item, i) => {
        const label = trust.get(i);
        return label && isOwnerAuthoredTrustItem(item) ? { ...item, label } : item;
      }),
    };
  }
  if (coupons.size) {
    next = {
      ...next,
      coupons: next.coupons.map((coupon, i) => {
        const translated = coupons.get(i);
        if (!translated) return coupon;
        return {
          ...coupon,
          title: translated.title || coupon.title,
          description: coupon.description ? translated.description || coupon.description : coupon.description,
        };
      }),
    };
  }
  if (promotions.size) {
    next = {
      ...next,
      promotions: next.promotions.map((promo, i) => {
        const headline = promotions.get(i);
        return i > 0 && headline ? { ...promo, headline } : promo;
      }),
    };
  }
  return next;
}

/** User-authored prose only — contact, business name, URLs, and prices stay out. */
export function buildServiciosTranslatableContent(
  profile: ServiciosProfileResolved,
): TranslatableAdFields {
  const about = profile.about;
  const firstPromo = profile.promotions[0];

  return {
    title: profile.hero.categoryLine?.trim() || undefined,
    description: about?.text?.trim() || undefined,
    customServiceText: about?.specialtiesLine?.trim() || undefined,
    highlights: encodeHighlightsForTranslation(profile.highlights),
    details: encodeServicesForTranslation(profile.services),
    shareText: firstPromo?.headline?.trim() || undefined,
    body: encodeOwnerExtrasForTranslation(profile),
  };
}

export function hasServiciosTranslatableProse(content: unknown): boolean {
  const picked = pickTranslatableAdFields(content);
  return Object.keys(picked).length > 0;
}

export function applyServiciosTranslation(
  profile: ServiciosProfileResolved,
  translated: Partial<TranslatableAdFields>,
): ServiciosProfileResolved {
  let next: ServiciosProfileResolved = profile;

  if (translated.title?.trim()) {
    next = {
      ...next,
      hero: { ...next.hero, categoryLine: translated.title.trim() },
    };
  }

  if (translated.description?.trim()) {
    next = {
      ...next,
      about: { ...next.about, text: translated.description.trim() },
    };
  }

  if (translated.customServiceText?.trim()) {
    next = {
      ...next,
      about: { ...next.about, specialtiesLine: translated.customServiceText.trim() },
    };
  }

  if (translated.details?.trim()) {
    next = {
      ...next,
      services: decodeServicesFromTranslation(translated.details, next.services),
    };
  }

  if (translated.highlights?.trim()) {
    next = {
      ...next,
      highlights: decodeHighlightsFromTranslation(translated.highlights, next.highlights),
    };
  }

  if (translated.shareText?.trim() && next.promotions.length > 0) {
    next = {
      ...next,
      promotions: next.promotions.map((promo, index) =>
        index === 0 ? { ...promo, headline: translated.shareText!.trim() } : promo,
      ),
    };
  }

  if (translated.body?.trim()) {
    next = decodeOwnerExtrasFromTranslation(translated.body, next);
  }

  return next;
}

/** Client-only: POST masked fields to the server translate route (no API keys). */
export { requestAdTranslation as requestServiciosAdTranslation } from "@/app/lib/translation/requestAdTranslation";

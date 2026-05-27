import type { TranslateAdProviderFn } from "@/app/lib/translation/provider";
import { pickTranslatableAdFields } from "@/app/lib/translation/helpers";
import type { AdTranslationResult, TranslatableAdFields } from "@/app/lib/translation/types";
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

function encodeHighlightsForTranslation(
  highlights: ServiciosProfileResolved["highlights"],
): string | undefined {
  const labels = highlights.map((h) => h.label.trim()).filter(Boolean);
  return labels.length ? labels.join("\n") : undefined;
}

function decodeHighlightsFromTranslation(
  encoded: string,
  original: ServiciosProfileResolved["highlights"],
): ServiciosProfileResolved["highlights"] {
  const lines = encoded.split("\n");
  return original.map((item, index) => {
    const label = lines[index]?.trim();
    return label ? { ...item, label } : item;
  });
}

/** User-authored prose only — contact, business name, URLs, and prices stay out. */
export function buildServiciosTranslatableContent(
  profile: ServiciosProfileResolved,
): TranslatableAdFields {
  const about = profile.about;
  const firstPromo = profile.promotions[0];

  return {
    description: about?.text?.trim() || undefined,
    customServiceText: about?.specialtiesLine?.trim() || undefined,
    highlights: encodeHighlightsForTranslation(profile.highlights),
    details: encodeServicesForTranslation(profile.services),
    shareText: firstPromo?.headline?.trim() || undefined,
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

  return next;
}

/** Client-only: POST masked fields to the server translate route (no API keys). */
export const requestServiciosAdTranslation: TranslateAdProviderFn = async (req) => {
  const res = await fetch("/api/translate-ad", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : "Translation request failed";
    throw new Error(message);
  }

  return body as AdTranslationResult;
};

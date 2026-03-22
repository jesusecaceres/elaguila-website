/**
 * Compact preview / card display strings derived from the unified publish snapshot.
 */

import type { EnVentaDraftSnapshot } from "@/app/clasificados/en-venta/publish/buildEnVentaDraftSnapshot";

export type PublishPreviewLang = "es" | "en";

export function getShortPreviewText(raw: string, maxLen = 90): string {
  const t = (raw ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen).trim() + "…";
}

export const COMPACT_PREVIEW_TEASER_MAX_LEN = 80;

export function buildPublishPreviewDisplayStrings(params: {
  snapshot: EnVentaDraftSnapshot;
  lang: PublishPreviewLang;
  todayLabel: string;
}): {
  previewTitle: string;
  previewDescription: string;
  previewPrice: string;
  previewCity: string;
  previewPosted: string;
  previewShortDescription: string;
} {
  const { snapshot, lang, todayLabel } = params;
  return {
    previewTitle: snapshot.title || (lang === "es" ? "(Sin título)" : "(No title)"),
    previewDescription: snapshot.description || (lang === "es" ? "(Sin descripción)" : "(No description)"),
    previewPrice: snapshot.priceLabel,
    previewCity: (snapshot.cityCanonical ?? snapshot.city) || (lang === "es" ? "(Ciudad)" : "(City)"),
    previewPosted: todayLabel,
    previewShortDescription: getShortPreviewText(snapshot.description, COMPACT_PREVIEW_TEASER_MAX_LEN),
  };
}

/** Ordered subset of detail rows for BR privado compact preview card. */
export function buildCompactBrPrivateDetailPairs(params: {
  categoryFromUrl: string;
  isBienesRaicesPrivado: boolean;
  previewDetailPairs: Array<{ label: string; value: string }>;
  lang: PublishPreviewLang;
}): Array<{ label: string; value: string }> {
  const { categoryFromUrl, isBienesRaicesPrivado, previewDetailPairs, lang } = params;
  if (categoryFromUrl !== "bienes-raices" || !isBienesRaicesPrivado || !previewDetailPairs.length) return [];
  const order =
    lang === "es"
      ? ["Tipo de propiedad", "Dirección", "Recámaras", "Baños", "Pies²"]
      : ["Property type", "Address", "Bedrooms", "Bathrooms", "Sq ft"];
  const byLabel = new Map(previewDetailPairs.map((p) => [p.label, p]));
  return order.map((label) => byLabel.get(label)).filter(Boolean) as Array<{ label: string; value: string }>;
}

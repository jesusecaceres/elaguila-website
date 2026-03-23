/**
 * BR negocio premium preview: pure transforms (partition → grouped sections, media URLs, map embed).
 */

import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { partitionBienesRaicesPreviewDetailPairs } from "@/app/clasificados/bienes-raices/shared/preview/bienesRaicesPreviewDetailPartition";
import {
  groupBienesRaicesNegocioDetailPairs,
  type NegocioDetailSectionId,
} from "@/app/clasificados/bienes-raices/negocio/mapping/bienesRaicesNegocioDetailGroups";
import type { ListingData } from "@/app/clasificados/components/ListingView";

export type BrPreviewLang = "es" | "en";

export function normalizeMediaHref(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t) || t.startsWith("blob:") || t.startsWith("/")) return t;
  return `https://${t}`;
}

export function pickDetailPairValue(
  pairs: Array<{ label: string; value: string }> | undefined,
  labelTest: (label: string) => boolean
): string {
  const p = pairs?.find((x) => labelTest((x.label ?? "").toLowerCase()));
  return (p?.value ?? "").trim();
}

export function formatBrNegocioPreviewPrice(priceLabel: string, lang: BrPreviewLang): string {
  const base = formatListingPrice(priceLabel, { lang });
  const lower = base.toLowerCase();
  if (lower.includes("gratis") || lower.includes("free")) return base;
  const numericMatch = base.match(/-?\d+(?:\.\d+)?/);
  if (!numericMatch) return base;
  const n = Number(numericMatch[0]);
  if (!Number.isFinite(n)) return base;
  const roundedIntStr = String(Math.round(n));
  const withCommas = roundedIntStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return base.includes("$") ? `$${withCommas}` : withCommas;
}

function summaryLabelKey(label: string): string {
  return label.trim().toLowerCase();
}

export function buildNegocioPremiumPreviewSections(detailPairs: Array<{ label: string; value: string }>, lang: BrPreviewLang) {
  const { quickFacts, featureTags } = partitionBienesRaicesPreviewDetailPairs(detailPairs, lang);
  const summaryKeys = new Set(quickFacts.map((f) => summaryLabelKey(f.label)));
  const grouped = groupBienesRaicesNegocioDetailPairs(detailPairs);
  const filteredSections = grouped
    .map((sec) => ({
      ...sec,
      pairs: sec.pairs.filter((p) => !summaryKeys.has(summaryLabelKey(p.label))),
    }))
    .filter((sec) => sec.pairs.length > 0);
  return { quickFacts, featureTags, filteredSections };
}

export function buildGoogleMapsEmbedSrc(query: string, lang: BrPreviewLang): string | null {
  const q = query.trim();
  if (!q) return null;
  const hl = lang === "es" ? "es" : "en";
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&hl=${hl}&z=15&output=embed`;
}

export function structuredFactsToStatRows(
  structured: ListingData["structuredFacts"] | undefined,
  lang: BrPreviewLang
): Array<{ label: string; value: string }> {
  if (!structured) return [];
  const L = lang === "es";
  const rows: Array<{ label: string; value: string }> = [];
  const push = (labelEs: string, labelEn: string, v?: string | null) => {
    const t = (v ?? "").trim();
    if (t) rows.push({ label: L ? labelEs : labelEn, value: t });
  };
  push("Tipo", "Type", structured.propertyTypeLabel);
  push("Estilo", "Style", structured.architecturalStyle);
  push("Recámaras", "Beds", structured.beds);
  push("Baños", "Baths", structured.baths);
  push("Medios baños", "Half baths", structured.halfBaths);
  push("Pies²", "Sq ft", structured.sqft);
  push("Terreno", "Lot", structured.lotSize);
  push("Estacionamiento", "Parking", structured.parking);
  push("Niveles", "Levels", structured.levels);
  push("Año", "Year built", structured.yearBuilt);
  push("Zonificación", "Zoning", structured.zoning);
  push("CP / ZIP", "ZIP", structured.zip);
  return rows;
}

export const BR_NEGOCIO_PREVIEW_ANCHORS = {
  resumen: "br-negocio-sec-resumen",
  interior: "br-negocio-sec-interior",
  exterior: "br-negocio-sec-exterior",
  detalles: "br-negocio-sec-detalles",
  ubicacion: "br-negocio-sec-ubicacion",
  contacto: "br-negocio-sec-contacto",
} as const;

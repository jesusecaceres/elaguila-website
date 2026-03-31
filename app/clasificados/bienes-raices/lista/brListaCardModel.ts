/**
 * BR lista/result cards: derive display model from listing rows (parity with preview partition + live facts).
 */

import { partitionBienesRaicesPreviewDetailPairs } from "@/app/clasificados/bienes-raices/shared/bienesRaicesPreviewDetailPartition";
import { parseBusinessMeta } from "@/app/clasificados/config/businessListingContract";

export type BrListaLang = "es" | "en";

export type BienesRaicesListaListingLike = {
  id: string;
  category: string;
  sellerType?: string;
  seller_type?: string;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  blurb: { es: string; en: string };
  postedAgo: { es: string; en: string };
  hasImage?: boolean;
  businessName?: string | null;
  business_name?: string | null;
  business_meta?: string | null;
  rentasTier?: string | null;
  rentas_tier?: string | null;
  servicesTier?: string | null;
  status?: string;
  images?: string[] | null;
  photos?: string[] | null;
  detailPairs?: Array<{ label: string; value: string }>;
  detail_pairs?: Array<{ label: string; value: string }>;
};

export function inferBienesRaicesPlanTier(x: BienesRaicesListaListingLike): "business_standard" | "business_plus" | null {
  if (x.category !== "bienes-raices") return null;
  const sellerType = x.sellerType ?? x.seller_type ?? "personal";
  if (sellerType !== "business") return null;
  const tier = x.rentasTier ?? x.rentas_tier ?? x.servicesTier;
  if (tier === "negocio") return "business_plus";
  if (tier === "plus" || tier === "premium") return "business_plus";
  return "business_standard";
}

function normalizePairs(x: BienesRaicesListaListingLike): Array<{ label: string; value: string }> {
  const raw = x.detailPairs ?? x.detail_pairs;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => ({
      label: String(p?.label ?? "").trim(),
      value: String(p?.value ?? "").trim(),
    }))
    .filter((p) => p.label && p.value);
}

function pickPair(pairs: Array<{ label: string; value: string }>, test: (lab: string) => boolean): string {
  const hit = pairs.find((p) => test((p.label ?? "").toLowerCase()));
  return (hit?.value ?? "").trim();
}

function highlightChipsFromFeatureTags(
  featureTags: Array<{ label: string; value: string }>,
  lang: BrListaLang
): string[] {
  const out: string[] = [];
  for (const t of featureTags) {
    const lab = (t.label ?? "").toLowerCase();
    const v = (t.value ?? "").trim();
    if (!v || /^https?:\/\//i.test(v)) continue;
    if (/comodidades|amenities/i.test(lab)) {
      const parts = v.includes("|") ? v.split("|") : v.split(/[,;\n]/);
      for (const s of parts) {
        const z = s.trim();
        if (z) out.push(z);
      }
    } else if (!/tour|video|virtual|utilities available|servicios disponibles/i.test(lab)) {
      out.push(v);
    }
  }
  return out.slice(0, 5);
}

function hasProVideoMarker(blurbEs: string, blurbEn: string): boolean {
  const blob = `${blurbEs}\n${blurbEn}`;
  return /\[LEONIX_PRO_VIDEO\]|\[LEONIX_PRO_VIDEO_2\]|— Video \(Pro\) —/i.test(blob);
}

function iconForQuickFact(labelLower: string): string {
  if (/rec[aá]maras|bedrooms?/.test(labelLower)) return "🛏️";
  if (/ba[ñn]os|bathrooms?/.test(labelLower)) return "🛁";
  if (/pies|sq|superficie|m²|cuadrados|ft/i.test(labelLower)) return "📏";
  if (/estacionamiento|parking|garage/i.test(labelLower)) return "🚗";
  if (/terreno|lot/i.test(labelLower)) return "🌿";
  if (/niveles|levels|pisos/i.test(labelLower)) return "🏠";
  if (/año|year built|construc/i.test(labelLower)) return "📅";
  if (/tipo|type|subtipo|subtype/i.test(labelLower)) return "🏷️";
  return "•";
}

export type BienesRaicesListaCardModel = {
  heroUrl: string | null;
  mediaCount: number;
  hasProVideo: boolean;
  isNegocio: boolean;
  isSold: boolean;
  brPlanTier: "business_standard" | "business_plus" | null;
  businessName: string;
  agentName: string;
  /** Brokerage / office brand from `business_meta.negocioNombreCorreduria` when present. */
  brokerageName: string;
  quickFacts: Array<{ label: string; value: string; icon: string }>;
  highlightChips: string[];
  addressLine: string;
  neighborhoodLine: string;
  locationSecondary: string;
  approximateLocation: boolean;
  trustCaption: string | null;
};

/** Primary branch badge for grid/row cards (data-backed: seller type + plan tier). */
export function brListaPrimaryBranchBadge(
  lang: BrListaLang,
  m: Pick<BienesRaicesListaCardModel, "isNegocio" | "brPlanTier">
): string {
  if (!m.isNegocio) {
    return lang === "es" ? "Leonix · Propietario" : "Leonix · Owner";
  }
  if (m.brPlanTier === "business_plus") {
    return lang === "es" ? "Leonix · Negocio" : "Leonix · Business";
  }
  return lang === "es" ? "Negocio" : "Business";
}

export function buildBienesRaicesListaCardModel(
  x: BienesRaicesListaListingLike,
  lang: BrListaLang
): BienesRaicesListaCardModel {
  const pairs = normalizePairs(x);
  const { quickFacts: qf, featureTags } = partitionBienesRaicesPreviewDetailPairs(pairs, lang);

  const quickFacts = qf.slice(0, 5).map((p) => ({
    ...p,
    icon: iconForQuickFact((p.label ?? "").toLowerCase()),
  }));

  const addressLine =
    pickPair(pairs, (lab) => /direcci[oó]n|address/i.test(lab)) || "";
  const neighborhoodLine =
    pickPair(pairs, (lab) => /vecindad|neighborhood|colonia|zona urbana/i.test(lab)) || "";

  const approximateLocation = pairs.some((p) =>
    /aproximad|approx\.?\s*loc|ubicaci[oó]n aproximada|approximate (location|address)/i.test(`${p.label} ${p.value}`)
  );

  const imgs = (x.images ?? x.photos ?? []).filter((u): u is string => typeof u === "string" && u.trim() !== "");
  const heroUrl = imgs[0] ?? null;
  const mediaCount = imgs.length;

  const isNegocio = x.sellerType === "business" || x.seller_type === "business";
  const isSold = String(x.status ?? "").toLowerCase() === "sold";
  const brPlanTier = inferBienesRaicesPlanTier(x);
  const meta = parseBusinessMeta(x.business_meta ?? null);
  const businessName = (
    x.businessName ??
    x.business_name ??
    meta?.negocioNombre ??
    ""
  )
    .trim();
  const agentName = (meta?.negocioAgente ?? "").trim();
  const brokerageName = (meta?.negocioNombreCorreduria ?? "").trim();

  const highlightChips = highlightChipsFromFeatureTags(featureTags, lang);

  const locParts = [addressLine, neighborhoodLine].filter(Boolean);
  const locationSecondary = locParts.join(locParts.length === 2 ? " · " : "");

  const trustCaption = !isNegocio
    ? lang === "es"
      ? "Listado de propietario en Leonix"
      : "Owner listing on Leonix"
    : lang === "es"
      ? "Listado comercial Leonix"
      : "Leonix business listing";

  return {
    heroUrl,
    mediaCount,
    hasProVideo: hasProVideoMarker(x.blurb.es, x.blurb.en) || Boolean((x as { hasVideo?: boolean }).hasVideo),
    isNegocio,
    isSold,
    brPlanTier,
    businessName,
    agentName,
    brokerageName,
    quickFacts,
    highlightChips,
    addressLine,
    neighborhoodLine,
    locationSecondary,
    approximateLocation,
    trustCaption,
  };
}

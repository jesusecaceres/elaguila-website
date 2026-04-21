import type { EnVentaAnuncioDTO } from "../shared/types/enVentaListing.types";
import { departmentLabel, findSubcategory, getArticuloLabel } from "../shared/fields/enVentaTaxonomy";

const CONDITION_LABEL: Record<string, { es: string; en: string }> = {
  new: { es: "Nuevo", en: "New" },
  "like-new": { es: "Como nuevo", en: "Like new" },
  like_new: { es: "Como nuevo", en: "Like new" },
  excellent: { es: "Excelente estado", en: "Excellent" },
  good: { es: "Bueno", en: "Good" },
  fair: { es: "Regular", en: "Fair" },
  poor: { es: "Para repuesto", en: "For parts" },
  used: { es: "Usado", en: "Used" },
};

function conditionLabel(raw: string | null | undefined, lang: "es" | "en"): string | null {
  const k = (raw ?? "").trim().toLowerCase();
  if (!k) return null;
  const hit = CONDITION_LABEL[k];
  if (hit) return hit[lang];
  const legacy = (raw ?? "").trim();
  return legacy || null;
}

function buildCategoryLine(dto: EnVentaAnuncioDTO, effectiveDeptKey: string | null, lang: "es" | "en"): string | null {
  const dept = (effectiveDeptKey ?? dto.departmentKey ?? "").trim();
  const sub = (dto.subKey ?? "").trim();
  const art = (dto.articleKey ?? "").trim();
  if (dept && sub) {
    const row = findSubcategory(dept, sub);
    if (row) return `${departmentLabel(dept, lang)} · ${row.label[lang]}`;
  }
  if (dept && art) return `${departmentLabel(dept, lang)} · ${getArticuloLabel(dept, art, lang)}`;
  if (dept) return departmentLabel(dept, lang);
  return null;
}

function fulfillmentChip(dto: EnVentaAnuncioDTO, lang: "es" | "en"): string | null {
  const { pickup, shipping, delivery } = dto.fulfillment;
  const meetup = dto.meetupOffered;
  if (!pickup && !shipping && !delivery && !meetup) return null;
  if (lang === "es") {
    const parts: string[] = [];
    if (shipping) parts.push("Envío");
    if (pickup) parts.push("recogida");
    if (delivery) parts.push("entrega local");
    if (meetup) parts.push("encuentro");
    if (parts.length >= 2 && shipping && pickup) return "Entrega y local disponible";
    return parts.join(" · ");
  }
  const en: string[] = [];
  if (shipping) en.push("Shipping");
  if (pickup) en.push("pickup");
  if (delivery) en.push("local delivery");
  if (meetup) en.push("meetup");
  if (en.length >= 2 && shipping && pickup) return "Shipping & local pickup";
  return en.join(" · ");
}

export type EnVentaResultsCardModel = {
  id: string;
  plan: "free" | "pro";
  boosted: boolean;
  title: string;
  priceText: string;
  locationText: string;
  postedAgo: string;
  conditionLabel: string | null;
  categoryLine: string | null;
  fulfillmentChip: string | null;
  heroImage: string | null;
  /** Images after cover — used for Pro thumbnail strip. */
  extraImageUrls: string[];
  extraThumbOverflow: number;
  showVideoBadge: boolean;
  showViews: boolean;
  views: number;
  sellerKindLabel: string | null;
  negotiableChip: boolean;
};

/**
 * Normalizes `EnVentaAnuncioDTO` + browse context into a display-ready results card model.
 */
export function buildEnVentaResultsCardModel(
  dto: EnVentaAnuncioDTO,
  opts: { lang: "es" | "en"; effectiveDeptKey: string | null; boosted: boolean }
): EnVentaResultsCardModel {
  const { lang, effectiveDeptKey, boosted } = opts;
  const plan = dto.planTier;
  const images = Array.isArray(dto.images) ? dto.images.filter((u) => typeof u === "string" && u.trim()) : [];
  const heroImage = images[0] ?? null;
  const extras = images.slice(1);
  const stripCap = 3;
  const extraThumbOverflow = extras.length > stripCap ? extras.length - stripCap : 0;
  const extraImageUrls = extras.slice(0, stripCap);

  const zip = dto.zip?.trim();
  const locationText =
    zip && dto.city ? `${dto.city}, ${zip}` : dto.city.trim() || (lang === "es" ? "Ubicación por confirmar" : "Location TBD");

  const sellerKindLabel =
    dto.sellerKind === "business"
      ? dto.businessName?.trim() || (lang === "es" ? "Negocio" : "Business")
      : dto.sellerKind === "individual"
        ? lang === "es"
          ? "Particular"
          : "Individual"
        : null;

  return {
    id: dto.id,
    plan,
    boosted,
    title: dto.title[lang].trim() || (lang === "es" ? "Sin título" : "Untitled"),
    priceText: dto.priceLabel[lang],
    locationText,
    postedAgo: dto.postedAgo[lang],
    conditionLabel: conditionLabel(dto.conditionKey, lang),
    categoryLine: buildCategoryLine(dto, effectiveDeptKey, lang),
    fulfillmentChip: fulfillmentChip(dto, lang),
    heroImage,
    extraImageUrls,
    extraThumbOverflow,
    showVideoBadge: plan === "pro" && dto.hasListingVideo,
    showViews: plan === "pro" && dto.views > 0,
    views: dto.views,
    sellerKindLabel,
    negotiableChip: dto.negotiable,
  };
}

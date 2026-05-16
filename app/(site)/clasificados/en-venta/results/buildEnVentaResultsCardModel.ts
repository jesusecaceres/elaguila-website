import type { EnVentaAnuncioDTO } from "../shared/types/enVentaListing.types";
import {
  enVentaCategoryLine,
  enVentaConditionDisplay,
  enVentaFulfillmentSummary,
} from "../mapping/appendEnVentaDetailPairs";

export type EnVentaResultsCardModel = {
  id: string;
  plan: "free" | "pro";
  /** Staff spotlight / `Leonix:promoted` — not the same as republish ordering. */
  featuredHighlight: boolean;
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
  opts: { lang: "es" | "en"; effectiveDeptKey: string | null; featuredHighlight: boolean }
): EnVentaResultsCardModel {
  const { lang, effectiveDeptKey, featuredHighlight } = opts;
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
    featuredHighlight,
    title: dto.title[lang].trim() || (lang === "es" ? "Sin título" : "Untitled"),
    priceText: dto.priceLabel[lang],
    locationText,
    postedAgo: dto.postedAgo[lang],
    conditionLabel: enVentaConditionDisplay(dto.conditionKey, lang),
    categoryLine: enVentaCategoryLine(
      {
        departmentKey: effectiveDeptKey ?? dto.departmentKey,
        subKey: dto.subKey,
        articleKey: dto.articleKey,
      },
      lang
    ),
    fulfillmentChip: enVentaFulfillmentSummary({ ...dto.fulfillment, meetup: dto.meetupOffered }, lang),
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

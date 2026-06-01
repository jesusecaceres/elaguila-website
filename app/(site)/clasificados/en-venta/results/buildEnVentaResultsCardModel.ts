import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { formatPriceInputDisplay } from "@/app/clasificados/publicar/en-venta/free/application/helpers/priceInput";
import {
  enVentaCategoryLine,
  enVentaConditionDisplay,
  enVentaFulfillmentSummary,
} from "../mapping/appendEnVentaDetailPairs";
import {
  EN_VENTA_PREVIEW_MAX_PHOTOS,
  getOrderedEnVentaImageUrls,
} from "../preview/buildEnVentaPreviewModel";
import { resolveEnVentaVideoUrl } from "../shared/utils/enVentaVideoEmbed";
import { resolveEnVentaHeroImageUrl } from "../shared/utils/resolveEnVentaListingImageUrls";
import type { EnVentaAnuncioDTO } from "../shared/types/enVentaListing.types";

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
  const heroImage = resolveEnVentaHeroImageUrl(images, {
    muxPlaybackId: dto.muxPlaybackId,
    videoUrl: dto.listingVideoUrl,
  });
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

/**
 * Maps preview draft state into the same card model used on results browse.
 * No fake views/saves — `showViews` stays false; `postedAgo` is a preview label.
 */
export function buildEnVentaResultsCardModelFromDraftState(
  state: EnVentaFreeApplicationState,
  opts: { lang: "es" | "en"; plan: "free" | "pro" }
): EnVentaResultsCardModel {
  const { lang, plan } = opts;
  const maxPhotos = plan === "pro" ? EN_VENTA_PREVIEW_MAX_PHOTOS.pro : EN_VENTA_PREVIEW_MAX_PHOTOS.free;
  const images = getOrderedEnVentaImageUrls(state).slice(0, maxPhotos);
  const slot = state.listingVideoSlots?.[0];
  const videoUrl = resolveEnVentaVideoUrl({
    muxPlaybackId: slot?.playbackId ?? null,
    muxPlaybackUrl: slot?.playbackUrl ?? null,
    externalUrl: state.listingVideoUrl?.trim() || null,
  });
  const heroImage = resolveEnVentaHeroImageUrl(images, {
    muxPlaybackId: slot?.playbackId ?? null,
    muxThumbnailUrl: slot?.thumbnailUrl ?? null,
    videoUrl,
  });
  const extras = images.slice(1);
  const stripCap = 3;
  const extraThumbOverflow = extras.length > stripCap ? extras.length - stripCap : 0;
  const extraImageUrls = extras.slice(0, stripCap);

  const zip = state.zip?.trim();
  const city = state.city?.trim() ?? "";
  const locationText =
    zip && city ? `${city}, ${zip}` : city || (lang === "es" ? "Ubicación por confirmar" : "Location TBD");

  let priceText = "";
  if (state.priceIsFree) {
    priceText = lang === "es" ? "Gratis" : "Free";
  } else if (state.price?.trim()) {
    priceText = `$${formatPriceInputDisplay(state.price)} USD`;
  } else {
    priceText = lang === "es" ? "Precio por definir" : "Price TBD";
  }

  const sellerKindLabel =
    state.seller_kind === "business"
      ? lang === "es"
        ? "Negocio"
        : "Business"
      : state.seller_kind === "individual"
        ? lang === "es"
          ? "Particular"
          : "Individual"
        : null;

  const dept = state.rama?.trim() ?? "";
  const sub = state.evSub?.trim() ?? "";
  const itemType = state.itemType?.trim() ?? "";

  return {
    id: "preview-draft",
    plan,
    featuredHighlight: false,
    title: state.title?.trim() || (lang === "es" ? "Sin título" : "Untitled"),
    priceText,
    locationText,
    postedAgo: lang === "es" ? "Vista previa" : "Preview",
    conditionLabel: enVentaConditionDisplay(state.condition, lang),
    categoryLine: enVentaCategoryLine({ departmentKey: dept, subKey: sub, articleKey: itemType }, lang),
    fulfillmentChip: enVentaFulfillmentSummary(
      {
        shipping: state.shipping,
        pickup: state.pickup,
        meetup: state.meetup,
        delivery: state.localDelivery,
      },
      lang
    ),
    heroImage,
    extraImageUrls,
    extraThumbOverflow,
    showVideoBadge: plan === "pro" && Boolean(videoUrl),
    showViews: false,
    views: 0,
    sellerKindLabel,
    negotiableChip: state.negotiable === "yes" && !state.priceIsFree,
  };
}

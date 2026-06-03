import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { getOrderedEnVentaImageUrls } from "../../preview/buildEnVentaPreviewModel";

/** Non-media fields that must survive preview → edit round-trips (static audit contract). */
export const EN_VENTA_DRAFT_TEXT_FIELD_KEYS = [
  "rama",
  "evSub",
  "itemType",
  "condition",
  "title",
  "priceIsFree",
  "price",
  "negotiable",
  "description",
  "quantity",
  "brand",
  "model",
  "city",
  "zip",
  "pickup",
  "meetup",
  "localDelivery",
  "shipping",
  "shippingNotes",
  "pickupDetailNotes",
  "meetupDetailNotes",
  "localDeliveryDetailNotes",
  "seller_kind",
  "displayName",
  "phone",
  "email",
  "whatsapp",
  "contactMethod",
  "confirmListingAccurate",
  "confirmPhotosRepresentItem",
  "confirmCommunityRules",
  "wearNotes",
  "accessoriesNotes",
  "itemExtraDetails",
] as const satisfies ReadonlyArray<keyof EnVentaFreeApplicationState>;

export function enVentaDraftHasTextProgress(state: EnVentaFreeApplicationState): boolean {
  return Boolean(
    state.title.trim() ||
      state.rama.trim() ||
      state.itemType.trim() ||
      state.condition.trim() ||
      state.description.trim() ||
      state.city.trim() ||
      state.zip.trim() ||
      state.displayName.trim() ||
      state.phone.trim() ||
      state.email.trim() ||
      state.whatsapp.trim() ||
      String(state.price).trim() ||
      state.priceIsFree ||
      state.wearNotes.trim() ||
      state.accessoriesNotes.trim() ||
      state.itemExtraDetails.trim() ||
      state.confirmListingAccurate ||
      state.confirmPhotosRepresentItem ||
      state.confirmCommunityRules
  );
}

export function enVentaDraftHasMediaProgress(state: EnVentaFreeApplicationState): boolean {
  if (getOrderedEnVentaImageUrls(state).length > 0) return true;
  if (state.listingVideoUrl.trim()) return true;
  for (const sl of state.listingVideoSlots) {
    if (sl.status !== "idle" || sl.assetId.trim() || sl.playbackUrl.trim()) return true;
  }
  return false;
}

export function pickEnVentaDraftMediaFields(
  source: EnVentaFreeApplicationState
): Pick<
  EnVentaFreeApplicationState,
  "images" | "primaryImageIndex" | "listingVideoUrl" | "listingVideoSlots"
> {
  return {
    images: source.images,
    primaryImageIndex: source.primaryImageIndex,
    listingVideoUrl: source.listingVideoUrl,
    listingVideoSlots: source.listingVideoSlots,
  };
}

/** SessionStorage-safe copy — text + metadata without large base64 photo payloads. */
export function buildEnVentaSlimSessionDraft(
  state: EnVentaFreeApplicationState
): EnVentaFreeApplicationState {
  return {
    ...state,
    images: [],
  };
}

/**
 * Merge two draft snapshots — prefer populated text from `preferred`, media from whichever has photos/video.
 */
export function mergeEnVentaDraftPreferComplete(
  base: EnVentaFreeApplicationState,
  overlay: EnVentaFreeApplicationState
): EnVentaFreeApplicationState {
  const baseHasText = enVentaDraftHasTextProgress(base);
  const overlayHasText = enVentaDraftHasTextProgress(overlay);
  const textSource = overlayHasText && !baseHasText ? overlay : baseHasText ? base : overlay;

  const baseHasMedia = enVentaDraftHasMediaProgress(base);
  const overlayHasMedia = enVentaDraftHasMediaProgress(overlay);
  const mediaSource = overlayHasMedia && !baseHasMedia ? overlay : baseHasMedia ? base : overlay;

  return {
    ...textSource,
    ...pickEnVentaDraftMediaFields(mediaSource),
    primaryImageIndex: mediaSource.primaryImageIndex,
  };
}

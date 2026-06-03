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

export function enVentaDraftPhotoCount(state: EnVentaFreeApplicationState): number {
  return getOrderedEnVentaImageUrls(state).length;
}

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

function slotHasVideoProgress(slot: EnVentaFreeApplicationState["listingVideoSlots"][number]): boolean {
  return (
    slot.status !== "idle" ||
    Boolean(slot.assetId.trim()) ||
    Boolean(slot.playbackUrl.trim()) ||
    Boolean(slot.playbackId.trim())
  );
}

export function enVentaDraftHasVideoProgress(state: EnVentaFreeApplicationState): boolean {
  if (state.listingVideoUrl.trim()) return true;
  return state.listingVideoSlots.some(slotHasVideoProgress);
}

export function enVentaDraftHasMediaProgress(state: EnVentaFreeApplicationState): boolean {
  return enVentaDraftPhotoCount(state) > 0 || enVentaDraftHasVideoProgress(state);
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
 * Merge two draft snapshots — text from the richer text source; photos/video independently
 * so a slim session payload with video does not suppress photo recovery from IDB/memory.
 */
export function mergeEnVentaDraftPreferComplete(
  base: EnVentaFreeApplicationState,
  overlay: EnVentaFreeApplicationState
): EnVentaFreeApplicationState {
  const baseHasText = enVentaDraftHasTextProgress(base);
  const overlayHasText = enVentaDraftHasTextProgress(overlay);
  const textSource = overlayHasText && !baseHasText ? overlay : baseHasText ? base : overlay;

  const basePhotos = enVentaDraftPhotoCount(base);
  const overlayPhotos = enVentaDraftPhotoCount(overlay);
  const photoSource =
    overlayPhotos > basePhotos
      ? overlay
      : basePhotos > overlayPhotos
        ? base
        : basePhotos > 0
          ? base
          : overlay;

  const baseHasVideo = enVentaDraftHasVideoProgress(base);
  const overlayHasVideo = enVentaDraftHasVideoProgress(overlay);
  const videoSource =
    overlayHasVideo && !baseHasVideo ? overlay : baseHasVideo && !overlayHasVideo ? base : overlay;

  return {
    ...textSource,
    images: photoSource.images,
    primaryImageIndex: photoSource.primaryImageIndex,
    listingVideoUrl: videoSource.listingVideoUrl,
    listingVideoSlots: videoSource.listingVideoSlots,
  };
}

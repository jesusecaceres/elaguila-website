import {
  createEmptyEnVentaFreeState,
  type EnVentaFreeApplicationState,
  type EnVentaMuxVideoSlotState,
} from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { formatEnVentaPhoneInput } from "./enVentaPhoneDisplay";
import { collectEnVentaVideoUrlsFromState } from "./enVentaVideoUrls";

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

const CONTACT_METHODS = new Set<EnVentaFreeApplicationState["contactMethod"]>([
  "phone",
  "email",
  "both",
  "whatsapp",
]);

function sanitizeMuxSlotDuration(slot: EnVentaMuxVideoSlotState): EnVentaMuxVideoSlotState {
  if (slot.durationSeconds == null) return slot;
  const n = Number(slot.durationSeconds);
  if (!Number.isFinite(n)) {
    return { ...slot, durationSeconds: null };
  }
  return { ...slot, durationSeconds: Math.round(n) };
}

function clearMuxSlotForExternalUrls(slot: EnVentaMuxVideoSlotState): EnVentaMuxVideoSlotState {
  return {
    ...slot,
    uploadId: "",
    assetId: "",
    playbackId: "",
    playbackUrl: "",
    thumbnailUrl: "",
    durationSeconds: null,
    status: "idle",
    progressPct: 0,
    fileName: "",
    errorMessage: "",
  };
}

/** Coerce persisted/partial drafts so preview builders never call methods on undefined. */
export function normalizeEnVentaFreeApplicationState(
  input: EnVentaFreeApplicationState
): EnVentaFreeApplicationState {
  const base = createEmptyEnVentaFreeState();
  const images = Array.isArray(input.images)
    ? input.images.filter((x): x is string => typeof x === "string")
    : [];
  const primaryImageIndex =
    typeof input.primaryImageIndex === "number" && Number.isFinite(input.primaryImageIndex)
      ? Math.max(0, Math.floor(input.primaryImageIndex))
      : 0;

  let listingVideoSlots = base.listingVideoSlots;
  if (Array.isArray(input.listingVideoSlots) && input.listingVideoSlots.length === 2) {
    listingVideoSlots = [
      sanitizeMuxSlotDuration({ ...base.listingVideoSlots[0], ...input.listingVideoSlots[0] }),
      sanitizeMuxSlotDuration({ ...base.listingVideoSlots[1], ...input.listingVideoSlots[1] }),
    ];
  }

  const explicitVideoUrls = Array.isArray(input.videoUrls)
    ? input.videoUrls.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];
  if (explicitVideoUrls.length > 0) {
    listingVideoSlots = [
      clearMuxSlotForExternalUrls(listingVideoSlots[0]),
      clearMuxSlotForExternalUrls(listingVideoSlots[1]),
    ];
  }

  const contactMethod = CONTACT_METHODS.has(input.contactMethod) ? input.contactMethod : base.contactMethod;

  const merged: EnVentaFreeApplicationState = {
    ...base,
    ...input,
    rama: str(input.rama),
    evSub: str(input.evSub),
    itemType: str(input.itemType),
    condition: str(input.condition),
    title: str(input.title),
    priceIsFree: Boolean(input.priceIsFree),
    price: str(input.price),
    negotiable: input.negotiable === "yes" ? "yes" : "",
    description: str(input.description),
    quantity: str(input.quantity),
    brand: str(input.brand),
    model: str(input.model),
    images,
    primaryImageIndex,
    city: str(input.city),
    zip: str(input.zip),
    pickup: Boolean(input.pickup),
    meetup: Boolean(input.meetup),
    localDelivery: Boolean(input.localDelivery),
    shipping: Boolean(input.shipping),
    shippingNotes: str(input.shippingNotes),
    pickupDetailNotes: str(input.pickupDetailNotes),
    meetupDetailNotes: str(input.meetupDetailNotes),
    localDeliveryDetailNotes: str(input.localDeliveryDetailNotes),
    seller_kind:
      input.seller_kind === "business" ? "business" : input.seller_kind === "individual" ? "individual" : "",
    displayName: str(input.displayName),
    phone: input.phone ? formatEnVentaPhoneInput(str(input.phone)) : "",
    email: str(input.email),
    whatsapp: input.whatsapp ? formatEnVentaPhoneInput(str(input.whatsapp)) : "",
    contactMethod,
    videoUrls: Array.isArray(input.videoUrls)
      ? input.videoUrls.filter((x): x is string => typeof x === "string")
      : base.videoUrls,
    listingVideoUrl: explicitVideoUrls.length > 0 ? "" : str(input.listingVideoUrl),
    listingVideoSlots,
    confirmListingAccurate: Boolean(input.confirmListingAccurate),
    confirmPhotosRepresentItem: Boolean(input.confirmPhotosRepresentItem),
    confirmCommunityRules: Boolean(input.confirmCommunityRules),
    wearNotes: str(input.wearNotes),
    accessoriesNotes: str(input.accessoriesNotes),
    itemExtraDetails: str(input.itemExtraDetails),
  };

  return { ...merged, videoUrls: collectEnVentaVideoUrlsFromState(merged) };
}

/**
 * Free lane application state — aligns with `EnVentaDraftDetails` + listing core fields.
 * Persisted mapping to DB / preview is a later pipeline step; this is the application source of truth.
 */

export type EnVentaMuxVideoStatus =
  | "idle"
  | "requesting_upload"
  | "uploading"
  | "preparing"
  | "ready"
  | "error";

export type EnVentaMuxVideoSlotState = {
  slot: 0 | 1;
  uploadId: string;
  assetId: string;
  playbackId: string;
  playbackUrl: string;
  thumbnailUrl: string;
  durationSeconds: number | null;
  status: EnVentaMuxVideoStatus;
  progressPct: number;
  fileName: string;
  errorMessage: string;
};

export type EnVentaFreeApplicationState = {
  rama: string;
  evSub: string;
  itemType: string;
  condition: string;
  title: string;
  /** When true, listing is free; `price` stays empty and is not used. */
  priceIsFree: boolean;
  price: string;
  negotiable: "" | "yes";
  description: string;
  quantity: string;
  brand: string;
  model: string;
  images: string[];
  /** Which thumbnail index is the principal listing image (0-based). */
  primaryImageIndex: number;
  /** Raw or canonical California city (CityAutocomplete normalizes on blur). */
  city: string;
  zip: string;
  pickup: boolean;
  meetup: boolean;
  localDelivery: boolean;
  shipping: boolean;
  shippingNotes: string;
  /** Shown when pickup is enabled — where / how buyers collect. */
  pickupDetailNotes: string;
  /** Shown when meetup is enabled — area or landmark, not exact address unless you choose. */
  meetupDetailNotes: string;
  /** Shown when local delivery is enabled — radius, fees, or timing if you want. */
  localDeliveryDetailNotes: string;
  /** Free lane fixes `individual`; Pro may set `business` where applicable. */
  seller_kind: "individual" | "business" | "";
  displayName: string;
  phone: string;
  email: string;
  whatsapp: string;
  contactMethod: "phone" | "email" | "both" | "whatsapp";
  /** Placeholder for Pro video; Free UI does not collect video. */
  listingVideoUrl: string;
  /** Slot-based Mux-ready video metadata (up to 2 videos). */
  listingVideoSlots: [EnVentaMuxVideoSlotState, EnVentaMuxVideoSlotState];
  /** Intake confirmations before submit wiring. */
  confirmListingAccurate: boolean;
  confirmPhotosRepresentItem: boolean;
  confirmCommunityRules: boolean;
  wearNotes: string;
  accessoriesNotes: string;
  /** Specs, measurements, compatibility — not duplicate condition notes. */
  itemExtraDetails: string;
};

export function createEmptyEnVentaFreeState(): EnVentaFreeApplicationState {
  const emptySlot = (slot: 0 | 1): EnVentaMuxVideoSlotState => ({
    slot,
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
  });

  return {
    rama: "",
    evSub: "",
    itemType: "",
    condition: "",
    title: "",
    priceIsFree: false,
    price: "",
    negotiable: "",
    description: "",
    quantity: "",
    brand: "",
    model: "",
    images: [],
    primaryImageIndex: 0,
    city: "",
    zip: "",
    pickup: false,
    meetup: false,
    localDelivery: false,
    shipping: false,
    shippingNotes: "",
    pickupDetailNotes: "",
    meetupDetailNotes: "",
    localDeliveryDetailNotes: "",
    seller_kind: "individual",
    displayName: "",
    phone: "",
    email: "",
    whatsapp: "",
    contactMethod: "both",
    listingVideoUrl: "",
    listingVideoSlots: [emptySlot(0), emptySlot(1)],
    confirmListingAccurate: false,
    confirmPhotosRepresentItem: false,
    confirmCommunityRules: false,
    wearNotes: "",
    accessoriesNotes: "",
    itemExtraDetails: "",
  };
}

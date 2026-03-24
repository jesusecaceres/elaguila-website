/**
 * Free lane application state — aligns with `EnVentaDraftDetails` + listing core fields.
 * Persisted mapping to DB / preview is a later pipeline step; this is the application source of truth.
 */

export type EnVentaFreeApplicationState = {
  rama: string;
  evSub: string;
  itemType: string;
  condition: string;
  title: string;
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
  seller_kind: "individual" | "business" | "";
  displayName: string;
  phone: string;
  email: string;
  whatsapp: string;
  contactMethod: "phone" | "email" | "both" | "whatsapp";
  /** Placeholder for Pro video; Free UI does not collect video. */
  listingVideoUrl: string;
  /** Intake confirmations before submit wiring. */
  confirmListingAccurate: boolean;
  confirmPhotosRepresentItem: boolean;
  confirmCommunityRules: boolean;
  conditionDetails: string;
  wearNotes: string;
  accessoriesNotes: string;
  itemExtraDetails: string;
};

export function createEmptyEnVentaFreeState(): EnVentaFreeApplicationState {
  return {
    rama: "",
    evSub: "",
    itemType: "",
    condition: "",
    title: "",
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
    seller_kind: "",
    displayName: "",
    phone: "",
    email: "",
    whatsapp: "",
    contactMethod: "both",
    listingVideoUrl: "",
    confirmListingAccurate: false,
    confirmPhotosRepresentItem: false,
    confirmCommunityRules: false,
    conditionDetails: "",
    wearNotes: "",
    accessoriesNotes: "",
    itemExtraDetails: "",
  };
}

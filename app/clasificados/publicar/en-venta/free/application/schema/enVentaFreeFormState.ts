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
  city: string;
  neighborhood: string;
  zip: string;
  approximateLocationOk: boolean;
  pickup: boolean;
  meetup: boolean;
  localDelivery: boolean;
  shipping: boolean;
  shippingNotes: string;
  seller_kind: "individual" | "business" | "";
  displayName: string;
  phone: string;
  email: string;
  whatsapp: string;
  contactMethod: "phone" | "email" | "both";
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
    city: "",
    neighborhood: "",
    zip: "",
    approximateLocationOk: true,
    pickup: false,
    meetup: false,
    localDelivery: false,
    shipping: false,
    shippingNotes: "",
    seller_kind: "",
    displayName: "",
    phone: "",
    email: "",
    whatsapp: "",
    contactMethod: "both",
    conditionDetails: "",
    wearNotes: "",
    accessoriesNotes: "",
    itemExtraDetails: "",
  };
}

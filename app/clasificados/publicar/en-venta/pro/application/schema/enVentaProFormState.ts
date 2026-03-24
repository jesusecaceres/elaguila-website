import {
  createEmptyEnVentaFreeState,
  type EnVentaFreeApplicationState,
} from "../../../free/application/schema/enVentaFreeFormState";

export type EnVentaProApplicationState = EnVentaFreeApplicationState & {
  businessDisplayName: string;
  legalBusinessName: string;
  logoUrl: string;
  sellerAvatarUrl: string;
  storeDescription: string;
  tagline: string;
  businessPhone: string;
  businessEmail: string;
  businessWhatsapp: string;
  website: string;
  serviceArea: string;
  pickupAddressOrZone: string;
  responseTimeNotes: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  otherProfileUrl: string;
  returnNotes: string;
  warrantyNotes: string;
  appointmentNotes: string;
  sku: string;
  internalRef: string;
  inventoryQty: string;
  storePolicyNotes: string;
  sellerBio: string;
  storeExperience: string;
  languages: string;
  businessHours: string;
};

export function createEmptyEnVentaProState(): EnVentaProApplicationState {
  return {
    ...createEmptyEnVentaFreeState(),
    businessDisplayName: "",
    legalBusinessName: "",
    logoUrl: "",
    sellerAvatarUrl: "",
    storeDescription: "",
    tagline: "",
    businessPhone: "",
    businessEmail: "",
    businessWhatsapp: "",
    website: "",
    serviceArea: "",
    pickupAddressOrZone: "",
    responseTimeNotes: "",
    facebookUrl: "",
    instagramUrl: "",
    tiktokUrl: "",
    youtubeUrl: "",
    otherProfileUrl: "",
    returnNotes: "",
    warrantyNotes: "",
    appointmentNotes: "",
    sku: "",
    internalRef: "",
    inventoryQty: "",
    storePolicyNotes: "",
    sellerBio: "",
    storeExperience: "",
    languages: "",
    businessHours: "",
  };
}

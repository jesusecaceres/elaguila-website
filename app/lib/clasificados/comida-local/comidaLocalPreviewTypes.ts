import type { ComidaLocalValidationIssue } from "./comidaLocalTypes";

export type ComidaLocalPreviewContactActionId =
  | "call"
  | "sms"
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "location";

export type ComidaLocalPreviewActionVariant =
  | "primary"
  | "whatsapp"
  | "social"
  | "secondary";

export type ComidaLocalPreviewSocialPlatform = "instagram" | "facebook" | "tiktok";

export type ComidaLocalPreviewContactAction = {
  id: ComidaLocalPreviewContactActionId;
  label: string;
  href: string;
  variant: ComidaLocalPreviewActionVariant;
  platform?: ComidaLocalPreviewSocialPlatform;
};

export type ComidaLocalPreviewChip = {
  key: string;
  label: string;
};

export type ComidaLocalPreviewImage = {
  /** Safe http(s) or same-session blob only — never data: or fake URLs. */
  src: string;
  alt: string;
  kind: "main" | "logo" | "gallery";
};

export type ComidaLocalPreviewSectionFlags = {
  showQueVendes: boolean;
  showContact: boolean;
  showLocationAvailability: boolean;
  showService: boolean;
  showPayment: boolean;
  showExtras: boolean;
  showGallery: boolean;
};

/** Lightweight preview/detail view model — no DB ids, slugs, or fake engagement. */
export type ComidaLocalPreviewVm = {
  businessName: string;
  foodTypeChips: ComidaLocalPreviewChip[];
  locationLine: string;
  queVendes: string;
  availabilityNote: string;
  locationNote: string;
  serviceChips: ComidaLocalPreviewChip[];
  paymentChips: ComidaLocalPreviewChip[];
  priceLevelLabel: string;
  languageLabels: string[];
  contactActions: ComidaLocalPreviewContactAction[];
  mainImage: ComidaLocalPreviewImage | null;
  logoImage: ComidaLocalPreviewImage | null;
  galleryImages: ComidaLocalPreviewImage[];
  sections: ComidaLocalPreviewSectionFlags;
  previewIssues: ComidaLocalValidationIssue[];
  previewReady: boolean;
};

import type { ComidaLocalValidationIssue } from "./comidaLocalTypes";

export type ComidaLocalPreviewContactActionId =
  | "call"
  | "sms"
  | "whatsapp"
  | "email"
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

export type ComidaLocalPreviewLink = {
  label: string;
  href: string;
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
  showHighlights: boolean;
  showAdditionalWebsites: boolean;
  showBusinessAddress: boolean;
  showHours: boolean;
  /** Gate C-027/C-038 — dedicated mobile/meal-prep order-or-contact link, distinct from
   * `showAdditionalWebsites`. */
  showOrderLink: boolean;
  /** Gate C-032/C-033 — pop-up/feria/mercado event or market schedule note. */
  showEventSchedule: boolean;
  /** Gate C-035/C-036 — catering service radius and/or structured event info. */
  showCateringDetails: boolean;
  /** Gate C-037 — meal-prep recurring-schedule note. */
  showMealPrepSchedule: boolean;
};

/** Lightweight preview/detail view model — no DB ids, slugs, or fake engagement. */
export type ComidaLocalPreviewVm = {
  businessName: string;
  foodTypeChips: ComidaLocalPreviewChip[];
  businessTypeLabel: string;
  locationLine: string;
  queVendes: string;
  availabilityNote: string;
  locationNote: string;
  serviceChips: ComidaLocalPreviewChip[];
  paymentChips: ComidaLocalPreviewChip[];
  priceLevelLabel: string;
  languageLabels: string[];
  highlightChips: ComidaLocalPreviewChip[];
  additionalWebsites: ComidaLocalPreviewLink[];
  /** Gate D9 — real open/closed truth from structured weekly hours, or null when unset. */
  isOpenNow: boolean | null;
  hoursLines: { dayLabel: string; text: string }[];
  /** Gate D6 — only populated when the owner opted to show it publicly. */
  businessAddressLine: string;
  /** Gate C-027/C-038 — dedicated order/contact link (mobile bucket, private chef, or meal prep). */
  orderLink: ComidaLocalPreviewLink | null;
  /** Gate C-032/C-033 — pop-up/feria/mercado event or market schedule note. */
  eventScheduleNote: string;
  /** Gate C-035 — catering service radius/area, distinct from the general location line. */
  cateringServiceRadiusNote: string;
  /** Gate C-036 — structured catering event info (sizes, minimums, lead time). */
  cateringEventInfoNote: string;
  /** Gate C-037 — meal-prep recurring-schedule note. */
  mealPrepScheduleNote: string;
  contactActions: ComidaLocalPreviewContactAction[];
  mainImage: ComidaLocalPreviewImage | null;
  logoImage: ComidaLocalPreviewImage | null;
  galleryImages: ComidaLocalPreviewImage[];
  sections: ComidaLocalPreviewSectionFlags;
  previewIssues: ComidaLocalValidationIssue[];
  previewReady: boolean;
};

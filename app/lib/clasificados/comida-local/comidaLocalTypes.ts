/**
 * Comida Local — draft types only (no DB / publish integration in FOOD-L2).
 */

import type { BusinessWeeklyHours } from "@/app/lib/businessHours/computeBusinessHoursStatus";
import type { AdditionalWebsiteEntry } from "@/app/lib/additionalWebsites/additionalWebsiteEntry";

export type { BusinessWeeklyHours };

export type ComidaLocalContactMethod = "phone" | "whatsapp";

export type ComidaLocalFoodType =
  | "tacos"
  | "pupusas"
  | "tamales"
  | "antojitos"
  | "postres"
  | "bebidas"
  | "mariscos"
  | "comida-casera"
  | "comida-eventos"
  | "otro";

/** Gate D4 — expanded from the original 3-value set; existing "pickup"/"delivery"/"in_person"
 * drafts remain valid, these are additive new options in the same field. */
export type ComidaLocalServiceOption =
  | "pickup"
  | "delivery"
  | "in_person"
  | "preorder"
  | "scheduled_pickup"
  | "custom_order"
  | "catering"
  | "events"
  | "mobile"
  | "market_pickup"
  | "meal_prep"
  | "limited_daily_quantity"
  | "other";

/** Gate D2 — seller/business-type registry, distinct from `foodType` (cuisine). */
export type ComidaLocalBusinessType =
  | "food_truck"
  | "puesto"
  | "comida_casa"
  | "pop_up"
  | "feria"
  | "catering"
  | "meal_prep"
  | "panaderia"
  | "chef_privado"
  | "delivery_only"
  | "mercado"
  | "otro";

/** Gate D15 — Comida Local specific highlights (not Restaurant amenities). */
export type ComidaLocalHighlightOption =
  | "hecho_en_casa"
  | "receta_familiar"
  | "ingredientes_frescos"
  | "halal"
  | "kosher"
  | "vegetariano"
  | "vegano"
  | "sin_gluten"
  | "hecho_al_momento"
  | "porciones_limitadas"
  | "catering"
  | "pedidos_personalizados"
  | "entrega_disponible"
  | "pickup_disponible"
  | "familiar"
  | "local"
  /** Additive — daily-freshness claim, distinct from the generic "ingredientes_frescos". */
  | "fresco_diario"
  /** Additive — ingredients-specific local-sourcing claim, distinct from the business-level "local". */
  | "ingredientes_locales"
  /** Additive — same literal value as the `preorder` service option (dual-purpose value,
   * mirrors how "catering" already appears in both registries); a highlight-level claim. */
  | "preorder"
  /** Additive — weekend-availability claim. */
  | "disponible_fines_de_semana"
  | "otro";

export type ComidaLocalPaymentMethod =
  | "cash"
  | "zelle"
  | "cash_app"
  | "venmo"
  | "card"
  | "other";

export type ComidaLocalPriceLevel = "1" | "2" | "3";

/** Gate D8 — "otro" is additive; existing "es"/"en"/"bilingual" drafts remain valid as-is. */
export type ComidaLocalLanguageOption = "es" | "en" | "bilingual" | "otro";

export type ComidaLocalSocialPlatform = "instagram" | "facebook" | "tiktok";

export type ComidaLocalImageRole = "main" | "logo" | "gallery";

/** Uploaded image metadata only — no base64, blob, or File handles. */
export type ComidaLocalUploadedImage = {
  id: string;
  role: ComidaLocalImageRole;
  url: string;
  storagePath: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  altText?: string;
  uploadedAt: string;
};

/** Draft/publish image slot (uploaded metadata; legacy previewUrl tolerated on load). */
export type ComidaLocalImageDraft = ComidaLocalUploadedImage & {
  /** @deprecated FOOD-L2 placeholder — stripped on load; use `url`. */
  previewUrl?: string;
  /** @deprecated FOOD-L2 placeholder — use `storagePath`. */
  storageKey?: string;
};

export type ComidaLocalSectionKey =
  | "identidad"
  | "zona"
  | "que-vendes"
  | "contacto"
  | "ubicacion"
  | "extras"
  | "fotos";

export type ComidaLocalValidationIssue = {
  field: string;
  message: string;
  severity: "error" | "warning";
};

export type ComidaLocalDraft = {
  /** Stable id for draft media uploads and publish upsert. */
  draftListingId: string;
  businessName: string;
  foodType: ComidaLocalFoodType | "";
  foodTypeCustom: string;
  /** Gate D2 — seller/business format (food truck, home kitchen, pop-up, etc.), distinct from foodType. */
  businessType: ComidaLocalBusinessType | "";
  /** @deprecated Legacy single free-text value. Superseded by `businessTypeCustomValues`
   * (array-backed add/remove chip list). Preserved read-only for backward compatibility —
   * a legacy draft with only this scalar populated is migrated into a one-element
   * `businessTypeCustomValues` on load; never written by the current UI. */
  businessTypeCustom: string;
  /** Array-backed "Other" seller-type values — Add button + independently-removable chips. */
  businessTypeCustomValues: string[];
  /** Canonical NorCal city slug/key — wired in FOOD-L3/FOOD-L6. */
  cityCanonical: string;
  /** Display city line while canonical autocomplete is deferred. */
  cityDisplay: string;
  zoneNote: string;
  primaryContactChoice: ComidaLocalContactMethod | "";
  phone: string;
  whatsapp: string;
  /** Gate D10 — real persisted email; wires the shared CtaActionSheet Correo modal. */
  email: string;
  queVendes: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  /** Gate Build D-S1 — real Google/Yelp review page URLs only (never an owner-typed rating,
   * review count, or fake verification). Reuses the shared Google/Yelp reputation drawer from
   * Build B; missing URL hides that provider. */
  googleReviewsUrl: string;
  yelpReviewsUrl: string;
  /** Gate D5 "Encuéntrame hoy" — today's/current location note+link. Never the permanent address. */
  locationNote: string;
  locationUrl: string;
  /** Gate C-027/C-038 — dedicated order/contact link for mobile-bucket sellers (food truck,
   * puesto, mercado, delivery-only, pop-up, feria) and private chefs (booking/quote requests).
   * Additive and distinct from the generic `additionalWebsites` list. */
  mobileOrderLinkUrl: string;
  /** Gate C-032/C-033 — lightweight freeform event/market schedule note for pop-up, feria, and
   * mercado (farmers-market) sellers. Additive; distinct from `locationNote` (today's location). */
  eventScheduleNote: string;
  /** Gate C-035 — catering service radius/area, distinct from the generic `zoneNote`. */
  cateringServiceRadiusNote: string;
  /** Gate C-036 — structured catering event info (sizes, minimums, lead time), distinct from
   * the generic freeform `queVendes` textarea. */
  cateringEventInfoNote: string;
  /** Gate C-037 — meal-prep recurring-schedule note, distinct from `weeklyHours`/`serviceOptions`. */
  mealPrepScheduleNote: string;
  /** Gate C-038 — dedicated meal-prep order URL, distinct from the generic `additionalWebsites`. */
  mealPrepOrderUrl: string;
  availabilityNote: string;
  /** Gate D9 — additive structured weekly hours; existing availabilityNote text is preserved
   * unchanged and still shown as a freeform note alongside the structured schedule. */
  weeklyHours: BusinessWeeklyHours;
  serviceOptions: ComidaLocalServiceOption[];
  /** @deprecated Legacy single free-text value. Superseded by
   * `serviceOptionOtherCustomValues` (array-backed add/remove chip list). Preserved read-only
   * for backward compatibility; never written by the current UI. */
  serviceOptionOtherCustom: string;
  /** Array-backed "Other" service-mode values — Add button + independently-removable chips. */
  serviceOptionOtherCustomValues: string[];
  /** Gate D6 — optional permanent business address, private by default. */
  businessAddressLine: string;
  showAddressPublicly: boolean;
  paymentMethods: ComidaLocalPaymentMethod[];
  paymentOtherNote: string;
  priceLevel: ComidaLocalPriceLevel | "";
  languages: ComidaLocalLanguageOption[];
  /** Gate D8 — free-text languages beyond the fixed es/en/bilingual chips. No arbitrary cap. */
  customLanguages: string[];
  /** Gate D15 — Comida Local specific highlights. */
  highlights: ComidaLocalHighlightOption[];
  /** @deprecated Legacy single free-text value. Superseded by `highlightsOtherCustomValues`
   * (array-backed add/remove chip list). Preserved read-only for backward compatibility;
   * never written by the current UI. */
  highlightsOtherCustom: string;
  /** Array-backed "Other" highlight values — Add button + independently-removable chips. */
  highlightsOtherCustomValues: string[];
  /** Gate D11 — repeatable additional links (order, menu, catering form, delivery partner, etc.). */
  additionalWebsites: ComidaLocalAdditionalWebsite[];
  mainPhoto: ComidaLocalImageDraft | null;
  logoImage: ComidaLocalImageDraft | null;
  galleryImages: ComidaLocalImageDraft[];
};

/** @deprecated Use the shared `AdditionalWebsiteEntry` directly — kept as an alias so existing
 * imports of `ComidaLocalAdditionalWebsite` continue to resolve unchanged. */
export type ComidaLocalAdditionalWebsite = AdditionalWebsiteEntry;

import { createEmptyComidaLocalDraft } from "./createEmptyComidaLocalDraft";
import {
  COMIDA_LOCAL_GALLERY_MAX,
} from "./comidaLocalConstants";
import {
  ensureComidaLocalDraftListingId,
  normalizeComidaLocalImageFromStorage,
  normalizeComidaLocalImageListFromStorage,
} from "./comidaLocalImageNormalize";
import type {
  ComidaLocalAdditionalWebsite,
  ComidaLocalBusinessType,
  ComidaLocalDraft,
  ComidaLocalFoodType,
  ComidaLocalHighlightOption,
  ComidaLocalLanguageOption,
  ComidaLocalPaymentMethod,
  ComidaLocalPriceLevel,
  ComidaLocalServiceOption,
} from "./comidaLocalTypes";

export const COMIDA_LOCAL_DRAFT_STORAGE_KEY = "leonix:comida-local:draft:v1";

/**
 * Globalization Package A closure — per-listing edit workspace key. A listing-edit draft and
 * a new-ad draft must NEVER share a key (draftWorkspaceContract Rule 1): editing a published
 * listing hydrates into this key and leaves any in-progress new-ad draft untouched.
 */
export function comidaLocalEditWorkspaceStorageKey(listingId: string): string {
  return `leonix:comida-local:edit:v1:${listingId.trim()}`;
}

const FOOD_TYPES = new Set([
  "tacos",
  "pupusas",
  "tamales",
  "antojitos",
  "postres",
  "bebidas",
  "mariscos",
  "comida-casera",
  "comida-eventos",
  "otro",
  "",
]);

const SERVICE_VALUES = new Set<ComidaLocalServiceOption>([
  "pickup",
  "delivery",
  "in_person",
  "preorder",
  "scheduled_pickup",
  "custom_order",
  "catering",
  "events",
  "mobile",
  "market_pickup",
  "meal_prep",
  "limited_daily_quantity",
  "other",
]);
const PAYMENT_VALUES = new Set<ComidaLocalPaymentMethod>([
  "cash",
  "zelle",
  "cash_app",
  "venmo",
  "card",
  "other",
]);
const LANGUAGE_VALUES = new Set<ComidaLocalLanguageOption>(["es", "en", "bilingual", "otro"]);
const CUSTOM_LANGUAGES_MAX = 8;

function safeCustomLanguages(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const entry of v) {
    const s = safeString(entry, 48).trim();
    if (!s) continue;
    out.push(s);
    if (out.length >= CUSTOM_LANGUAGES_MAX) break;
  }
  return out;
}

const CUSTOM_OTHER_VALUES_MAX = 8;

/** Gate C-023/C-053/C-068 — generic safe loader for the array-backed "Other" custom-value
 * lists (business type, service option, highlights). Mirrors safeCustomLanguages above. */
function safeCustomOtherValues(v: unknown, maxLen = 80, maxCount = CUSTOM_OTHER_VALUES_MAX): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const entry of v) {
    const s = safeString(entry, maxLen).trim();
    if (!s) continue;
    out.push(s);
    if (out.length >= maxCount) break;
  }
  return out;
}

/** Backward-compat migration only — a legacy draft that only ever had the scalar "Other"
 * field populated (pre-array-chip UI) is migrated non-destructively into a one-element array.
 * The legacy scalar itself is left untouched/unaffected in the caller's returned draft. */
function migrateLegacyCustomScalarIntoArray(arrayValues: string[], legacyScalar: string): string[] {
  if (arrayValues.length > 0) return arrayValues;
  const s = legacyScalar.trim();
  return s ? [s] : [];
}
const PRICE_VALUES = new Set<ComidaLocalPriceLevel>(["1", "2", "3"]);

const BUSINESS_TYPES = new Set<ComidaLocalBusinessType | "">([
  "food_truck",
  "puesto",
  "comida_casa",
  "pop_up",
  "feria",
  "catering",
  "meal_prep",
  "panaderia",
  "chef_privado",
  "delivery_only",
  "mercado",
  "otro",
  "",
]);

const HIGHLIGHT_VALUES = new Set<ComidaLocalHighlightOption>([
  "hecho_en_casa",
  "receta_familiar",
  "ingredientes_frescos",
  "halal",
  "kosher",
  "vegetariano",
  "vegano",
  "sin_gluten",
  "hecho_al_momento",
  "porciones_limitadas",
  "catering",
  "pedidos_personalizados",
  "entrega_disponible",
  "pickup_disponible",
  "familiar",
  "local",
  "fresco_diario",
  "ingredientes_locales",
  "preorder",
  "disponible_fines_de_semana",
  "otro",
]);

const ADDITIONAL_WEBSITES_MAX = 6;

const WEEKDAY_KEYS = new Set([
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]);

const TIME_RE = /^\d{1,2}:\d{2}$/;

function safeWeeklyHours(v: unknown): ComidaLocalDraft["weeklyHours"] {
  if (!isRecord(v)) return {};
  const out: ComidaLocalDraft["weeklyHours"] = {};
  for (const [day, sched] of Object.entries(v)) {
    if (!WEEKDAY_KEYS.has(day) || !isRecord(sched)) continue;
    const closed = sched.closed === true;
    const openTime = typeof sched.openTime === "string" && TIME_RE.test(sched.openTime) ? sched.openTime : undefined;
    const closeTime = typeof sched.closeTime === "string" && TIME_RE.test(sched.closeTime) ? sched.closeTime : undefined;
    out[day] = { closed, ...(openTime ? { openTime } : {}), ...(closeTime ? { closeTime } : {}) };
  }
  return out;
}

function safeAdditionalWebsites(v: unknown): ComidaLocalAdditionalWebsite[] {
  if (!Array.isArray(v)) return [];
  const out: ComidaLocalAdditionalWebsite[] = [];
  for (const entry of v) {
    if (!isRecord(entry)) continue;
    const label = safeString(entry.label, 60);
    const url = safeString(entry.url, 512);
    if (!label && !url) continue;
    out.push({ label, url });
    if (out.length >= ADDITIONAL_WEBSITES_MAX) break;
  }
  return out;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function safeString(v: unknown, max = 2000): string {
  if (typeof v !== "string") return "";
  return v.slice(0, max);
}


/** Merge parsed JSON with empty defaults; tolerant of malformed storage. */
export function mergeComidaLocalDraftFromStorage(parsed: unknown): ComidaLocalDraft {
  const base = createEmptyComidaLocalDraft();
  if (!isRecord(parsed)) return base;

  const foodTypeRaw = safeString(parsed.foodType, 40);
  const foodType = FOOD_TYPES.has(foodTypeRaw as ComidaLocalFoodType)
    ? (foodTypeRaw as ComidaLocalDraft["foodType"])
    : "";

  const businessTypeRaw = safeString(parsed.businessType, 40);
  const businessType = BUSINESS_TYPES.has(businessTypeRaw as ComidaLocalBusinessType | "")
    ? (businessTypeRaw as ComidaLocalDraft["businessType"])
    : "";

  const serviceOptions = Array.isArray(parsed.serviceOptions)
    ? parsed.serviceOptions
        .filter((v): v is ComidaLocalServiceOption =>
          typeof v === "string" && SERVICE_VALUES.has(v as ComidaLocalServiceOption)
        )
        .slice(0, 8)
    : [];

  const highlights = Array.isArray(parsed.highlights)
    ? parsed.highlights
        .filter((v): v is ComidaLocalHighlightOption =>
          typeof v === "string" && HIGHLIGHT_VALUES.has(v as ComidaLocalHighlightOption)
        )
        .slice(0, 12)
    : [];

  const paymentMethods = Array.isArray(parsed.paymentMethods)
    ? parsed.paymentMethods
        .filter((v): v is ComidaLocalPaymentMethod =>
          typeof v === "string" && PAYMENT_VALUES.has(v as ComidaLocalPaymentMethod)
        )
        .slice(0, 6)
    : [];

  const languages = Array.isArray(parsed.languages)
    ? parsed.languages.filter(
        (v): v is ComidaLocalLanguageOption =>
          typeof v === "string" && LANGUAGE_VALUES.has(v as ComidaLocalLanguageOption)
      )
    : [];

  const priceLevelRaw = safeString(parsed.priceLevel, 2);
  const priceLevel = PRICE_VALUES.has(priceLevelRaw as ComidaLocalPriceLevel)
    ? (priceLevelRaw as ComidaLocalPriceLevel)
    : "";

  // Legacy scalar "Other" fields — preserved as-is (never written by the current UI) and used
  // only as a non-destructive migration source when the array-backed field is still empty.
  const businessTypeCustomLegacy = safeString(parsed.businessTypeCustom, 80);
  const businessTypeCustomValues = migrateLegacyCustomScalarIntoArray(
    safeCustomOtherValues(parsed.businessTypeCustomValues, 80),
    businessTypeCustomLegacy,
  );
  const serviceOptionOtherCustomLegacy = safeString(parsed.serviceOptionOtherCustom, 80);
  const serviceOptionOtherCustomValues = migrateLegacyCustomScalarIntoArray(
    safeCustomOtherValues(parsed.serviceOptionOtherCustomValues, 80),
    serviceOptionOtherCustomLegacy,
  );
  const highlightsOtherCustomLegacy = safeString(parsed.highlightsOtherCustom, 80);
  const highlightsOtherCustomValues = migrateLegacyCustomScalarIntoArray(
    safeCustomOtherValues(parsed.highlightsOtherCustomValues, 80),
    highlightsOtherCustomLegacy,
  );

  return {
    ...base,
    draftListingId: ensureComidaLocalDraftListingId(safeString(parsed.draftListingId, 64)),
    businessName: safeString(parsed.businessName, 120),
    foodType,
    foodTypeCustom: safeString(parsed.foodTypeCustom, 80),
    businessType,
    businessTypeCustom: businessTypeCustomLegacy,
    businessTypeCustomValues,
    cityCanonical: safeString(parsed.cityCanonical, 80),
    cityDisplay: safeString(parsed.cityDisplay, 80),
    zoneNote: safeString(parsed.zoneNote, 120),
    primaryContactChoice:
      parsed.primaryContactChoice === "phone" || parsed.primaryContactChoice === "whatsapp"
        ? parsed.primaryContactChoice
        : "",
    phone: safeString(parsed.phone, 32),
    whatsapp: safeString(parsed.whatsapp, 32),
    email: safeString(parsed.email, 254),
    queVendes: safeString(parsed.queVendes, 2000),
    instagramUrl: safeString(parsed.instagramUrl, 512),
    facebookUrl: safeString(parsed.facebookUrl, 512),
    tiktokUrl: safeString(parsed.tiktokUrl, 512),
    locationNote: safeString(parsed.locationNote, 300),
    locationUrl: safeString(parsed.locationUrl, 512),
    mobileOrderLinkUrl: safeString(parsed.mobileOrderLinkUrl, 512),
    eventScheduleNote: safeString(parsed.eventScheduleNote, 160),
    cateringServiceRadiusNote: safeString(parsed.cateringServiceRadiusNote, 160),
    cateringEventInfoNote: safeString(parsed.cateringEventInfoNote, 400),
    mealPrepScheduleNote: safeString(parsed.mealPrepScheduleNote, 160),
    mealPrepOrderUrl: safeString(parsed.mealPrepOrderUrl, 512),
    availabilityNote: safeString(parsed.availabilityNote, 160),
    weeklyHours: safeWeeklyHours(parsed.weeklyHours),
    serviceOptions,
    serviceOptionOtherCustom: serviceOptionOtherCustomLegacy,
    serviceOptionOtherCustomValues,
    businessAddressLine: safeString(parsed.businessAddressLine, 200),
    showAddressPublicly: parsed.showAddressPublicly === true,
    paymentMethods,
    paymentOtherNote: safeString(parsed.paymentOtherNote, 80),
    priceLevel,
    languages,
    customLanguages: safeCustomLanguages(parsed.customLanguages),
    highlights,
    highlightsOtherCustom: highlightsOtherCustomLegacy,
    highlightsOtherCustomValues,
    additionalWebsites: safeAdditionalWebsites(parsed.additionalWebsites),
    mainPhoto: normalizeComidaLocalImageFromStorage(parsed.mainPhoto, "main"),
    logoImage: normalizeComidaLocalImageFromStorage(parsed.logoImage, "logo"),
    galleryImages: normalizeComidaLocalImageListFromStorage(parsed.galleryImages, "gallery").slice(
      0,
      COMIDA_LOCAL_GALLERY_MAX
    ),
  };
}

export function sanitizeComidaLocalDraftForStorage(draft: ComidaLocalDraft): ComidaLocalDraft {
  return mergeComidaLocalDraftFromStorage(draft);
}

export function loadComidaLocalDraftFromStorage(
  storageKey: string = COMIDA_LOCAL_DRAFT_STORAGE_KEY,
): ComidaLocalDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return mergeComidaLocalDraftFromStorage(parsed);
  } catch {
    return null;
  }
}

export function saveComidaLocalDraftToStorage(
  draft: ComidaLocalDraft,
  storageKey: string = COMIDA_LOCAL_DRAFT_STORAGE_KEY,
): void {
  if (typeof window === "undefined") return;
  try {
    const payload = sanitizeComidaLocalDraftForStorage(draft);
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    /* quota or private mode — ignore */
  }
}

export function clearComidaLocalDraftStorage(
  storageKey: string = COMIDA_LOCAL_DRAFT_STORAGE_KEY,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    /* ignore */
  }
}

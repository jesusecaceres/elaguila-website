import { createEmptyComidaLocalDraft } from "./createEmptyComidaLocalDraft";
import type {
  ComidaLocalDraft,
  ComidaLocalFoodType,
  ComidaLocalImageDraft,
  ComidaLocalLanguageOption,
  ComidaLocalPaymentMethod,
  ComidaLocalPriceLevel,
  ComidaLocalServiceOption,
} from "./comidaLocalTypes";

export const COMIDA_LOCAL_DRAFT_STORAGE_KEY = "leonix:comida-local:draft:v1";

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

const SERVICE_VALUES = new Set<ComidaLocalServiceOption>(["pickup", "delivery", "in_person"]);
const PAYMENT_VALUES = new Set<ComidaLocalPaymentMethod>([
  "cash",
  "zelle",
  "cash_app",
  "venmo",
  "card",
  "other",
]);
const LANGUAGE_VALUES = new Set<ComidaLocalLanguageOption>(["es", "en", "bilingual"]);
const PRICE_VALUES = new Set<ComidaLocalPriceLevel>(["1", "2", "3"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function safeString(v: unknown, max = 2000): string {
  if (typeof v !== "string") return "";
  return v.slice(0, max);
}

/** Never persist data: URLs or base64 in localStorage. */
function sanitizeImageDraft(raw: unknown): ComidaLocalImageDraft | null {
  if (!isRecord(raw)) return null;
  const previewUrl = safeString(raw.previewUrl, 512);
  const storageKey = safeString(raw.storageKey, 256);
  if (!previewUrl && !storageKey) return null;
  if (previewUrl.startsWith("data:") || previewUrl.includes("base64")) {
    return storageKey ? { previewUrl: "", storageKey } : null;
  }
  return { previewUrl, storageKey };
}

function sanitizeImageList(raw: unknown): ComidaLocalImageDraft[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => sanitizeImageDraft(item))
    .filter((x): x is ComidaLocalImageDraft => x !== null)
    .slice(0, 8);
}

/** Merge parsed JSON with empty defaults; tolerant of malformed storage. */
export function mergeComidaLocalDraftFromStorage(parsed: unknown): ComidaLocalDraft {
  const base = createEmptyComidaLocalDraft();
  if (!isRecord(parsed)) return base;

  const foodTypeRaw = safeString(parsed.foodType, 40);
  const foodType = FOOD_TYPES.has(foodTypeRaw as ComidaLocalFoodType)
    ? (foodTypeRaw as ComidaLocalDraft["foodType"])
    : "";

  const serviceOptions = Array.isArray(parsed.serviceOptions)
    ? parsed.serviceOptions
        .filter((v): v is ComidaLocalServiceOption =>
          typeof v === "string" && SERVICE_VALUES.has(v as ComidaLocalServiceOption)
        )
        .slice(0, 3)
    : [];

  const paymentMethods = Array.isArray(parsed.paymentMethods)
    ? parsed.paymentMethods
        .filter((v): v is ComidaLocalPaymentMethod =>
          typeof v === "string" && PAYMENT_VALUES.has(v as ComidaLocalPaymentMethod)
        )
        .slice(0, 6)
    : [];

  const languages = Array.isArray(parsed.languages)
    ? parsed.languages
        .filter((v): v is ComidaLocalLanguageOption =>
          typeof v === "string" && LANGUAGE_VALUES.has(v as ComidaLocalLanguageOption)
        )
        .slice(0, 3)
    : [];

  const priceLevelRaw = safeString(parsed.priceLevel, 2);
  const priceLevel = PRICE_VALUES.has(priceLevelRaw as ComidaLocalPriceLevel)
    ? (priceLevelRaw as ComidaLocalPriceLevel)
    : "";

  return {
    ...base,
    businessName: safeString(parsed.businessName, 120),
    foodType,
    foodTypeCustom: safeString(parsed.foodTypeCustom, 80),
    cityCanonical: safeString(parsed.cityCanonical, 80),
    cityDisplay: safeString(parsed.cityDisplay, 80),
    zoneNote: safeString(parsed.zoneNote, 120),
    primaryContactChoice:
      parsed.primaryContactChoice === "phone" || parsed.primaryContactChoice === "whatsapp"
        ? parsed.primaryContactChoice
        : "",
    phone: safeString(parsed.phone, 32),
    whatsapp: safeString(parsed.whatsapp, 32),
    queVendes: safeString(parsed.queVendes, 2000),
    instagramUrl: safeString(parsed.instagramUrl, 512),
    facebookUrl: safeString(parsed.facebookUrl, 512),
    tiktokUrl: safeString(parsed.tiktokUrl, 512),
    locationNote: safeString(parsed.locationNote, 300),
    locationUrl: safeString(parsed.locationUrl, 512),
    availabilityNote: safeString(parsed.availabilityNote, 160),
    serviceOptions,
    paymentMethods,
    paymentOtherNote: safeString(parsed.paymentOtherNote, 80),
    priceLevel,
    languages,
    mainPhoto: sanitizeImageDraft(parsed.mainPhoto),
    logoImage: sanitizeImageDraft(parsed.logoImage),
    galleryImages: sanitizeImageList(parsed.galleryImages),
  };
}

export function sanitizeComidaLocalDraftForStorage(draft: ComidaLocalDraft): ComidaLocalDraft {
  return mergeComidaLocalDraftFromStorage(draft);
}

export function loadComidaLocalDraftFromStorage(): ComidaLocalDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COMIDA_LOCAL_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return mergeComidaLocalDraftFromStorage(parsed);
  } catch {
    return null;
  }
}

export function saveComidaLocalDraftToStorage(draft: ComidaLocalDraft): void {
  if (typeof window === "undefined") return;
  try {
    const payload = sanitizeComidaLocalDraftForStorage(draft);
    window.localStorage.setItem(COMIDA_LOCAL_DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota or private mode — ignore */
  }
}

export function clearComidaLocalDraftStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(COMIDA_LOCAL_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

import {
  COMIDA_LOCAL_FOOD_TYPE_OPTIONS,
  COMIDA_LOCAL_LANGUAGE_OPTIONS,
  COMIDA_LOCAL_PRICE_LEVEL_OPTIONS,
  COMIDA_LOCAL_SERVICE_OPTIONS,
} from "./comidaLocalConstants";
import {
  buildComidaLocalSmsHref,
  buildComidaLocalTelHref,
  buildComidaLocalWhatsAppHref,
} from "./comidaLocalFormatting";
import {
  comidaLocalImageAltText,
  normalizeComidaLocalImageFromStorage,
} from "./comidaLocalImageNormalize";
import { resolveComidaLocalImageUrl } from "./comidaLocalImageValidation";
import { mapComidaLocalDraftToPreviewVm } from "./mapComidaLocalDraftToPreviewVm";
import type { ComidaLocalPreviewChip } from "./comidaLocalPreviewTypes";
import type {
  ComidaLocalPublicListingCardVm,
  ComidaLocalPublicListingDetailVm,
  ComidaLocalPublicListingRow,
} from "./comidaLocalPublicTypes";
import type {
  ComidaLocalDraft,
  ComidaLocalFoodType,
  ComidaLocalImageDraft,
  ComidaLocalLanguageOption,
  ComidaLocalPaymentMethod,
  ComidaLocalServiceOption,
} from "./comidaLocalTypes";

const FOOD_TYPE_VALUES = new Set(COMIDA_LOCAL_FOOD_TYPE_OPTIONS.map((o) => o.value));

function parseServiceOptions(raw: unknown): ComidaLocalServiceOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (v): v is ComidaLocalServiceOption =>
      v === "pickup" || v === "delivery" || v === "in_person"
  );
}

function parsePaymentMethods(raw: unknown): ComidaLocalPaymentMethod[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set<ComidaLocalPaymentMethod>([
    "cash",
    "zelle",
    "cash_app",
    "venmo",
    "card",
    "other",
  ]);
  return raw.filter((v): v is ComidaLocalPaymentMethod => typeof v === "string" && allowed.has(v as ComidaLocalPaymentMethod));
}

function parseLanguages(raw: unknown): ComidaLocalLanguageOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (v): v is ComidaLocalLanguageOption => v === "es" || v === "en" || v === "bilingual"
  );
}

function parseImage(raw: unknown, role: "main" | "logo" | "gallery"): ComidaLocalImageDraft | null {
  return normalizeComidaLocalImageFromStorage(raw, role);
}

function parseGallery(raw: unknown): ComidaLocalImageDraft[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => parseImage(item, "gallery"))
    .filter((x): x is ComidaLocalImageDraft => x !== null);
}

export function resolveComidaLocalFoodTypeLabel(row: ComidaLocalPublicListingRow): string {
  const ft = (row.food_type ?? "").trim();
  if (ft === "otro") {
    const custom = (row.food_type_custom ?? "").trim();
    return custom || "Otro";
  }
  const opt = COMIDA_LOCAL_FOOD_TYPE_OPTIONS.find((o) => o.value === ft);
  return (opt?.label ?? ft) || "Comida local";
}

export function buildComidaLocalLocationLine(row: ComidaLocalPublicListingRow): string {
  const city = row.city_display?.trim() || row.city_canonical?.trim() || "";
  const zone = row.zone_note?.trim() || "";
  if (city && zone) return `${city} · ${zone}`;
  return city || zone;
}

export function publicRowToComidaLocalDraft(row: ComidaLocalPublicListingRow): ComidaLocalDraft {
  const foodTypeRaw = (row.food_type ?? "").trim();
  const foodType = FOOD_TYPE_VALUES.has(foodTypeRaw as ComidaLocalFoodType)
    ? (foodTypeRaw as ComidaLocalDraft["foodType"])
    : foodTypeRaw
      ? "otro"
      : "";

  return {
    draftListingId: "",
    businessName: row.business_name?.trim() ?? "",
    foodType,
    foodTypeCustom: row.food_type_custom?.trim() ?? "",
    cityCanonical: row.city_canonical?.trim() ?? "",
    cityDisplay: row.city_display?.trim() ?? "",
    zoneNote: row.zone_note?.trim() ?? "",
    primaryContactChoice: "",
    phone: row.phone?.trim() ?? "",
    whatsapp: row.whatsapp?.trim() ?? "",
    queVendes: row.que_vendes?.trim() ?? "",
    instagramUrl: row.instagram_url?.trim() ?? "",
    facebookUrl: row.facebook_url?.trim() ?? "",
    tiktokUrl: row.tiktok_url?.trim() ?? "",
    locationNote: row.location_note?.trim() ?? "",
    locationUrl: row.location_url?.trim() ?? "",
    availabilityNote: row.availability_note?.trim() ?? "",
    serviceOptions: parseServiceOptions(row.service_options),
    paymentMethods: parsePaymentMethods(row.payment_methods),
    paymentOtherNote: row.payment_other_note?.trim() ?? "",
    priceLevel:
      row.price_level === "1" || row.price_level === "2" || row.price_level === "3"
        ? row.price_level
        : "",
    languages: parseLanguages(row.languages),
    mainPhoto: parseImage(row.main_photo, "main"),
    logoImage: parseImage(row.logo_image, "logo"),
    galleryImages: parseGallery(row.gallery_images),
  };
}

function excerpt(text: string, max = 140): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function buildCardChips(row: ComidaLocalPublicListingRow): ComidaLocalPreviewChip[] {
  const chips: ComidaLocalPreviewChip[] = [];
  const services = parseServiceOptions(row.service_options).slice(0, 1);
  for (const s of services) {
    const label = COMIDA_LOCAL_SERVICE_OPTIONS.find((o) => o.value === s)?.label ?? s;
    chips.push({ key: `svc-${s}`, label });
  }
  if (row.price_level === "1" || row.price_level === "2" || row.price_level === "3") {
    const label = COMIDA_LOCAL_PRICE_LEVEL_OPTIONS.find((o) => o.value === row.price_level)?.label ?? row.price_level;
    chips.push({ key: `price-${row.price_level}`, label });
  }
  const langs = parseLanguages(row.languages).slice(0, 1);
  for (const l of langs) {
    const label = COMIDA_LOCAL_LANGUAGE_OPTIONS.find((o) => o.value === l)?.label ?? l;
    chips.push({ key: `lang-${l}`, label });
  }
  return chips.slice(0, 3);
}

export function mapComidaLocalRowToCardVm(row: ComidaLocalPublicListingRow): ComidaLocalPublicListingCardVm {
  const foodTypeLabel = resolveComidaLocalFoodTypeLabel(row);
  const businessName = row.business_name?.trim() || "Puesto local";
  const main = parseImage(row.main_photo, "main");
  const mainImageSrc = resolveComidaLocalImageUrl(main);
  const slug = row.slug.trim();

  const leonix =
    typeof row.leonix_ad_id === "string" && row.leonix_ad_id.trim() ? row.leonix_ad_id.trim() : null;

  return {
    id: row.id,
    slug,
    leonixAdId: leonix,
    businessName,
    foodTypeLabel,
    locationLine: buildComidaLocalLocationLine(row),
    excerpt: excerpt(row.que_vendes ?? ""),
    mainImageSrc,
    mainImageAlt: main?.altText?.trim() || comidaLocalImageAltText(businessName, foodTypeLabel, "main"),
    chips: buildCardChips(row),
    detailHref: `/clasificados/comida-local/${encodeURIComponent(slug)}`,
    telHref: buildComidaLocalTelHref(row.phone ?? ""),
    whatsappHref: buildComidaLocalWhatsAppHref(row.whatsapp ?? "", businessName),
  };
}

export function mapComidaLocalRowToDetailVm(row: ComidaLocalPublicListingRow): ComidaLocalPublicListingDetailVm {
  const draft = publicRowToComidaLocalDraft(row);
  const vm = mapComidaLocalDraftToPreviewVm(draft);
  const leonix =
    typeof row.leonix_ad_id === "string" && row.leonix_ad_id.trim() ? row.leonix_ad_id.trim() : null;

  return {
    ...vm,
    previewIssues: [],
    previewReady: true,
    id: row.id,
    slug: row.slug.trim(),
    leonixAdId: leonix,
  };
}

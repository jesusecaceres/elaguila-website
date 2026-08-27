import {
  comidaLocalOptionLabel,
  COMIDA_LOCAL_BUSINESS_TYPE_OPTIONS,
  COMIDA_LOCAL_FOOD_TYPE_OPTIONS,
  COMIDA_LOCAL_HIGHLIGHT_OPTIONS,
  COMIDA_LOCAL_LANGUAGE_OPTIONS,
  COMIDA_LOCAL_PAYMENT_OPTIONS,
  COMIDA_LOCAL_PRICE_LEVEL_OPTIONS,
  COMIDA_LOCAL_SERVICE_OPTIONS,
  type ComidaLocalBilingualOption,
} from "./comidaLocalConstants";
import { resolveComidaLocalCityCanonical } from "./comidaLocalCity";
import { computeBusinessHoursStatus } from "@/app/lib/businessHours/computeBusinessHoursStatus";
import {
  buildComidaLocalSmsHref,
  buildComidaLocalTelHref,
  buildComidaLocalWhatsAppHref,
  isValidComidaLocalExternalUrl,
  normalizeComidaLocalPhoneDigits,
  normalizeComidaLocalSocialInput,
} from "./comidaLocalFormatting";
import { comidaLocalImageAltText } from "./comidaLocalImageNormalize";
import { resolveComidaLocalPreviewImageSrc } from "./comidaLocalPreviewImage";
import type {
  ComidaLocalPreviewChip,
  ComidaLocalPreviewContactAction,
  ComidaLocalPreviewImage,
  ComidaLocalPreviewLink,
  ComidaLocalPreviewVm,
} from "./comidaLocalPreviewTypes";
import type { ComidaLocalDraft, ComidaLocalImageDraft } from "./comidaLocalTypes";
import { validateComidaLocalDraftForPreview } from "./comidaLocalValidation";

function labelFromOptions<T extends string>(
  value: T,
  options: ReadonlyArray<{ value: T; label: string }>
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

/** Gate F2 — bilingual lookup for the three now-{labelEs,labelEn} option sets (business type,
 * service options, highlights). Stored `value` is unchanged; only the display label varies. */
function labelFromBilingualOptions<T extends string>(
  value: T,
  options: ReadonlyArray<ComidaLocalBilingualOption<T>>,
  lang: "es" | "en",
): string {
  const opt = options.find((o) => o.value === value);
  return opt ? comidaLocalOptionLabel(opt, lang) : value;
}

function buildFoodTypeChips(draft: ComidaLocalDraft): ComidaLocalPreviewChip[] {
  if (!draft.foodType) return [];
  if (draft.foodType === "otro") {
    const custom = draft.foodTypeCustom.trim();
    if (!custom) return [];
    return [{ key: "food-otro", label: custom }];
  }
  const label = labelFromOptions(draft.foodType, COMIDA_LOCAL_FOOD_TYPE_OPTIONS);
  return [{ key: draft.foodType, label }];
}

const WEEKDAY_ORDER_LABELS: Array<{ key: string; label: string }> = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

function buildHoursLines(draft: ComidaLocalDraft): { dayLabel: string; text: string }[] {
  const lines: { dayLabel: string; text: string }[] = [];
  for (const { key, label } of WEEKDAY_ORDER_LABELS) {
    const sched = draft.weeklyHours[key];
    if (!sched) continue;
    if (sched.closed) {
      lines.push({ dayLabel: label, text: "Cerrado" });
      continue;
    }
    if (sched.openTime && sched.closeTime) {
      lines.push({ dayLabel: label, text: `${sched.openTime} – ${sched.closeTime}` });
    }
  }
  return lines;
}

function buildBusinessTypeLabel(draft: ComidaLocalDraft, lang: "es" | "en"): string {
  if (!draft.businessType) return "";
  if (draft.businessType === "otro") return draft.businessTypeCustom.trim();
  return labelFromBilingualOptions(draft.businessType, COMIDA_LOCAL_BUSINESS_TYPE_OPTIONS, lang);
}

function buildHighlightChips(draft: ComidaLocalDraft, lang: "es" | "en"): ComidaLocalPreviewChip[] {
  return draft.highlights
    .map((v) => {
      if (v === "otro") {
        const custom = draft.highlightsOtherCustom.trim();
        return custom ? { key: "highlight-otro", label: custom } : null;
      }
      return { key: v, label: labelFromBilingualOptions(v, COMIDA_LOCAL_HIGHLIGHT_OPTIONS, lang) };
    })
    .filter((x): x is ComidaLocalPreviewChip => x !== null);
}

function buildAdditionalWebsiteLinks(draft: ComidaLocalDraft): ComidaLocalPreviewLink[] {
  return draft.additionalWebsites
    .map((site) => {
      const href = normalizeLocationHref(site.url);
      if (!href) return null;
      const label = site.label.trim() || href.replace(/^https?:\/\//i, "");
      return { label, href };
    })
    .filter((x): x is ComidaLocalPreviewLink => x !== null);
}

function buildLocationLine(draft: ComidaLocalDraft): string {
  const city =
    draft.cityDisplay.trim() ||
    resolveComidaLocalCityCanonical(draft) ||
    "";
  const zone = draft.zoneNote.trim();
  if (city && zone) return `${city} · ${zone}`;
  return city || zone;
}

function toPreviewImage(
  img: ComidaLocalImageDraft | null,
  kind: ComidaLocalPreviewImage["kind"],
  alt: string
): ComidaLocalPreviewImage | null {
  const src = resolveComidaLocalPreviewImageSrc(img);
  if (!src) return null;
  return { src, alt, kind };
}

function normalizeLocationHref(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
  return isValidComidaLocalExternalUrl(withScheme) ? withScheme : null;
}

function buildContactActions(draft: ComidaLocalDraft): ComidaLocalPreviewContactAction[] {
  const actions: ComidaLocalPreviewContactAction[] = [];
  const name = draft.businessName.trim();

  const phoneDigits = normalizeComidaLocalPhoneDigits(draft.phone);
  if (phoneDigits.length >= 10) {
    const tel = buildComidaLocalTelHref(draft.phone);
    if (tel) {
      actions.push({ id: "call", label: "Llamar", href: tel, variant: "primary" });
    }
    const sms = buildComidaLocalSmsHref(draft.phone);
    if (sms) {
      actions.push({ id: "sms", label: "Mensaje", href: sms, variant: "secondary" });
    }
  }

  const email = draft.email.trim();
  if (email) {
    actions.push({
      id: "email",
      label: "Correo",
      href: `mailto:${email}`,
      variant: "secondary",
    });
  }

  const waDigits = normalizeComidaLocalPhoneDigits(draft.whatsapp);
  if (waDigits.length >= 8) {
    const wa = buildComidaLocalWhatsAppHref(draft.whatsapp, name);
    if (wa) {
      actions.push({ id: "whatsapp", label: "WhatsApp", href: wa, variant: "whatsapp" });
    }
  }

  const ig = normalizeComidaLocalSocialInput(draft.instagramUrl, "instagram");
  if (ig) {
    actions.push({
      id: "instagram",
      label: "Instagram",
      href: ig,
      variant: "social",
      platform: "instagram",
    });
  }

  const fb = normalizeComidaLocalSocialInput(draft.facebookUrl, "facebook");
  if (fb) {
    actions.push({
      id: "facebook",
      label: "Facebook",
      href: fb,
      variant: "social",
      platform: "facebook",
    });
  }

  const tt = normalizeComidaLocalSocialInput(draft.tiktokUrl, "tiktok");
  if (tt) {
    actions.push({
      id: "tiktok",
      label: "TikTok",
      href: tt,
      variant: "social",
      platform: "tiktok",
    });
  }

  const loc = normalizeLocationHref(draft.locationUrl);
  if (loc) {
    actions.push({
      id: "location",
      label: "Dónde está hoy",
      href: loc,
      variant: "secondary",
    });
  }

  return actions;
}

function buildPaymentChips(draft: ComidaLocalDraft): ComidaLocalPreviewChip[] {
  return draft.paymentMethods.map((v) => {
    let label = labelFromOptions(v, COMIDA_LOCAL_PAYMENT_OPTIONS);
    if (v === "other" && draft.paymentOtherNote.trim()) {
      label = `Otro: ${draft.paymentOtherNote.trim()}`;
    }
    return { key: v, label };
  });
}

/** Map session/local draft → preview VM. No fake ids or engagement.
 * Gate F2 — `lang` defaults to "es" so every existing call site (preview client, which stays
 * Spanish-only) keeps its prior behavior unchanged; only the public detail read-path passes
 * "en" explicitly. */
export function mapComidaLocalDraftToPreviewVm(
  draft: ComidaLocalDraft,
  lang: "es" | "en" = "es",
): ComidaLocalPreviewVm {
  const previewIssues = validateComidaLocalDraftForPreview(draft);
  const businessName = draft.businessName.trim() || "Tu puesto";
  const queVendes = draft.queVendes.trim();
  const availabilityNote = draft.availabilityNote.trim();
  const locationNote = draft.locationNote.trim();
  const serviceChips: ComidaLocalPreviewChip[] = draft.serviceOptions.map((v) => {
    let label = labelFromBilingualOptions(v, COMIDA_LOCAL_SERVICE_OPTIONS, lang);
    if (v === "other" && draft.serviceOptionOtherCustom.trim()) {
      label = draft.serviceOptionOtherCustom.trim();
    }
    return { key: v, label };
  });
  const paymentChips = buildPaymentChips(draft);
  const priceLevelLabel = draft.priceLevel
    ? labelFromOptions(draft.priceLevel, COMIDA_LOCAL_PRICE_LEVEL_OPTIONS)
    : "";
  const languageLabels = [
    ...draft.languages
      .filter((v) => v !== "otro")
      .map((v) => labelFromOptions(v, COMIDA_LOCAL_LANGUAGE_OPTIONS)),
    ...draft.customLanguages,
  ];
  const contactActions = buildContactActions(draft);
  const businessTypeLabel = buildBusinessTypeLabel(draft, lang);
  const highlightChips = buildHighlightChips(draft, lang);
  const additionalWebsites = buildAdditionalWebsiteLinks(draft);
  const businessAddressLine = draft.showAddressPublicly ? draft.businessAddressLine.trim() : "";
  const hoursLines = buildHoursLines(draft);
  const isOpenNow =
    hoursLines.length > 0 ? computeBusinessHoursStatus(draft.weeklyHours).isOpenNow : null;
  const foodLabel = buildFoodTypeChips(draft)[0]?.label ?? "";
  const mainAlt =
    draft.mainPhoto?.altText?.trim() ||
    comidaLocalImageAltText(businessName, foodLabel, "main");
  const logoAlt =
    draft.logoImage?.altText?.trim() ||
    comidaLocalImageAltText(businessName, foodLabel, "logo");
  const mainImage = toPreviewImage(draft.mainPhoto, "main", mainAlt);
  const logoImage = toPreviewImage(draft.logoImage, "logo", logoAlt);
  const galleryImages = draft.galleryImages
    .map((g, i) =>
      toPreviewImage(
        g,
        "gallery",
        g.altText?.trim() || comidaLocalImageAltText(businessName, foodLabel, "gallery") + ` ${i + 1}`
      )
    )
    .filter((x): x is ComidaLocalPreviewImage => x !== null);

  const sections = {
    showQueVendes: Boolean(queVendes),
    showContact: contactActions.length > 0,
    showLocationAvailability: Boolean(locationNote || availabilityNote),
    showService: serviceChips.length > 0,
    showPayment: paymentChips.length > 0,
    showExtras: Boolean(priceLevelLabel || languageLabels.length > 0),
    showGallery: galleryImages.length > 0,
    showHighlights: highlightChips.length > 0,
    showAdditionalWebsites: additionalWebsites.length > 0,
    showBusinessAddress: Boolean(businessAddressLine),
    showHours: hoursLines.length > 0,
  };

  return {
    businessName,
    foodTypeChips: buildFoodTypeChips(draft),
    businessTypeLabel,
    locationLine: buildLocationLine(draft),
    queVendes,
    availabilityNote,
    locationNote,
    serviceChips,
    paymentChips,
    priceLevelLabel,
    languageLabels,
    highlightChips,
    additionalWebsites,
    businessAddressLine,
    isOpenNow,
    hoursLines,
    contactActions,
    mainImage,
    logoImage,
    galleryImages,
    sections,
    previewIssues,
    previewReady: previewIssues.length === 0,
  };
}

/** True when draft has enough content to show a meaningful preview page. */
export function comidaLocalDraftHasPreviewContent(draft: ComidaLocalDraft): boolean {
  return Boolean(
    draft.businessName.trim() ||
      draft.foodType ||
      draft.queVendes.trim() ||
      draft.cityDisplay.trim() ||
      resolveComidaLocalCityCanonical(draft)
  );
}

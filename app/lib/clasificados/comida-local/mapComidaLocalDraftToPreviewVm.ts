import {
  COMIDA_LOCAL_FOOD_TYPE_OPTIONS,
  COMIDA_LOCAL_LANGUAGE_OPTIONS,
  COMIDA_LOCAL_PAYMENT_OPTIONS,
  COMIDA_LOCAL_PRICE_LEVEL_OPTIONS,
  COMIDA_LOCAL_SERVICE_OPTIONS,
} from "./comidaLocalConstants";
import { resolveComidaLocalCityCanonical } from "./comidaLocalCity";
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

/** Map session/local draft → preview VM. No fake ids or engagement. */
export function mapComidaLocalDraftToPreviewVm(draft: ComidaLocalDraft): ComidaLocalPreviewVm {
  const previewIssues = validateComidaLocalDraftForPreview(draft);
  const businessName = draft.businessName.trim() || "Tu puesto";
  const queVendes = draft.queVendes.trim();
  const availabilityNote = draft.availabilityNote.trim();
  const locationNote = draft.locationNote.trim();
  const serviceChips: ComidaLocalPreviewChip[] = draft.serviceOptions.map((v) => ({
    key: v,
    label: labelFromOptions(v, COMIDA_LOCAL_SERVICE_OPTIONS),
  }));
  const paymentChips = buildPaymentChips(draft);
  const priceLevelLabel = draft.priceLevel
    ? labelFromOptions(draft.priceLevel, COMIDA_LOCAL_PRICE_LEVEL_OPTIONS)
    : "";
  const languageLabels = draft.languages.map((v) =>
    labelFromOptions(v, COMIDA_LOCAL_LANGUAGE_OPTIONS)
  );
  const contactActions = buildContactActions(draft);
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
  };

  return {
    businessName,
    foodTypeChips: buildFoodTypeChips(draft),
    locationLine: buildLocationLine(draft),
    queVendes,
    availabilityNote,
    locationNote,
    serviceChips,
    paymentChips,
    priceLevelLabel,
    languageLabels,
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

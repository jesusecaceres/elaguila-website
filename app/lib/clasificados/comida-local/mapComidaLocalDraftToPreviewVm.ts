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
import {
  comidaLocalTemporaryLocationOwnerWarning,
  evaluateComidaLocalTemporaryLocationFreshness,
  formatComidaLocalTemporaryLocationFreshness,
  readComidaLocalTemporaryLocationPayload,
} from "./comidaLocalTemporaryLocation";
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

function buildFoodTypeChips(draft: ComidaLocalDraft, lang: "es" | "en"): ComidaLocalPreviewChip[] {
  if (!draft.foodType) return [];
  if (draft.foodType === "otro") {
    const custom = draft.foodTypeCustom.trim();
    if (!custom) return [];
    return [{ key: "food-otro", label: custom }];
  }
  const label = labelFromBilingualOptions(draft.foodType, COMIDA_LOCAL_FOOD_TYPE_OPTIONS, lang);
  return [{ key: draft.foodType, label }];
}

const WEEKDAY_ORDER_LABELS: Array<{ key: string; labelEs: string; labelEn: string }> = [
  { key: "monday", labelEs: "Lunes", labelEn: "Monday" },
  { key: "tuesday", labelEs: "Martes", labelEn: "Tuesday" },
  { key: "wednesday", labelEs: "Miércoles", labelEn: "Wednesday" },
  { key: "thursday", labelEs: "Jueves", labelEn: "Thursday" },
  { key: "friday", labelEs: "Viernes", labelEn: "Friday" },
  { key: "saturday", labelEs: "Sábado", labelEn: "Saturday" },
  { key: "sunday", labelEs: "Domingo", labelEn: "Sunday" },
];

function buildHoursLines(draft: ComidaLocalDraft, lang: "es" | "en"): { dayLabel: string; text: string }[] {
  const en = lang === "en";
  const lines: { dayLabel: string; text: string }[] = [];
  for (const { key, labelEs, labelEn } of WEEKDAY_ORDER_LABELS) {
    const sched = draft.weeklyHours[key];
    if (!sched) continue;
    const dayLabel = en ? labelEn : labelEs;
    if (sched.closed) {
      lines.push({ dayLabel, text: en ? "Closed" : "Cerrado" });
      continue;
    }
    if (sched.openTime && sched.closeTime) {
      lines.push({ dayLabel, text: `${sched.openTime} – ${sched.closeTime}` });
    }
  }
  return lines;
}

function buildBusinessTypeLabel(draft: ComidaLocalDraft, lang: "es" | "en"): string {
  if (!draft.businessType) return "";
  if (draft.businessType === "otro") {
    const values = draft.businessTypeCustomValues.length
      ? draft.businessTypeCustomValues
      : draft.businessTypeCustom.trim()
        ? [draft.businessTypeCustom.trim()]
        : [];
    return values.join(", ");
  }
  return labelFromBilingualOptions(draft.businessType, COMIDA_LOCAL_BUSINESS_TYPE_OPTIONS, lang);
}

function buildHighlightChips(draft: ComidaLocalDraft, lang: "es" | "en"): ComidaLocalPreviewChip[] {
  return draft.highlights
    .flatMap((v): ComidaLocalPreviewChip[] => {
      if (v === "otro") {
        const values = draft.highlightsOtherCustomValues.length
          ? draft.highlightsOtherCustomValues
          : draft.highlightsOtherCustom.trim()
            ? [draft.highlightsOtherCustom.trim()]
            : [];
        return values.map((label, i) => ({ key: `highlight-otro-${i}`, label }));
      }
      return [{ key: v, label: labelFromBilingualOptions(v, COMIDA_LOCAL_HIGHLIGHT_OPTIONS, lang) }];
    });
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

function buildContactActions(
  draft: ComidaLocalDraft,
  lang: "es" | "en",
  /** Gate COMIDA-LOCAL-1 — false hides today's map/location link along with the note. */
  showTemporaryLocation: boolean,
): ComidaLocalPreviewContactAction[] {
  const en = lang === "en";
  const actions: ComidaLocalPreviewContactAction[] = [];
  const name = draft.businessName.trim();

  const phoneDigits = normalizeComidaLocalPhoneDigits(draft.phone);
  if (phoneDigits.length >= 10) {
    const tel = buildComidaLocalTelHref(draft.phone);
    if (tel) {
      actions.push({ id: "call", label: en ? "Call" : "Llamar", href: tel, variant: "primary" });
    }
    const sms = buildComidaLocalSmsHref(draft.phone);
    if (sms) {
      actions.push({ id: "sms", label: en ? "Message" : "Mensaje", href: sms, variant: "secondary" });
    }
  }

  const email = draft.email.trim();
  if (email) {
    actions.push({
      id: "email",
      label: en ? "Email" : "Correo",
      href: `mailto:${email}`,
      variant: "secondary",
    });
  }

  // Gate COMIDA-LOCAL-1 — the eligibility gate used to count digits through
  // `normalizeComidaLocalPhoneDigits`, which truncates to 10, so it measured a different number
  // than the href was built from. The shared contract now decides both: an unusable value
  // simply yields no href and therefore no action.
  const wa = buildComidaLocalWhatsAppHref(draft.whatsapp, name);
  if (wa) {
    actions.push({ id: "whatsapp", label: "WhatsApp", href: wa, variant: "whatsapp" });
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

  // Gate COMIDA-LOCAL-1 — the "Where I am today" link is part of the temporary-location
  // payload, so it expires with the note. A stale map pin is exactly as misleading as stale
  // text under a heading that says "today".
  const loc = showTemporaryLocation ? normalizeLocationHref(draft.locationUrl) : null;
  if (loc) {
    actions.push({
      id: "location",
      label: en ? "Where I am today" : "Dónde está hoy",
      href: loc,
      variant: "secondary",
    });
  }

  return actions;
}

function buildPaymentChips(draft: ComidaLocalDraft, lang: "es" | "en"): ComidaLocalPreviewChip[] {
  return draft.paymentMethods.map((v) => {
    let label = labelFromBilingualOptions(v, COMIDA_LOCAL_PAYMENT_OPTIONS, lang);
    if (v === "other" && draft.paymentOtherNote.trim()) {
      label = `${lang === "en" ? "Other" : "Otro"}: ${draft.paymentOtherNote.trim()}`;
    }
    return { key: v, label };
  });
}

/**
 * Gate COMIDA-LOCAL-1 — who is looking at this view model.
 *
 *  - "public"  (DEFAULT): the published vitrina. A temporary location that is expired,
 *              unstamped or otherwise unproven is REMOVED — never rendered under a heading
 *              that says "today". Defaulting to this means any future call site that forgets
 *              to pass a mode fails closed rather than leaking a stale location.
 *  - "owner":  the owner's own preview of their draft. Shows their current draft truth (the
 *              PM decision explicitly allows this) plus an explicit warning when that truth
 *              will NOT be public.
 */
export type ComidaLocalTemporaryLocationViewer = "public" | "owner";

export type MapComidaLocalDraftToPreviewVmOptions = {
  viewer?: ComidaLocalTemporaryLocationViewer;
  /** Injectable clock — the read-time expiry evaluation, and how tests pin it. */
  nowMs?: number;
  /**
   * Owner view only: true when this draft is bound to an already-published listing. An
   * "unstamped" temporary location means two different things — on a brand-new draft it is
   * simply not saved yet (publishing stamps it, nothing is wrong), while on a published listing
   * it means a pre-Gate-COMIDA-LOCAL-1 row whose note really is not public. The warning is only
   * shown in the second case so a first-time seller is never told something is broken.
   */
  ownerListingPublished?: boolean;
};

/** Map session/local draft → preview VM. No fake ids or engagement.
 * Gate F2 — `lang` defaults to "es" so every existing call site (preview client, which stays
 * Spanish-only) keeps its prior behavior unchanged; only the public detail read-path passes
 * "en" explicitly. */
export function mapComidaLocalDraftToPreviewVm(
  draft: ComidaLocalDraft,
  lang: "es" | "en" = "es",
  options: MapComidaLocalDraftToPreviewVmOptions = {},
): ComidaLocalPreviewVm {
  const previewIssues = validateComidaLocalDraftForPreview(draft, lang === "es");
  const businessName = draft.businessName.trim() || (lang === "en" ? "Your stand" : "Tu puesto");
  const queVendes = draft.queVendes.trim();
  const availabilityNote = draft.availabilityNote.trim();

  // Gate COMIDA-LOCAL-1 — "Encuéntrame Hoy" freshness, evaluated at READ time. This is the
  // whole expiry mechanism: no scheduler, no cron, no sweep. A public read simply refuses to
  // render a temporary location whose last real owner update is more than 24h old.
  // `availabilityNote` (standing availability) and `businessAddressLine` (the private permanent
  // address) are separate fields and are deliberately NOT affected by this gate.
  const viewer: ComidaLocalTemporaryLocationViewer = options.viewer ?? "public";
  const temporaryLocationPayload = readComidaLocalTemporaryLocationPayload(draft);
  const temporaryLocationFreshness = evaluateComidaLocalTemporaryLocationFreshness({
    payload: temporaryLocationPayload,
    stamp: draft.locationUpdatedAt,
    nowMs: options.nowMs ?? Date.now(),
  });
  const temporaryLocationIsFresh = temporaryLocationFreshness.state === "fresh";
  const showTemporaryLocation = viewer === "owner" ? true : temporaryLocationIsFresh;
  const locationNote = showTemporaryLocation ? draft.locationNote.trim() : "";
  const serviceChips: ComidaLocalPreviewChip[] = draft.serviceOptions.flatMap(
    (v): ComidaLocalPreviewChip[] => {
      if (v === "other") {
        const values = draft.serviceOptionOtherCustomValues.length
          ? draft.serviceOptionOtherCustomValues
          : draft.serviceOptionOtherCustom.trim()
            ? [draft.serviceOptionOtherCustom.trim()]
            : [];
        if (values.length === 0) {
          return [{ key: v, label: labelFromBilingualOptions(v, COMIDA_LOCAL_SERVICE_OPTIONS, lang) }];
        }
        return values.map((label, i) => ({ key: `${v}-${i}`, label }));
      }
      return [{ key: v, label: labelFromBilingualOptions(v, COMIDA_LOCAL_SERVICE_OPTIONS, lang) }];
    }
  );
  const paymentChips = buildPaymentChips(draft, lang);
  const priceLevelLabel = draft.priceLevel
    ? labelFromOptions(draft.priceLevel, COMIDA_LOCAL_PRICE_LEVEL_OPTIONS)
    : "";
  const languageLabels = [
    ...draft.languages
      .filter((v) => v !== "otro")
      .map((v) => labelFromBilingualOptions(v, COMIDA_LOCAL_LANGUAGE_OPTIONS, lang)),
    ...draft.customLanguages,
  ];
  const contactActions = buildContactActions(draft, lang, showTemporaryLocation);
  const businessTypeLabel = buildBusinessTypeLabel(draft, lang);
  const highlightChips = buildHighlightChips(draft, lang);
  const additionalWebsites = buildAdditionalWebsiteLinks(draft);
  const businessAddressLine = draft.showAddressPublicly ? draft.businessAddressLine.trim() : "";
  const eventScheduleNote = draft.eventScheduleNote.trim();
  const cateringServiceRadiusNote = draft.cateringServiceRadiusNote.trim();
  const cateringEventInfoNote = draft.cateringEventInfoNote.trim();
  const mealPrepScheduleNote = draft.mealPrepScheduleNote.trim();
  const orderLinkRaw = draft.mobileOrderLinkUrl.trim() || draft.mealPrepOrderUrl.trim();
  const orderLinkHref = normalizeLocationHref(orderLinkRaw);
  const orderLink: ComidaLocalPreviewLink | null = orderLinkHref
    ? { label: lang === "en" ? "Order / contact link" : "Enlace de pedidos / contacto", href: orderLinkHref }
    : null;
  const hoursLines = buildHoursLines(draft, lang);
  const isOpenNow =
    hoursLines.length > 0 ? computeBusinessHoursStatus(draft.weeklyHours).isOpenNow : null;
  const foodLabel = buildFoodTypeChips(draft, lang)[0]?.label ?? "";
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
    showOrderLink: Boolean(orderLink),
    showEventSchedule: Boolean(eventScheduleNote),
    showCateringDetails: Boolean(cateringServiceRadiusNote || cateringEventInfoNote),
    showMealPrepSchedule: Boolean(mealPrepScheduleNote),
  };

  return {
    businessName,
    foodTypeChips: buildFoodTypeChips(draft, lang),
    businessTypeLabel,
    locationLine: buildLocationLine(draft),
    queVendes,
    availabilityNote,
    locationNote,
    temporaryLocation: {
      state: temporaryLocationFreshness.state,
      updatedAtIso: temporaryLocationFreshness.updatedAtIso,
      // The freshness signal is only ever attached to a location that is actually being shown
      // as today's — never to an expired one the owner can still see in their own preview.
      freshnessLabel: temporaryLocationIsFresh
        ? formatComidaLocalTemporaryLocationFreshness(temporaryLocationFreshness.ageMs, lang)
        : "",
      ownerWarning:
        viewer === "owner" &&
        (temporaryLocationFreshness.state !== "unstamped" || options.ownerListingPublished === true)
          ? comidaLocalTemporaryLocationOwnerWarning(temporaryLocationFreshness.state, lang)
          : "",
      publiclyVisible: temporaryLocationIsFresh,
    },
    serviceChips,
    paymentChips,
    priceLevelLabel,
    languageLabels,
    highlightChips,
    additionalWebsites,
    businessAddressLine,
    orderLink,
    eventScheduleNote,
    cateringServiceRadiusNote,
    cateringEventInfoNote,
    mealPrepScheduleNote,
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

import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import type {
  RestaurantDetailShellData,
  ShellContactBlock,
  ShellGalleryItem,
  ShellHoursDetail,
  ShellPrimaryCta,
  ShellQuickInfoItem,
  ShellStackSection,
  ShellVenueGalleryBundle,
  ShellVenueGalleryCategory,
} from "../shell/restaurantDetailShellTypes";
import { normalizeRestaurantFeatures } from "../lib/restauranteFeaturesNormalization";
import { computePublishGallerySequence } from "./restauranteGalleryMediaSequence";
import { isRestauranteDisplayableImageRef, isRestauranteLocalVideoDataUrl } from "./restauranteMediaDisplay";
import {
  hasPrimaryContactPath,
  RESTAURANTE_SHELL_HIGHLIGHT_CAP,
  type RestauranteDaySchedule,
  type RestauranteServiceMode,
} from "./restauranteListingApplicationModel";
import { computeShellHoursPreview } from "./restauranteHoursPreview";
import {
  labelForBusinessType,
  labelForCuisine,
  labelForHighlight,
  labelForLanguage,
  labelForServiceMode,
  TAXONOMY_KEY_OTHER,
  TAXONOMY_KEY_OTHER_LANG,
} from "./restauranteTaxonomy";
import { formatPlatilloPriceBadge } from "./restauranteShellDisplayFormat";

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

const CHIP_LABEL_MAX = 52;

function clampChipLabel(s: string, max = CHIP_LABEL_MAX): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

function cuisineToken(key: string, custom?: string): string {
  const k = key.trim();
  if (k === TAXONOMY_KEY_OTHER) {
    if (nonEmpty(custom)) return clampChipLabel(custom!);
    return labelForCuisine(TAXONOMY_KEY_OTHER);
  }
  return labelForCuisine(k);
}

const LANG_QUICKINFO_MAX = 140;

function formatLanguagesForQuickInfo(d: RestauranteListingDraft): string {
  const langs = d.languagesSpoken?.filter(nonEmpty) ?? [];
  if (!langs.length) return "";
  const line = langs
    .map((k) => {
      if (k === TAXONOMY_KEY_OTHER_LANG) {
        if (nonEmpty(d.languageOtherCustom)) return `Otro: ${clampChipLabel(d.languageOtherCustom!, 36)}`;
        return labelForLanguage(k);
      }
      return labelForLanguage(k);
    })
    .join(" · ");
  return line.length > LANG_QUICKINFO_MAX ? `${line.slice(0, LANG_QUICKINFO_MAX - 1)}…` : line;
}

function formatServiceModesForQuickInfo(d: RestauranteListingDraft): string {
  const modes = d.serviceModes ?? [];
  if (!modes.length) return "";
  return modes
    .map((m) =>
      m === (TAXONOMY_KEY_OTHER as RestauranteServiceMode) && nonEmpty(d.serviceModeOtherCustom)
        ? `Otro: ${clampChipLabel(d.serviceModeOtherCustom!)}`
        : labelForServiceMode(m)
    )
    .join(" · ");
}

function buildTaxonomyChips(d: RestauranteListingDraft): { key: string; label: string }[] | undefined {
  const chips: { key: string; label: string }[] = [];
  if (d.businessType?.trim() === TAXONOMY_KEY_OTHER && nonEmpty(d.businessTypeCustom)) {
    chips.push({ key: "tax-bt", label: `Tipo: ${clampChipLabel(d.businessTypeCustom!)}` });
  }
  if (d.primaryCuisine?.trim() === TAXONOMY_KEY_OTHER && nonEmpty(d.primaryCuisineCustom)) {
    chips.push({ key: "tax-c0", label: `Cocina: ${clampChipLabel(d.primaryCuisineCustom!)}` });
  }
  if (d.secondaryCuisine?.trim() === TAXONOMY_KEY_OTHER && nonEmpty(d.secondaryCuisineCustom)) {
    chips.push({ key: "tax-c1", label: `Cocina 2.ª: ${clampChipLabel(d.secondaryCuisineCustom!)}` });
  }
  if ((d.additionalCuisines ?? []).includes(TAXONOMY_KEY_OTHER) && nonEmpty(d.additionalCuisineOtherCustom)) {
    chips.push({ key: "tax-ca", label: `Cocina +: ${clampChipLabel(d.additionalCuisineOtherCustom!)}` });
  }
  if ((d.languagesSpoken ?? []).includes(TAXONOMY_KEY_OTHER_LANG) && nonEmpty(d.languageOtherCustom)) {
    chips.push({ key: "tax-lang", label: `Idioma: ${clampChipLabel(d.languageOtherCustom!)}` });
  }
  if (
    (d.serviceModes ?? []).includes(TAXONOMY_KEY_OTHER as RestauranteServiceMode) &&
    nonEmpty(d.serviceModeOtherCustom)
  ) {
    chips.push({ key: "tax-svc", label: `Modo: ${clampChipLabel(d.serviceModeOtherCustom!)}` });
  }
  const addl = (d.additionalCuisines ?? []).filter(nonEmpty).slice(0, 3);
  for (const raw of addl) {
    const k = raw.trim();
    if (k === TAXONOMY_KEY_OTHER) continue;
    chips.push({ key: `disc-${k}`, label: `Descub.: ${labelForCuisine(k)}` });
  }
  return chips.length ? chips : undefined;
}

function normalizeUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("//")) return `https:${v}`;
  return `https://${v}`;
}

function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return `tel:${phone.trim()}`;
}

function waHref(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}`;
}

function websiteDisplayFromUrl(url: string): string {
  try {
    const u = new URL(normalizeUrl(url));
    return u.host.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

const HOURS_DAY_ORDER: {
  key: keyof Pick<
    RestauranteListingDraft,
    "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
  >;
  label: string;
}[] = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

function buildHoursDetail(d: RestauranteListingDraft): ShellHoursDetail | undefined {
  const rows: { dayLabel: string; line: string }[] = [];
  for (const { key, label } of HOURS_DAY_ORDER) {
    const s = d[key] as RestauranteDaySchedule | undefined;
    if (!s) continue;
    const line = s.closed
      ? "Cerrado"
      : s.openTime?.trim() && s.closeTime?.trim()
        ? `${s.openTime} – ${s.closeTime}`
        : "Horario por confirmar";
    rows.push({ dayLabel: label, line });
  }
  const specialNote = d.specialHoursNote?.trim() || undefined;
  if (!rows.length && !specialNote) return undefined;
  return { rows, specialNote };
}

/** Cabecera: solo identidad principal + secundaria (las adicionales van a chips «Descub.»). */
function buildCuisineIdentityLine(d: RestauranteListingDraft): string | undefined {
  const parts: string[] = [];
  if (nonEmpty(d.primaryCuisine)) parts.push(cuisineToken(d.primaryCuisine, d.primaryCuisineCustom));
  if (nonEmpty(d.secondaryCuisine)) parts.push(cuisineToken(d.secondaryCuisine!, d.secondaryCuisineCustom));
  const line = parts.filter(Boolean).join(" · ");
  return line || undefined;
}

function buildQuickInfo(d: RestauranteListingDraft, scheduleSummary: string): ShellQuickInfoItem[] {
  const items: ShellQuickInfoItem[] = [];
  const loc = [d.neighborhood, d.cityCanonical].filter(nonEmpty).join(" · ");
  if (loc) items.push({ key: "neighborhood", label: "Zona", value: loc });
  if (d.priceLevel) items.push({ key: "price", label: "Precio", value: d.priceLevel });
  if (nonEmpty(d.businessType)) {
    let bt = labelForBusinessType(d.businessType);
    if (d.businessType.trim() === TAXONOMY_KEY_OTHER && nonEmpty(d.businessTypeCustom)) {
      bt = `Otro: ${clampChipLabel(d.businessTypeCustom!)}`;
    }
    items.push({ key: "businessType", label: "Tipo", value: bt });
  }
  const sum = scheduleSummary.length > 140 ? `${scheduleSummary.slice(0, 140)}…` : scheduleSummary;
  items.push({ key: "hours", label: "Horario", value: sum || "—" });
  const svc = formatServiceModesForQuickInfo(d);
  const langStr = formatLanguagesForQuickInfo(d);
  const lang = langStr ? `Idiomas: ${langStr}` : "";
  if (svc || lang) items.push({ key: "service", label: "Servicio", value: [svc, lang].filter(Boolean).join(" · ") });
  return items;
}

function buildPrimaryCtas(d: RestauranteListingDraft): ShellPrimaryCta[] {
  const ctas: ShellPrimaryCta[] = [];
  
  // 1. Call
  if (nonEmpty(d.phoneNumber)) ctas.push({ key: "call", label: "Llamar", href: telHref(d.phoneNumber!) });
  
  // 2. Website
  if (nonEmpty(d.websiteUrl)) ctas.push({ key: "website", label: "Sitio web", href: normalizeUrl(d.websiteUrl!) });
  
  // 3. Directions
  const addressQuery = [d.addressLine1, d.cityCanonical, d.state].filter(nonEmpty).join(", ");
  if (nonEmpty(addressQuery)) {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`;
    ctas.push({ key: "directions", label: "Direcciones", href: mapsUrl });
  }
  
  // 4. WhatsApp
  if (nonEmpty(d.whatsAppNumber)) {
    const href = waHref(d.whatsAppNumber!);
    if (href) ctas.push({ key: "whatsapp", label: "WhatsApp", href });
  }
  
  // 5. Order
  if (nonEmpty(d.orderUrl)) ctas.push({ key: "order", label: "Ordenar", href: normalizeUrl(d.orderUrl!) });
  
  // 6. Reserve
  if (nonEmpty(d.reservationUrl)) ctas.push({ key: "reserve", label: "Reservar", href: normalizeUrl(d.reservationUrl!) });
  
  // Menu CTAs (not in hero order, but included for other sections)
  const hasMenuUrl = nonEmpty(d.menuUrl);
  const hasMenuFile = nonEmpty(d.menuFile);
  if (hasMenuUrl && hasMenuFile) {
    ctas.push({ key: "menu", label: "Menú en línea", href: normalizeUrl(d.menuUrl!) });
    ctas.push({ key: "menuAsset", label: "Carta (archivo)", href: d.menuFile! });
  } else if (hasMenuUrl) {
    ctas.push({ key: "menu", label: "Ver menú", href: normalizeUrl(d.menuUrl!) });
  } else if (hasMenuFile) {
    ctas.push({ key: "menu", label: "Ver menú", href: d.menuFile! });
  }
  
  // Message CTAs (not in hero order)
  if (nonEmpty(d.phoneNumber)) {
    const digits = d.phoneNumber!.replace(/\D/g, "");
    const sms = digits.length >= 10 ? `sms:+1${digits.slice(-10)}` : `sms:${d.phoneNumber}`;
    ctas.push({ key: "message", label: "Mensaje", href: sms });
  } else if (nonEmpty(d.email)) {
    ctas.push({ key: "message", label: "Correo", href: `mailto:${encodeURIComponent(d.email!.trim())}` });
  }
  
  // Engagement CTAs (not in hero order)
  ctas.push({ key: "save", label: "Guardar", href: "#guardar" });
  ctas.push({ key: "share", label: "Compartir", href: "#compartir" });
  return ctas;
}

/** Video único en vista previa: archivo local tiene precedencia sobre URL externa. */
function buildVideoShellItem(d: RestauranteListingDraft): ShellGalleryItem | undefined {
  if (nonEmpty(d.videoFile) && isRestauranteLocalVideoDataUrl(d.videoFile)) {
    const vf = d.videoFile!.trim();
    return { alt: "Video", category: "video", videoSrc: vf };
  }
  if (nonEmpty(d.videoFile)) {
    const vf = d.videoFile!.trim();
    return { imageUrl: vf, alt: "Video", category: "video", videoSrc: vf };
  }
  if (nonEmpty(d.videoUrl)) {
    return {
      alt: "Video",
      category: "video",
      videoRemoteUrl: normalizeUrl(d.videoUrl!),
    };
  }
  return undefined;
}

/**
 * Interior / comida / exterior / video por separado; galería general solo como complemento
 * (índices de `galleryImages` en secuencia publicada, sin mezclar con buckets).
 */
function buildVenueGalleryFromDraft(d: RestauranteListingDraft): ShellVenueGalleryBundle | undefined {
  const categories: ShellVenueGalleryCategory[] = [];

  const interior: ShellGalleryItem[] = [];
  (d.interiorImages ?? []).forEach((url, i) => {
    if (nonEmpty(url) && isRestauranteDisplayableImageRef(url)) {
      interior.push({ imageUrl: url.trim(), alt: `Interior ${i + 1}`, category: "interior" });
    }
  });
  if (interior.length) categories.push({ key: "interior", label: "Interior", items: interior.slice(0, 20) });

  const food: ShellGalleryItem[] = [];
  (d.foodImages ?? []).forEach((url, i) => {
    if (nonEmpty(url) && isRestauranteDisplayableImageRef(url)) {
      food.push({ imageUrl: url.trim(), alt: `Comida ${i + 1}`, category: "food" });
    }
  });
  if (food.length) categories.push({ key: "food", label: "Comida", items: food.slice(0, 20) });

  const exterior: ShellGalleryItem[] = [];
  (d.exteriorImages ?? []).forEach((url, i) => {
    if (nonEmpty(url) && isRestauranteDisplayableImageRef(url)) {
      exterior.push({ imageUrl: url.trim(), alt: `Exterior ${i + 1}`, category: "exterior" });
    }
  });
  if (exterior.length) categories.push({ key: "exterior", label: "Exterior", items: exterior.slice(0, 20) });

  const videoItem = buildVideoShellItem(d);
  if (videoItem) categories.push({ key: "video", label: "Video", items: [videoItem] });

  const supplemental: ShellGalleryItem[] = [];
  const seq = computePublishGallerySequence(d);
  const imgs = d.galleryImages ?? [];
  let galleryOrdinal = 0;
  for (const e of seq) {
    if (e === "v") continue;
    const url = imgs[e];
    if (!nonEmpty(url) || !isRestauranteDisplayableImageRef(url)) continue;
    galleryOrdinal += 1;
    supplemental.push({
      imageUrl: url.trim(),
      alt: `Galería general ${galleryOrdinal}`,
      category: "general",
    });
  }
  const suppTrim = supplemental.slice(0, 24);

  if (!categories.length && !suppTrim.length) return undefined;
  return {
    categories,
    supplemental: suppTrim.length ? suppTrim : undefined,
  };
}

function buildContact(d: RestauranteListingDraft): ShellContactBlock | undefined {
  const c: ShellContactBlock = {};
  if (nonEmpty(d.addressLine1)) c.addressLine1 = d.addressLine1!.trim();
  const cityLine = [d.cityCanonical, d.state, d.zipCode].filter(nonEmpty).join(", ");
  if (nonEmpty(d.addressLine2)) c.addressLine2 = d.addressLine2!.trim();
  else if (cityLine) c.addressLine2 = cityLine;
  const mapsQ = [d.addressLine1, cityLine].filter(nonEmpty).join(", ");
  if (nonEmpty(mapsQ)) c.mapsSearchQuery = mapsQ;
  if (nonEmpty(d.phoneNumber)) {
    c.phoneDisplay = d.phoneNumber!.trim();
    c.phoneTelHref = telHref(d.phoneNumber!);
  }
  if (nonEmpty(d.email)) c.email = d.email!.trim();
  if (nonEmpty(d.websiteUrl)) {
    c.websiteHref = normalizeUrl(d.websiteUrl!);
    c.websiteDisplay = websiteDisplayFromUrl(d.websiteUrl!);
  }
  if (nonEmpty(d.instagramUrl)) c.instagramHref = normalizeUrl(d.instagramUrl!);
  if (nonEmpty(d.facebookUrl)) c.facebookHref = normalizeUrl(d.facebookUrl!);
  if (nonEmpty(d.tiktokUrl)) c.tiktokHref = normalizeUrl(d.tiktokUrl!);
  if (nonEmpty(d.youtubeUrl)) c.youtubeHref = normalizeUrl(d.youtubeUrl!);
  if (nonEmpty(d.whatsAppNumber)) {
    const h = waHref(d.whatsAppNumber!);
    if (h) c.whatsappHref = h;
  }
  if (nonEmpty(d.menuFile)) {
    c.menuFileHref = d.menuFile;
    c.menuFileLabel = "Carta / menú (archivo)";
  }
  const has =
    c.addressLine1 ||
    c.mapsSearchQuery ||
    c.phoneDisplay ||
    c.email ||
    c.websiteHref ||
    c.instagramHref ||
    c.facebookHref ||
    c.tiktokHref ||
    c.youtubeHref ||
    c.whatsappHref ||
    c.menuFileHref;
  return has ? c : undefined;
}

function buildStacks(d: RestauranteListingDraft): ShellStackSection[] {
  const stacks: ShellStackSection[] = [];
  if (d.movingVendor) {
    const m = d.movingVendorStack ?? {};
    const rows: { label: string; value: string }[] = [];
    const add = (label: string, v?: string) => {
      if (nonEmpty(v)) rows.push({ label, value: v!.trim() });
    };
    add("Ubicación actual", m.currentLocationText);
    if (nonEmpty(m.currentLocationUrl)) rows.push({ label: "Enlace", value: m.currentLocationUrl!.trim() });
    if (m.activeNow != null) rows.push({ label: "Activo ahora", value: m.activeNow ? "Sí" : "No" });
    add("Horario de hoy", m.todayHoursText);
    add("Próxima parada", m.nextStopText);
    add("Hora próxima parada", m.nextStopTime);
    add("Ruta semanal", m.weeklyRouteText);
    if (m.allowFollowNotify != null) rows.push({ label: "Avisos", value: m.allowFollowNotify ? "Sí — " + (m.notifyCopy?.trim() || "Notificaciones") : "No" });
    else add("Avisos", m.notifyCopy);
    if (rows.length) stacks.push({ id: "moving", title: "Ubicación móvil", rows });
  }
  if (d.homeBasedBusiness) {
    const h = d.homeBasedStack ?? {};
    const rows: { label: string; value: string }[] = [];
    const add = (label: string, v?: string) => {
      if (nonEmpty(v)) rows.push({ label, value: v!.trim() });
    };
    add("Instrucciones de recogida", h.pickupInstructions);
    if (h.pickupDays?.length) rows.push({ label: "Días", value: h.pickupDays.join(", ") });
    add("Ventana de recogida", h.pickupWindowText);
    if (h.deliveryRadiusMiles != null && Number.isFinite(h.deliveryRadiusMiles)) {
      rows.push({ label: "Radio de entrega (millas)", value: String(h.deliveryRadiusMiles) });
    }
    add("Tiempo de anticipación", h.preorderLeadTimeText);
    add("Aviso", h.homeBusinessNotice);
    if (rows.length) stacks.push({ id: "home", title: "Negocio desde casa", rows });
  }
  if (d.cateringAvailable || d.eventFoodService) {
    const k = d.cateringEventsStack ?? {};
    const rows: { label: string; value: string }[] = [];
    if (k.eventSizesSupported?.length) rows.push({ label: "Tamaños de evento", value: k.eventSizesSupported.join(", ") });
    if (nonEmpty(k.bookingLeadTimeText)) rows.push({ label: "Anticipación", value: k.bookingLeadTimeText!.trim() });
    if (k.serviceRadiusMiles != null && Number.isFinite(k.serviceRadiusMiles)) {
      rows.push({ label: "Radio de servicio (millas)", value: String(k.serviceRadiusMiles) });
    }
    if (nonEmpty(k.cateringInquiryUrl)) rows.push({ label: "Solicitud / cotización", value: k.cateringInquiryUrl!.trim() });
    if (nonEmpty(k.cateringNote)) rows.push({ label: "Nota", value: k.cateringNote!.trim() });
    if (rows.length) stacks.push({ id: "catering", title: "Catering y eventos", rows });
  }
  return stacks;
}

function buildTrustLight(d: RestauranteListingDraft): RestaurantDetailShellData["trustLight"] {
  const parts: string[] = [];
  if (nonEmpty(d.testimonialSnippet)) {
    parts.push(`«${d.testimonialSnippet!.trim()}»`);
  }
  if (d.externalRatingValue != null && d.externalReviewCount != null) {
    parts.push(
      `Referencia opcional en Leonix: ${d.externalRatingValue.toFixed(1)}★ · ${d.externalReviewCount} menciones públicas (si aplica).`
    );
  } else if (d.externalRatingValue != null) {
    parts.push(`Referencia opcional: ${d.externalRatingValue.toFixed(1)}★.`);
  }
  if (d.aiSummaryEnabled) {
    parts.push(
      "Resumen breve de reputación en Leonix (opcional): puede combinar tu testimonio y datos que indiques."
    );
  }
  if (!parts.length && (nonEmpty(d.googleReviewUrl) || nonEmpty(d.yelpReviewUrl))) {
    parts.push(
      "En Leonix la confianza se construye en tu página: puedes añadir enlaces de respaldo opcionales si te sirven."
    );
  }
  if (!parts.length) return undefined;
  const external =
    nonEmpty(d.googleReviewUrl) ? normalizeUrl(d.googleReviewUrl!) : nonEmpty(d.yelpReviewUrl) ? normalizeUrl(d.yelpReviewUrl!) : "";
  return {
    summaryLine: parts.join(" "),
    externalTrustHref: external || undefined,
    externalTrustLabel: external ? "Material de respaldo (opcional)" : undefined,
  };
}

/** True when the seller has not started — show premium empty preview, not the listing shell. */
export function isRestauranteDraftPristineEmpty(d: RestauranteListingDraft): boolean {
  if (nonEmpty(d.businessName)) return false;
  if (nonEmpty(d.heroImage)) return false;
  if (nonEmpty(d.shortSummary)) return false;
  if (nonEmpty(d.cityCanonical)) return false;
  if (hasPrimaryContactPath(d)) return false;
  if (d.serviceModes?.length) return false;
  if (nonEmpty(d.primaryCuisine) || nonEmpty(d.businessType)) return false;
  const anyDish = d.featuredDishes?.some((x) => nonEmpty(x.title) || nonEmpty(x.image));
  if (anyDish) return false;
  const anyImg =
    (d.galleryImages?.some(nonEmpty) ?? false) ||
    (d.foodImages?.some(nonEmpty) ?? false) ||
    (d.interiorImages?.some(nonEmpty) ?? false) ||
    (d.exteriorImages?.some(nonEmpty) ?? false);
  if (anyImg) return false;
  if (nonEmpty(d.videoFile) || nonEmpty(d.videoUrl)) return false;
  if (nonEmpty(d.longDescription)) return false;
  if (d.highlights?.length) return false;
  return true;
}

export function mapRestauranteDraftToShellData(d: RestauranteListingDraft): RestaurantDetailShellData {
  const hp = computeShellHoursPreview(d);
  const cuisineLine = buildCuisineIdentityLine(d);
  const seq = computePublishGallerySequence(d);
  const imgs = d.galleryImages ?? [];
  const firstGalIdx = seq.find((x): x is number => typeof x === "number" && Number.isFinite(x) && x >= 0 && x < imgs.length);
  const firstGal = firstGalIdx != null ? imgs[firstGalIdx] : undefined;
  const heroTrim = d.heroImage?.trim();
  const heroResolved = nonEmpty(heroTrim) ? heroTrim : nonEmpty(firstGal) ? firstGal : undefined;

  const quick = buildQuickInfo(d, hp.scheduleSummary).filter((q) => nonEmpty(q.value));
  const highlights = (d.highlights ?? [])
    .filter(nonEmpty)
    .slice(0, RESTAURANTE_SHELL_HIGHLIGHT_CAP)
    .map((k) => ({ key: k, label: labelForHighlight(k) }));
  const dishes =
    d.featuredDishes
      ?.filter((x) => nonEmpty(x.title))
      .slice(0, 4)
      .map((x) => ({
        name: x.title.trim(),
        supportingLine: nonEmpty(x.shortNote) ? x.shortNote.trim() : "",
        imageUrl: nonEmpty(x.image) ? x.image!.trim() : undefined,
        badge: formatPlatilloPriceBadge(x.priceLabel),
      })) ?? [];
  const hasMenuUrl = nonEmpty(d.menuUrl);
  const hasMenuFile = nonEmpty(d.menuFile);
  const menuHref = hasMenuUrl ? normalizeUrl(d.menuUrl!) : hasMenuFile ? d.menuFile! : "";
  const venueGallery = buildVenueGalleryFromDraft(d);
  const contact = buildContact(d);
  const stacks = buildStacks(d);
  const trustRating =
    d.externalRatingValue != null && d.externalReviewCount != null
      ? { average: Math.min(5, Math.max(0, d.externalRatingValue)), count: Math.max(0, Math.floor(d.externalReviewCount)) }
      : undefined;

  const logoTrim = d.businessLogo?.trim();
  const logoResolved = nonEmpty(logoTrim) ? logoTrim : undefined;

  return {
    id: d.draftListingId,
    heroImageUrl: heroResolved != null && nonEmpty(heroResolved) ? heroResolved.trim() : undefined,
    heroImageAlt: nonEmpty(d.businessName) ? `Foto principal · ${d.businessName.trim()}` : "Foto principal del negocio",
    businessName: nonEmpty(d.businessName) ? d.businessName.trim() : "Borrador sin título",
    cuisineTypeLine: cuisineLine,
    taxonomyChips: buildTaxonomyChips(d),
    summaryShort: nonEmpty(d.shortSummary) ? d.shortSummary.trim() : undefined,
    trustRating,
    hoursPreview: hp,
    seeHoursLabel: "Ver horarios",
    seeHoursHref: "#horarios-detalle",
    hoursDetail: buildHoursDetail(d),
    primaryCtas: buildPrimaryCtas(d),
    quickInfo: quick.length ? quick : undefined,
    menuHighlights: dishes.length ? dishes : undefined,
    fullMenuCta: menuHref
      ? { label: hasMenuUrl ? "Ver menú completo" : "Ver carta completa", href: menuHref }
      : undefined,
    highlightTags: highlights.length ? highlights : undefined,
    venueGallery,
    galleryCta: venueGallery
      ? { label: "Explorar fotos y videos", href: "#galeria-lugar" }
      : undefined,
    contact,
    aboutTitle: nonEmpty(d.longDescription) ? "Sobre el negocio" : undefined,
    aboutBody: nonEmpty(d.longDescription) ? d.longDescription!.trim() : undefined,
    trustLight: buildTrustLight(d),
    stackSections: stacks.length ? stacks : undefined,
    groupedFeatures: normalizeRestaurantFeatures(d),
  };
}

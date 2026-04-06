import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import { hasPrimaryContactPath, RESTAURANTE_SHELL_HIGHLIGHT_CAP } from "./restauranteListingApplicationModel";
import { computeShellHoursPreview } from "./restauranteHoursPreview";
import {
  labelForBusinessType,
  labelForCuisine,
  labelForHighlight,
  labelForServiceMode,
} from "./restauranteTaxonomy";
import type {
  RestaurantDetailShellData,
  ShellContactBlock,
  ShellGalleryItem,
  ShellPrimaryCta,
  ShellQuickInfoItem,
  ShellStackSection,
} from "../shell/restaurantDetailShellTypes";

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
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

function buildCuisineLine(d: RestauranteListingDraft): string | undefined {
  const parts: string[] = [];
  if (nonEmpty(d.primaryCuisine)) parts.push(labelForCuisine(d.primaryCuisine.trim()));
  if (nonEmpty(d.secondaryCuisine)) parts.push(labelForCuisine(d.secondaryCuisine!.trim()));
  const add = d.additionalCuisines?.filter(nonEmpty).map(labelForCuisine) ?? [];
  parts.push(...add);
  const line = parts.filter(Boolean).join(" · ");
  return line || undefined;
}

function buildQuickInfo(d: RestauranteListingDraft, scheduleSummary: string): ShellQuickInfoItem[] {
  const items: ShellQuickInfoItem[] = [];
  const loc = [d.neighborhood, d.cityCanonical].filter(nonEmpty).join(" · ");
  if (loc) items.push({ key: "neighborhood", label: "Zona", value: loc });
  if (d.priceLevel) items.push({ key: "price", label: "Precio", value: d.priceLevel });
  if (nonEmpty(d.businessType)) items.push({ key: "businessType", label: "Tipo", value: labelForBusinessType(d.businessType) });
  const sum = scheduleSummary.length > 140 ? `${scheduleSummary.slice(0, 140)}…` : scheduleSummary;
  items.push({ key: "hours", label: "Horario", value: sum || "—" });
  const svc = d.serviceModes?.length ? d.serviceModes.map(labelForServiceMode).join(" · ") : "";
  const lang = d.languagesSpoken?.filter(nonEmpty).length ? `Idiomas: ${d.languagesSpoken!.filter(nonEmpty).join(", ")}` : "";
  if (svc || lang) items.push({ key: "service", label: "Servicio", value: [svc, lang].filter(Boolean).join(" · ") });
  return items;
}

function buildPrimaryCtas(d: RestauranteListingDraft): ShellPrimaryCta[] {
  const ctas: ShellPrimaryCta[] = [];
  if (nonEmpty(d.websiteUrl)) ctas.push({ key: "website", label: "Sitio web", href: normalizeUrl(d.websiteUrl!) });
  if (nonEmpty(d.phoneNumber)) ctas.push({ key: "call", label: "Llamar", href: telHref(d.phoneNumber!) });
  if (nonEmpty(d.whatsAppNumber)) {
    const href = waHref(d.whatsAppNumber!);
    if (href) ctas.push({ key: "whatsapp", label: "WhatsApp", href });
  }
  if (d.allowMessageCTA && nonEmpty(d.phoneNumber)) {
    const digits = d.phoneNumber!.replace(/\D/g, "");
    const sms = digits.length >= 10 ? `sms:+1${digits.slice(-10)}` : `sms:${d.phoneNumber}`;
    ctas.push({ key: "message", label: "Mensaje", href: sms });
  }
  const menuHref = nonEmpty(d.menuUrl) ? normalizeUrl(d.menuUrl!) : nonEmpty(d.menuFile) ? d.menuFile! : "";
  if (menuHref) ctas.push({ key: "menu", label: "Ver menú", href: menuHref });
  if (nonEmpty(d.reservationUrl)) ctas.push({ key: "reserve", label: "Reservar", href: normalizeUrl(d.reservationUrl!) });
  if (nonEmpty(d.orderUrl)) ctas.push({ key: "order", label: "Ordenar", href: normalizeUrl(d.orderUrl!) });
  ctas.push({ key: "save", label: "Guardar", href: "#guardar" });
  ctas.push({ key: "share", label: "Compartir", href: "#compartir" });
  return ctas;
}

function buildGallery(d: RestauranteListingDraft): ShellGalleryItem[] {
  const out: ShellGalleryItem[] = [];
  const push = (url: string | undefined, alt: string, cat: ShellGalleryItem["category"]) => {
    if (!nonEmpty(url)) return;
    out.push({ imageUrl: url, alt, category: cat });
  };
  (d.interiorImages ?? []).forEach((url, i) => push(url, `Interior ${i + 1}`, "interior"));
  (d.foodImages ?? []).forEach((url, i) => push(url, `Platillo ${i + 1}`, "food"));
  (d.exteriorImages ?? []).forEach((url, i) => push(url, `Exterior ${i + 1}`, "exterior"));
  const imgs = [...(d.galleryImages ?? [])];
  const orderIdx = (d.galleryOrder ?? []).map((s) => Number(String(s))).filter((n) => Number.isFinite(n) && n >= 0);
  const ordered =
    orderIdx.length === imgs.length && orderIdx.length > 0
      ? orderIdx.map((i) => imgs[i]).filter(Boolean)
      : imgs;
  ordered.forEach((url, i) => push(url, `Galería ${i + 1}`, "interior"));
  if (nonEmpty(d.videoFile)) {
    const vf = d.videoFile!;
    const isDataVideo = vf.startsWith("data:video");
    out.push(
      isDataVideo ? { alt: "Video", category: "video" } : { imageUrl: vf, alt: "Video", category: "video" }
    );
  } else if (nonEmpty(d.videoUrl)) out.push({ alt: "Video", category: "video" });
  return out.slice(0, 24);
}

function buildContact(d: RestauranteListingDraft): ShellContactBlock | undefined {
  const c: ShellContactBlock = {};
  if (nonEmpty(d.addressLine1)) c.addressLine1 = d.addressLine1!.trim();
  const cityLine = [d.cityCanonical, d.state, d.zipCode].filter(nonEmpty).join(", ");
  if (nonEmpty(d.addressLine2)) c.addressLine2 = d.addressLine2!.trim();
  else if (cityLine) c.addressLine2 = cityLine;
  const mapsQ =
    (nonEmpty(d.verUbicacionUrl) ? d.verUbicacionUrl!.trim() : "") ||
    [d.addressLine1, cityLine].filter(nonEmpty).join(", ");
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
  if (d.externalRatingValue != null && d.externalReviewCount != null) {
    parts.push(`${d.externalRatingValue.toFixed(1)}★ · ${d.externalReviewCount} reseñas externas`);
  } else if (d.externalRatingValue != null) parts.push(`${d.externalRatingValue.toFixed(1)}★ (externo)`);
  if (nonEmpty(d.testimonialSnippet)) parts.push(d.testimonialSnippet!.trim());
  if (d.aiSummaryEnabled && parts.length === 0 && (nonEmpty(d.googleReviewUrl) || nonEmpty(d.yelpReviewUrl))) {
    parts.push("Resumen de confianza basado en enlaces externos (Leonix no muestra reseñas nativas aquí).");
  }
  if (!parts.length) return undefined;
  const external =
    nonEmpty(d.googleReviewUrl) ? normalizeUrl(d.googleReviewUrl!) : nonEmpty(d.yelpReviewUrl) ? normalizeUrl(d.yelpReviewUrl!) : "";
  return {
    summaryLine: parts.join(" "),
    externalTrustHref: external || undefined,
    externalTrustLabel: external ? "Ver enlace externo" : undefined,
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
  if (nonEmpty(d.longDescription)) return false;
  if (d.highlights?.length) return false;
  return true;
}

export function mapRestauranteDraftToShellData(d: RestauranteListingDraft): RestaurantDetailShellData {
  const hp = computeShellHoursPreview(d);
  const cuisineLine = buildCuisineLine(d);
  const quick = buildQuickInfo(d, hp.scheduleSummary).filter((q) => nonEmpty(q.value));
  const highlights = (d.highlights ?? [])
    .filter(nonEmpty)
    .slice(0, RESTAURANTE_SHELL_HIGHLIGHT_CAP)
    .map((k) => ({ key: k, label: labelForHighlight(k) }));
  const dishes =
    d.featuredDishes
      ?.filter((x) => nonEmpty(x.title) && nonEmpty(x.shortNote) && nonEmpty(x.image))
      .slice(0, 4)
      .map((x) => ({
        name: x.title.trim(),
        supportingLine: x.shortNote.trim(),
        imageUrl: x.image,
        badge: nonEmpty(x.priceLabel) ? String(x.priceLabel).trim() : undefined,
      })) ?? [];
  const menuHref = nonEmpty(d.menuUrl) ? normalizeUrl(d.menuUrl!) : nonEmpty(d.menuFile) ? d.menuFile! : "";
  const gallery = buildGallery(d);
  const contact = buildContact(d);
  const stacks = buildStacks(d);
  const trustRating =
    d.externalRatingValue != null && d.externalReviewCount != null
      ? { average: Math.min(5, Math.max(0, d.externalRatingValue)), count: Math.max(0, Math.floor(d.externalReviewCount)) }
      : undefined;

  return {
    id: d.draftListingId,
    heroImageUrl: nonEmpty(d.heroImage) ? d.heroImage : undefined,
    heroImageAlt: nonEmpty(d.businessName) ? `Foto principal · ${d.businessName.trim()}` : "Foto principal del negocio",
    businessName: nonEmpty(d.businessName) ? d.businessName.trim() : "Borrador sin título",
    cuisineTypeLine: cuisineLine,
    summaryShort: nonEmpty(d.shortSummary) ? d.shortSummary.trim() : undefined,
    trustRating,
    hoursPreview: hp,
    seeHoursLabel: "Ver horarios",
    seeHoursHref: "#horarios",
    primaryCtas: buildPrimaryCtas(d),
    quickInfo: quick.length ? quick : undefined,
    menuHighlights: dishes.length ? dishes : undefined,
    fullMenuCta: menuHref ? { label: "Ver menú completo", href: menuHref } : undefined,
    highlightTags: highlights.length ? highlights : undefined,
    gallery: gallery.length ? gallery : undefined,
    galleryCta: gallery.length ? { label: "Ver todas las fotos y videos", href: "#media" } : undefined,
    contact,
    aboutTitle: nonEmpty(d.longDescription) ? "Sobre el negocio" : undefined,
    aboutBody: nonEmpty(d.longDescription) ? d.longDescription!.trim() : undefined,
    trustLight: buildTrustLight(d),
    stackSections: stacks.length ? stacks : undefined,
  };
}

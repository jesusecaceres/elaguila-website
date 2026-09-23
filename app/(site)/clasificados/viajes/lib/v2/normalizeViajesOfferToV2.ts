import type { ViajesNegociosDraft } from "@/app/(site)/publicar/viajes/negocios/lib/viajesNegociosDraftTypes";
import type { ViajesPrivadoDraft } from "@/app/(site)/publicar/viajes/privado/lib/viajesPrivadoDraftTypes";

import type {
  ViajesMediaAssetV2,
  ViajesOfferModelV2,
  ViajesPillItem,
  ViajesTravelModule,
} from "./viajesOfferModelV2";
import { emptyViajesOfferModelV2, newViajesStableId } from "./viajesOfferModelV2Defaults";
import { mapLegacyOfferTypeToViajesOfferKind } from "./viajesOfferKindMap";
import { isViajesDurableHttpsUrl } from "./viajesMediaDurableGuards";
import { pairViajesPhoneFields } from "./viajesPhoneDisplay";

function pillsFromLines(text: string): ViajesPillItem[] {
  return String(text ?? "")
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((label) => ({ id: newViajesStableId("pill"), label }));
}

function addressFromLabel(label: string, showPublicly: boolean) {
  const t = label.trim();
  return {
    street: "",
    unit: "",
    city: t,
    stateRegion: "",
    postalCode: "",
    country: "",
    publicLabel: t,
    showPublicly,
    showMap: false,
  };
}

function imageFromUrl(url: string, order: number, isHero: boolean): ViajesMediaAssetV2 | null {
  const u = url.trim();
  if (!u) return null;
  const durable = isViajesDurableHttpsUrl(u);
  return {
    id: newViajesStableId("media"),
    url: durable ? u : "",
    alt: "",
    galleryOrder: order,
    isHero,
    isResultsCard: isHero,
    focal: { x: 0.5, y: 0.5 },
    uploadStatus: durable ? "uploaded" : "local_pending",
    createdAt: new Date().toISOString(),
    localPreviewObjectUrl: !durable && (u.startsWith("data:") || u.startsWith("blob:")) ? u : undefined,
    localIdbKey: null,
    uploadErrorCode: null,
    uploadProgressPct: durable ? 100 : 0,
    moduleId: null,
  };
}

function modulesFromV1Booleans(d: {
  incluyeHotel: boolean;
  incluyeTransporte: boolean;
  incluyeComida: boolean;
}): ViajesTravelModule[] {
  const out: ViajesTravelModule[] = [];
  if (d.incluyeHotel) {
    out.push({
      id: newViajesStableId("mod"),
      kind: "accommodation",
      propertyType: "",
      roomOrOccupancy: "",
      nights: "",
      description: "",
      imageId: null,
    });
  }
  if (d.incluyeTransporte) {
    out.push({
      id: newViajesStableId("mod"),
      kind: "transportation",
      mode: "",
      provider: "",
      origin: "",
      destination: "",
      description: "",
      imageId: null,
    });
  }
  if (d.incluyeComida) {
    out.push({
      id: newViajesStableId("mod"),
      kind: "food",
      mealPlanOrName: "",
      quantityOrFrequency: "",
      dietaryNote: "",
      description: "",
      imageId: null,
    });
  }
  return out;
}

export function normalizeViajesNegociosDraftToV2(
  d: ViajesNegociosDraft,
  locale: "es" | "en" = "es"
): ViajesOfferModelV2 {
  const offer = emptyViajesOfferModelV2("business", locale);
  const phone = pairViajesPhoneFields(d.phone);
  const phoneOffice = pairViajesPhoneFields(d.phoneOffice);
  const wa = pairViajesPhoneFields(d.whatsapp);

  offer.offerKind = mapLegacyOfferTypeToViajesOfferKind(d.offerType);
  offer.basics = {
    title: d.titulo ?? "",
    destinationLabel: d.destino ?? "",
    departureLabel: d.ciudadSalida ?? "",
    durationLabel: d.duracion ?? "",
    audienceFamilies: Boolean(d.familias),
    audienceCouples: Boolean(d.parejas),
    audienceGroups: Boolean(d.grupos),
    spanishGuide: Boolean(d.guiaEspanol),
    serviceLanguage: d.idiomaAtencion ?? "",
  };
  offer.story = d.descripcion ?? "";
  offer.schedule = {
    dateMode: (d.dateMode as "fixed" | "flexible" | "seasonal") || "flexible",
    startDate: d.fechaInicio ?? "",
    endDate: d.fechaFin ?? "",
    note: d.fechasNota ?? "",
    legacyFechas: d.fechas ?? "",
  };
  offer.pricing = {
    priceFrom: d.precio ?? "",
    currencyNote: "",
    budgetBand: (d.presupuestoTag as "" | "economico" | "moderado" | "premium") || "",
  };

  const images: ViajesMediaAssetV2[] = [];
  const heroRemote = imageFromUrl(d.imagenPrincipal || "", 0, true);
  if (heroRemote) images.push(heroRemote);
  else if (d.localHeroImageId || d.localImageDataUrl) {
    images.push({
      id: newViajesStableId("media"),
      url: "",
      alt: d.titulo || "",
      galleryOrder: 0,
      isHero: true,
      isResultsCard: true,
      focal: { x: 0.5, y: 0.5 },
      uploadStatus: "local_pending",
      localIdbKey: d.localHeroImageId,
      localPreviewObjectUrl: d.localImageDataUrl || undefined,
      createdAt: new Date().toISOString(),
      uploadErrorCode: null,
      uploadProgressPct: 0,
      moduleId: null,
    });
  }
  for (const g of d.galeriaUrls || []) {
    const img = imageFromUrl(g, images.length, images.length === 0);
    if (img) {
      if (images.some((x) => x.isHero)) {
        img.isHero = false;
        img.isResultsCard = false;
      }
      images.push(img);
    }
  }
  offer.media.images = images;
  if (d.videoUrl?.trim()) {
    offer.media.videos = [{ id: newViajesStableId("vid"), url: d.videoUrl.trim() }];
  }

  offer.inclusions = pillsFromLines(d.incluye);
  offer.modules = modulesFromV1Booleans(d);
  offer.locations.destination = addressFromLabel(d.destino || "", true);
  offer.locations.departureMeetingPort = addressFromLabel(d.ciudadSalida || "", true);

  offer.provider = {
    ...offer.provider,
    name: d.businessName || "",
    logoUrl: isViajesDurableHttpsUrl(d.logoSocio) ? d.logoSocio.trim() : "",
    website: d.website || "",
    phone: phone.display,
    phoneRaw: phone.actionRaw,
    sms: phone.display,
    smsRaw: phone.actionRaw,
    whatsapp: wa.display,
    whatsappRaw: wa.actionRaw,
    email: d.email || "",
    socialFacebook: d.socialFacebook || "",
    socialInstagram: d.socialInstagram || "",
    socialTiktok: d.socialTiktok || "",
    socialYoutube: d.socialYoutube || "",
    socialX: d.socialTwitter || "",
    description: [d.languages, d.destinationsServed].filter(Boolean).join(" · "),
  };
  offer.contact = {
    primaryCtaType:
      d.ctaType === "telefono" ? "phone" : d.ctaType === "correo" ? "email" : d.ctaType === "sitio" ? "website" : "whatsapp",
    displayName: d.businessName || "",
    phone: phone.display,
    phoneRaw: phone.actionRaw,
    phoneOffice: phoneOffice.display,
    phoneOfficeRaw: phoneOffice.actionRaw,
    whatsapp: wa.display,
    whatsappRaw: wa.actionRaw,
    email: d.email || "",
    website: d.website || "",
  };
  offer.source.lane = "business";
  offer.source.providerOfRecord = d.businessName || "";
  return offer;
}

export function normalizeViajesPrivadoDraftToV2(
  d: ViajesPrivadoDraft,
  locale: "es" | "en" = "es"
): ViajesOfferModelV2 {
  const offer = emptyViajesOfferModelV2("private", locale);
  const phone = pairViajesPhoneFields(d.phone);
  const phoneOffice = pairViajesPhoneFields(d.phoneOffice);
  const wa = pairViajesPhoneFields(d.whatsapp);

  offer.offerKind = mapLegacyOfferTypeToViajesOfferKind(d.offerType);
  offer.basics = {
    title: d.titulo ?? "",
    destinationLabel: d.destino ?? "",
    departureLabel: d.ciudadSalida ?? "",
    durationLabel: d.duracion ?? "",
    audienceFamilies: Boolean(d.familias),
    audienceCouples: Boolean(d.parejas),
    audienceGroups: Boolean(d.grupos),
    spanishGuide: Boolean(d.guiaEspanol),
    serviceLanguage: d.idiomaAtencion ?? "",
  };
  offer.story = d.descripcion ?? "";
  offer.schedule = {
    dateMode: (d.dateMode as "fixed" | "flexible" | "seasonal") || "flexible",
    startDate: d.fechaInicio ?? "",
    endDate: d.fechaFin ?? "",
    note: d.fechasNota ?? "",
    legacyFechas: d.fechas ?? "",
  };
  offer.pricing = {
    priceFrom: d.precio ?? "",
    currencyNote: "",
    budgetBand: (d.presupuestoTag as "" | "economico" | "moderado" | "premium") || "",
  };

  const images: ViajesMediaAssetV2[] = [];
  const heroRemote = imageFromUrl(d.imagenUrl || "", 0, true);
  if (heroRemote) images.push(heroRemote);
  else if (d.localHeroBlobId || d.localImageDataUrl) {
    images.push({
      id: newViajesStableId("media"),
      url: "",
      alt: d.titulo || "",
      galleryOrder: 0,
      isHero: true,
      isResultsCard: true,
      focal: { x: 0.5, y: 0.5 },
      uploadStatus: "local_pending",
      localIdbKey: d.localHeroBlobId,
      localPreviewObjectUrl: d.localImageDataUrl || undefined,
      createdAt: new Date().toISOString(),
      uploadErrorCode: null,
      uploadProgressPct: 0,
      moduleId: null,
    });
  }
  for (const g of d.galeriaUrls || []) {
    const img = imageFromUrl(g, images.length, images.length === 0);
    if (img) {
      if (images.some((x) => x.isHero)) {
        img.isHero = false;
        img.isResultsCard = false;
      }
      images.push(img);
    }
  }
  offer.media.images = images;
  offer.inclusions = pillsFromLines(d.incluye);
  offer.modules = modulesFromV1Booleans(d);
  offer.locations.destination = addressFromLabel(d.destino || "", true);
  offer.locations.departureMeetingPort = addressFromLabel(d.ciudadSalida || "", true);
  offer.locations.privateExact = {
    ...offer.locations.privateExact,
    showPublicly: false,
    showMap: false,
  };
  if (d.politicaReserva?.trim()) {
    offer.policies = [{ id: newViajesStableId("pill"), label: d.politicaReserva.trim() }];
  }
  offer.contact = {
    primaryCtaType: d.ctaType === "phone" ? "phone" : d.ctaType === "email" ? "email" : "whatsapp",
    displayName: d.displayName || "",
    phone: phone.display,
    phoneRaw: phone.actionRaw,
    phoneOffice: phoneOffice.display,
    phoneOfficeRaw: phoneOffice.actionRaw,
    whatsapp: wa.display,
    whatsappRaw: wa.actionRaw,
    email: d.email || "",
    website: d.website || "",
  };
  offer.provider = {
    ...offer.provider,
    name: d.displayName || "",
    website: d.website || "",
    phone: phone.display,
    phoneRaw: phone.actionRaw,
    whatsapp: wa.display,
    whatsappRaw: wa.actionRaw,
    email: d.email || "",
    socialFacebook: d.socialFacebook || "",
    socialInstagram: d.socialInstagram || "",
    socialTiktok: d.socialTiktok || "",
    socialYoutube: d.socialYoutube || "",
    socialX: d.socialTwitter || "",
  };
  offer.source.lane = "private";
  return offer;
}

function isOfferV2(value: unknown): value is ViajesOfferModelV2 {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return o.schemaVersion === 2 && typeof o.basics === "object" && typeof o.media === "object";
}

/**
 * Boundary normalizer — accepts V1 drafts, V1 staged envelopes, V2 offers, V2 staged envelopes.
 */
export function normalizeViajesOfferToV2(
  input: unknown,
  opts?: { locale?: "es" | "en"; laneHint?: "business" | "private" | "affiliate" | "editorial" }
): ViajesOfferModelV2 {
  const locale = opts?.locale ?? "es";
  if (!input || typeof input !== "object") {
    return emptyViajesOfferModelV2(opts?.laneHint ?? "business", locale);
  }
  const root = input as Record<string, unknown>;

  if (root.version === 2 && isOfferV2(root.offer)) {
    return { ...root.offer, schemaVersion: 2 };
  }
  if (isOfferV2(root)) {
    return { ...root, schemaVersion: 2 };
  }
  if (root.version === 1 || root.negocios || root.privado) {
    if (root.negocios && typeof root.negocios === "object") {
      return normalizeViajesNegociosDraftToV2(root.negocios as ViajesNegociosDraft, locale);
    }
    if (root.privado && typeof root.privado === "object") {
      return normalizeViajesPrivadoDraftToV2(root.privado as ViajesPrivadoDraft, locale);
    }
  }
  // Bare V1 draft heuristics
  if ("businessName" in root || ("imagenPrincipal" in root && "ctaType" in root)) {
    return normalizeViajesNegociosDraftToV2(root as unknown as ViajesNegociosDraft, locale);
  }
  if ("displayName" in root || ("imagenUrl" in root && "numeroPersonas" in root)) {
    return normalizeViajesPrivadoDraftToV2(root as unknown as ViajesPrivadoDraft, locale);
  }
  if (root.offer && isOfferV2(root.offer)) {
    return { ...(root.offer as ViajesOfferModelV2), schemaVersion: 2 };
  }
  return emptyViajesOfferModelV2(opts?.laneHint ?? "business", locale);
}

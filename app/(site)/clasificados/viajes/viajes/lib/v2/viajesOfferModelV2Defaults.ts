import type {
  ViajesLocationsV2,
  ViajesMediaAssetV2,
  ViajesOfferModelV2,
  ViajesProviderProfileV2,
  ViajesStructuredAddress,
} from "./viajesOfferModelV2";

export function newViajesStableId(prefix = "vx"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyViajesStructuredAddress(
  defaults?: Partial<ViajesStructuredAddress>
): ViajesStructuredAddress {
  return {
    street: "",
    unit: "",
    city: "",
    stateRegion: "",
    postalCode: "",
    country: "",
    publicLabel: "",
    showPublicly: defaults?.showPublicly ?? true,
    showMap: defaults?.showMap ?? false,
    ...defaults,
  };
}

export function emptyViajesLocations(lane: "business" | "private" | "affiliate" | "editorial" = "business"): ViajesLocationsV2 {
  return {
    destination: emptyViajesStructuredAddress({ showPublicly: true, showMap: false }),
    departureMeetingPort: emptyViajesStructuredAddress({ showPublicly: true, showMap: false }),
    providerOffice: emptyViajesStructuredAddress({
      showPublicly: lane === "business",
      showMap: false,
    }),
    privateExact: emptyViajesStructuredAddress({ showPublicly: false, showMap: false }),
  };
}

export function emptyViajesProvider(): ViajesProviderProfileV2 {
  return {
    id: "",
    logoUrl: "",
    name: "",
    type: "",
    description: "",
    profileRoute: "",
    website: "",
    bookingUrl: "",
    phone: "",
    phoneRaw: "",
    sms: "",
    smsRaw: "",
    whatsapp: "",
    whatsappRaw: "",
    email: "",
    directionsUrl: "",
    socialFacebook: "",
    socialInstagram: "",
    socialTiktok: "",
    socialYoutube: "",
    socialX: "",
    socialLinkedin: "",
    socialSnapchat: "",
    socialPinterest: "",
  };
}

export function emptyViajesOfferModelV2(
  lane: ViajesOfferModelV2["lane"] = "business",
  locale: "es" | "en" = "es"
): ViajesOfferModelV2 {
  return {
    schemaVersion: 2,
    id: newViajesStableId("offer"),
    lane,
    offerKind: "other",
    locale,
    basics: {
      title: "",
      destinationLabel: "",
      departureLabel: "",
      durationLabel: "",
      audienceFamilies: false,
      audienceCouples: false,
      audienceGroups: false,
      spanishGuide: false,
      serviceLanguage: locale === "en" ? "Spanish" : "español",
    },
    story: "",
    schedule: {
      dateMode: "flexible",
      startDate: "",
      endDate: "",
      note: "",
      legacyFechas: "",
    },
    pricing: {
      priceFrom: "",
      currencyNote: "",
      budgetBand: "",
    },
    media: { images: [], videos: [] },
    highlights: [],
    inclusions: [],
    exclusions: [],
    amenities: [],
    policies: [],
    accessibility: [],
    needToKnow: [],
    itinerary: [],
    modules: [],
    locations: emptyViajesLocations(lane),
    provider: emptyViajesProvider(),
    contact: {
      primaryCtaType: "whatsapp",
      displayName: "",
      phone: "",
      phoneRaw: "",
      phoneOffice: "",
      phoneOfficeRaw: "",
      whatsapp: "",
      whatsappRaw: "",
      email: "",
      website: "",
    },
    source: {
      lane,
      providerOfRecord: "",
      disclosure: "",
      outboundUrl: "",
      campaignId: "",
      placementId: "",
      affiliateNetworkMeta: "",
    },
    lifecycle: {
      locale,
    },
  };
}

export function createViajesMediaAssetDraft(partial?: Partial<ViajesMediaAssetV2>): ViajesMediaAssetV2 {
  return {
    id: newViajesStableId("media"),
    url: "",
    alt: "",
    galleryOrder: 0,
    isHero: false,
    isResultsCard: false,
    focal: { x: 0.5, y: 0.5 },
    uploadStatus: "local_pending",
    createdAt: new Date().toISOString(),
    localIdbKey: null,
    uploadErrorCode: null,
    uploadProgressPct: 0,
    moduleId: null,
    ...partial,
  };
}

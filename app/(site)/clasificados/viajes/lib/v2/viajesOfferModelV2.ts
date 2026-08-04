/** Canonical Viajes offer contract — schemaVersion 2. */

export type ViajesLane = "affiliate" | "business" | "private" | "editorial";

export type ViajesOfferKind =
  | "day_activity"
  | "day_trip"
  | "weekend_getaway"
  | "tour_excursion"
  | "cruise"
  | "resort_hotel"
  | "vacation_rental"
  | "vacation_package"
  | "group_trip"
  | "transportation_transfer"
  | "flight_inclusive_package"
  | "car_rental"
  | "other";

export type ViajesMediaUploadStatus =
  | "local_pending"
  | "uploading"
  | "uploaded"
  | "failed"
  | "removing";

export type ViajesMediaFocal = { x: number; y: number };

export type ViajesMediaCrop = {
  aspect?: "16:9" | "4:3" | "1:1" | "free";
  x?: number;
  y?: number;
  w?: number;
  h?: number;
};

export type ViajesMediaAssetV2 = {
  id: string;
  url: string;
  pathname?: string;
  mimeType?: string;
  byteSize?: number;
  width?: number;
  height?: number;
  alt: string;
  galleryOrder: number;
  isHero: boolean;
  isResultsCard: boolean;
  focal: ViajesMediaFocal;
  crop?: ViajesMediaCrop;
  moduleId?: string | null;
  uploadStatus: ViajesMediaUploadStatus;
  createdAt?: string;
  /** Draft-only — never serialize to staged/public */
  localPreviewObjectUrl?: string;
  localIdbKey?: string | null;
  localFileName?: string;
  uploadErrorCode?: string | null;
  uploadProgressPct?: number;
};

export type ViajesExternalVideoV2 = {
  id: string;
  url: string;
};

export type ViajesMediaV2 = {
  images: ViajesMediaAssetV2[];
  videos: ViajesExternalVideoV2[];
};

export type ViajesStructuredAddress = {
  street: string;
  unit: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  country: string;
  publicLabel: string;
  showPublicly: boolean;
  showMap: boolean;
};

export type ViajesLocationsV2 = {
  destination: ViajesStructuredAddress;
  departureMeetingPort: ViajesStructuredAddress;
  providerOffice: ViajesStructuredAddress;
  privateExact: ViajesStructuredAddress;
};

export type ViajesPillItem = {
  id: string;
  label: string;
};

export type ViajesModuleBase = {
  id: string;
  imageId?: string | null;
  description: string;
};

export type ViajesAccommodationModule = ViajesModuleBase & {
  kind: "accommodation";
  propertyType: string;
  roomOrOccupancy: string;
  nights: string;
};

export type ViajesTransportationModule = ViajesModuleBase & {
  kind: "transportation";
  mode: string;
  provider: string;
  origin: string;
  destination: string;
};

export type ViajesFoodModule = ViajesModuleBase & {
  kind: "food";
  mealPlanOrName: string;
  quantityOrFrequency: string;
  dietaryNote: string;
};

export type ViajesActivityModule = ViajesModuleBase & {
  kind: "activity";
  activityName: string;
  venue: string;
  duration: string;
  dateTime: string;
  locationLabel: string;
};

export type ViajesCruiseModule = ViajesModuleBase & {
  kind: "cruise";
  ship: string;
  departurePort: string;
  returnPort: string;
  nights: string;
  cabinNote: string;
  portsStops: string;
};

export type ViajesFlightModule = ViajesModuleBase & {
  kind: "flight";
  airline: string;
  origin: string;
  destination: string;
  cabinBaggageNote: string;
  connectionNote: string;
};

export type ViajesVacationRentalModule = ViajesModuleBase & {
  kind: "vacation_rental";
  propertyType: string;
  capacity: string;
  bedrooms: string;
  baths: string;
  amenitiesNote: string;
};

export type ViajesCarRentalModule = ViajesModuleBase & {
  kind: "car_rental";
  pickupLocation: string;
  dropoffLocation: string;
  dateWindow: string;
  vehicleClass: string;
  capacity: string;
  provider: string;
  startingPrice: string;
  mileageSummary: string;
  fuelSummary: string;
  ageRequirement: string;
  depositSummary: string;
  providerCtaUrl: string;
};

export type ViajesAddonModule = ViajesModuleBase & {
  kind: "addon";
  name: string;
  priceOrIncluded: string;
};

export type ViajesTravelModule =
  | ViajesAccommodationModule
  | ViajesTransportationModule
  | ViajesFoodModule
  | ViajesActivityModule
  | ViajesCruiseModule
  | ViajesFlightModule
  | ViajesVacationRentalModule
  | ViajesCarRentalModule
  | ViajesAddonModule;

export type ViajesItineraryItem = {
  id: string;
  dayLabel: string;
  title: string;
  description: string;
  locationLabel: string;
  imageId?: string | null;
};

export type ViajesProviderProfileV2 = {
  id: string;
  logoUrl: string;
  logoPathname?: string;
  name: string;
  type: string;
  description: string;
  profileRoute: string;
  website: string;
  bookingUrl: string;
  phone: string;
  phoneRaw: string;
  sms: string;
  smsRaw: string;
  whatsapp: string;
  whatsappRaw: string;
  email: string;
  directionsUrl: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTiktok: string;
  socialYoutube: string;
  socialX: string;
  socialLinkedin: string;
  socialSnapchat: string;
  socialPinterest: string;
};

export type ViajesContactV2 = {
  primaryCtaType: "whatsapp" | "phone" | "email" | "website" | "booking";
  displayName: string;
  phone: string;
  phoneRaw: string;
  phoneOffice: string;
  phoneOfficeRaw: string;
  whatsapp: string;
  whatsappRaw: string;
  email: string;
  website: string;
};

export type ViajesScheduleV2 = {
  dateMode: "fixed" | "flexible" | "seasonal";
  startDate: string;
  endDate: string;
  note: string;
  legacyFechas: string;
};

export type ViajesPricingV2 = {
  priceFrom: string;
  currencyNote: string;
  budgetBand: "" | "economico" | "moderado" | "premium";
};

export type ViajesBasicsV2 = {
  title: string;
  destinationLabel: string;
  departureLabel: string;
  durationLabel: string;
  audienceFamilies: boolean;
  audienceCouples: boolean;
  audienceGroups: boolean;
  spanishGuide: boolean;
  serviceLanguage: string;
};

export type ViajesSourceContractV2 = {
  lane: ViajesLane;
  providerOfRecord: string;
  disclosure: string;
  outboundUrl: string;
  campaignId: string;
  placementId: string;
  affiliateNetworkMeta: string;
};

export type ViajesLifecycleV2 = {
  stagedListingId?: string;
  slug?: string;
  leonixAdId?: string | null;
  ownerUserId?: string | null;
  locale: "es" | "en";
};

export type ViajesOfferModelV2 = {
  schemaVersion: 2;
  id: string;
  canonicalLeonixId?: string;
  lane: ViajesLane;
  offerKind: ViajesOfferKind;
  locale: "es" | "en";
  basics: ViajesBasicsV2;
  story: string;
  schedule: ViajesScheduleV2;
  pricing: ViajesPricingV2;
  media: ViajesMediaV2;
  highlights: ViajesPillItem[];
  inclusions: ViajesPillItem[];
  exclusions: ViajesPillItem[];
  amenities: ViajesPillItem[];
  policies: ViajesPillItem[];
  accessibility: ViajesPillItem[];
  needToKnow: ViajesPillItem[];
  itinerary: ViajesItineraryItem[];
  modules: ViajesTravelModule[];
  locations: ViajesLocationsV2;
  provider: ViajesProviderProfileV2;
  contact: ViajesContactV2;
  source: ViajesSourceContractV2;
  lifecycle: ViajesLifecycleV2;
};

export type ViajesStagedListingJsonV2 = {
  version: 2;
  offer: ViajesOfferModelV2;
};

export const VIAJES_MEDIA_MAX_IMAGES = 20;
export const VIAJES_MEDIA_MAX_VIDEOS = 4;
export const VIAJES_MEDIA_MAX_BYTES = 12 * 1024 * 1024;

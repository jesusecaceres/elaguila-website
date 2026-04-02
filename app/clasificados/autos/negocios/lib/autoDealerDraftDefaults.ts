import type { AutoDealerListing, DealerHoursEntry } from "../types/autoDealerListing";

/** Optional starting point for the hours editor (form button). */
export const WEEKDAY_HOURS_TEMPLATE: DealerHoursEntry[] = [
  { day: "Lunes", open: "09:00", close: "18:00", closed: false },
  { day: "Martes", open: "09:00", close: "18:00", closed: false },
  { day: "Miércoles", open: "09:00", close: "18:00", closed: false },
  { day: "Jueves", open: "09:00", close: "18:00", closed: false },
  { day: "Viernes", open: "09:00", close: "18:00", closed: false },
  { day: "Sábado", open: "10:00", close: "16:00", closed: false },
  { day: "Domingo", open: "", close: "", closed: true },
];

export function createEmptyListing(): AutoDealerListing {
  return {
    vehicleTitle: undefined,
    year: undefined,
    make: undefined,
    model: undefined,
    trim: undefined,
    condition: undefined,
    price: undefined,
    monthlyEstimate: undefined,
    mileage: undefined,
    city: undefined,
    state: undefined,
    vin: undefined,
    stockNumber: undefined,
    exteriorColor: undefined,
    interiorColor: undefined,
    drivetrain: undefined,
    transmission: undefined,
    engine: undefined,
    fuelType: undefined,
    mpgCity: undefined,
    mpgHighway: undefined,
    bodyStyle: undefined,
    doors: undefined,
    seats: undefined,
    titleStatus: undefined,
    badges: [],
    features: [],
    description: undefined,
    heroImages: [],
    videoUrl: undefined,
    dealerName: undefined,
    dealerLogo: undefined,
    dealerPhone: undefined,
    dealerAddress: undefined,
    dealerHours: [],
    dealerWebsite: undefined,
    dealerSocials: {},
    dealerRating: undefined,
    dealerReviewCount: undefined,
    relatedDealerListings: [],
  };
}

export function normalizeLoadedListing(raw: Partial<AutoDealerListing> | undefined): AutoDealerListing {
  const base = createEmptyListing();
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    badges: Array.isArray(raw.badges) ? raw.badges : base.badges,
    features: Array.isArray(raw.features) ? raw.features : base.features,
    heroImages: Array.isArray(raw.heroImages) ? raw.heroImages : base.heroImages,
    dealerHours: Array.isArray(raw.dealerHours) ? raw.dealerHours : base.dealerHours,
    dealerSocials: raw.dealerSocials && typeof raw.dealerSocials === "object" ? raw.dealerSocials : base.dealerSocials,
    relatedDealerListings: Array.isArray(raw.relatedDealerListings) ? raw.relatedDealerListings : base.relatedDealerListings,
  };
}

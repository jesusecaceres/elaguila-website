/**
 * Dealership vehicle open-card listing — maps 1:1 from application data (Phase 2).
 * Preview and live route share the same shape.
 */

export type VehicleBadge =
  | "certified"
  | "new"
  | "used"
  | "clean_title"
  | "one_owner"
  | "low_miles";

export type DealerSocialKey = "instagram" | "facebook" | "youtube" | "tiktok" | "website";

export type DealerSocials = Partial<Record<DealerSocialKey, string>>;

export type DealerHoursRow = {
  /** e.g. "Lun–Vie" */
  days: string;
  /** e.g. "9:00 a.m. – 7:00 p.m." */
  hours: string;
};

export type RelatedDealerListing = {
  id: string;
  imageUrl: string;
  year: number;
  make: string;
  model: string;
  price: number;
  mileage: number;
  /** Live detail URL — preview uses # */
  href: string;
};

export type AutoDealerListing = {
  vehicleTitle: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  condition: "new" | "used" | "certified";
  price: number;
  monthlyEstimate: string | null;
  mileage: number;
  city: string;
  state: string;
  vin: string;
  stockNumber: string;
  exteriorColor: string;
  interiorColor: string;
  drivetrain: string;
  transmission: string;
  engine: string;
  fuelType: string;
  mpgCity: number | null;
  mpgHighway: number | null;
  bodyStyle: string;
  doors: number;
  seats: number;
  titleStatus: string;
  badges: VehicleBadge[];
  features: string[];
  /** Dealer-written summary for the listing detail page. */
  description: string;
  heroImages: string[];
  videoUrl: string | null;
  dealerName: string;
  dealerLogo: string | null;
  dealerPhone: string;
  dealerAddress: string;
  dealerHours: DealerHoursRow[];
  dealerWebsite: string | null;
  dealerSocials: DealerSocials;
  dealerRating: number;
  dealerReviewCount: number;
  relatedDealerListings: RelatedDealerListing[];
};

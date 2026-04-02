/**
 * Dealership vehicle open-card listing — maps 1:1 from application data.
 * Preview and live route share the same shape. Optional fields omit from UI when empty.
 */

export type VehicleBadge =
  | "certified"
  | "new"
  | "used"
  | "clean_title"
  | "one_owner"
  | "low_miles"
  | "dealer_maintained";

export type DealerSocialKey = "instagram" | "facebook" | "youtube" | "tiktok" | "website";

export type DealerSocials = Partial<Record<DealerSocialKey, string>>;

/** Structured business hours (form + preview). */
export type DealerHoursEntry = {
  day: string;
  open: string;
  close: string;
  closed: boolean;
};

export type RelatedDealerListing = {
  id: string;
  imageUrl: string;
  year: number;
  make: string;
  model: string;
  price: number;
  mileage: number;
  href: string;
};

export type AutoDealerListing = {
  vehicleTitle?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  condition?: "new" | "used" | "certified";
  price?: number;
  monthlyEstimate?: string | null;
  mileage?: number;
  city?: string;
  state?: string;
  vin?: string;
  stockNumber?: string;
  exteriorColor?: string;
  interiorColor?: string;
  drivetrain?: string;
  transmission?: string;
  engine?: string;
  fuelType?: string;
  mpgCity?: number | null;
  mpgHighway?: number | null;
  bodyStyle?: string;
  doors?: number;
  seats?: number;
  titleStatus?: string;
  badges?: VehicleBadge[];
  features?: string[];
  description?: string;
  heroImages?: string[];
  videoUrl?: string | null;
  dealerName?: string;
  dealerLogo?: string | null;
  dealerPhone?: string;
  dealerAddress?: string;
  dealerHours?: DealerHoursEntry[];
  dealerWebsite?: string | null;
  dealerSocials?: DealerSocials;
  dealerRating?: number;
  dealerReviewCount?: number;
  relatedDealerListings?: RelatedDealerListing[];
};
